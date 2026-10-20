import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import io from "socket.io-client";
import server from "../environment";
import { AuthContext } from "./AuthContext";

export const DirectCallContext = createContext({});

const DEFAULT_ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
];

/**
 * Lightweight Web Audio API ringtone synthesizer.
 * Does not require any external audio assets and operates safely across browsers.
 */
class RingtoneEngine {
    constructor() {
        this.audioCtx = null;
        this.timer = null;
    }

    _getAudioContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
    }

    startRing(mode = "incoming") {
        this.stop();
        try {
            const ctx = this._getAudioContext();
            if (!ctx) return;

            const playNote = () => {
                if (!this.audioCtx || this.audioCtx.state !== "running") return;
                const now = this.audioCtx.currentTime;

                if (mode === "incoming") {
                    // Pleasant two-tone chime for incoming call (523Hz C5 -> 659Hz E5)
                    const osc1 = this.audioCtx.createOscillator();
                    const osc2 = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();

                    osc1.type = "sine";
                    osc2.type = "sine";
                    osc1.frequency.setValueAtTime(523.25, now);
                    osc2.frequency.setValueAtTime(659.25, now + 0.15);

                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(this.audioCtx.destination);

                    osc1.start(now);
                    osc1.stop(now + 0.15);
                    osc2.start(now + 0.15);
                    osc2.stop(now + 0.7);
                } else {
                    // Subtle periodic ringback tone for caller (440Hz tone)
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();

                    osc.type = "sine";
                    osc.frequency.setValueAtTime(440, now);

                    gain.gain.setValueAtTime(0.03, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);

                    osc.start(now);
                    osc.stop(now + 0.9);
                }
            };

            playNote();
            this.timer = setInterval(playNote, mode === "incoming" ? 1800 : 2500);
        } catch (e) {
            // Autoplay policies may suppress audio before first user interaction
        }
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

const ringtone = new RingtoneEngine();

export const DirectCallProvider = ({ children }) => {
    const { token, getIceServers } = useContext(AuthContext);

    // Call state: 'idle' | 'outgoing_ringing' | 'incoming_ringing' | 'connecting' | 'connected' | 'declined' | 'busy' | 'no_answer' | 'ended'
    const [callState, setCallState] = useState("idle");
    const [callSession, setCallSession] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [callError, setCallError] = useState(null);

    // Refs
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const callSessionRef = useRef(null);
    const timerRef = useRef(null);
    const autoCloseTimeoutRef = useRef(null);

    callSessionRef.current = callSession;

    // Synchronize media refs
    localStreamRef.current = localStream;
    remoteStreamRef.current = remoteStream;

    // -------------------------------------------------------------
    // Stop local media tracks cleanly
    // -------------------------------------------------------------
    const stopLocalMedia = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch (e) {
                    console.warn("[DirectCall] Error stopping track:", e);
                }
            });
            localStreamRef.current = null;
            setLocalStream(null);
        }
    }, []);

    // -------------------------------------------------------------
    // Tear down PeerConnection cleanly
    // -------------------------------------------------------------
    const closePeerConnection = useCallback(() => {
        if (pcRef.current) {
            try {
                pcRef.current.ontrack = null;
                pcRef.current.onicecandidate = null;
                pcRef.current.oniceconnectionstatechange = null;
                pcRef.current.close();
            } catch (e) {
                console.warn("[DirectCall] Error closing peer connection:", e);
            }
            pcRef.current = null;
        }
        pendingCandidatesRef.current = [];
        setRemoteStream(null);
    }, []);

    // -------------------------------------------------------------
    // Reset all call state back to idle
    // -------------------------------------------------------------
    const resetCallState = useCallback(() => {
        ringtone.stop();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (autoCloseTimeoutRef.current) {
            clearTimeout(autoCloseTimeoutRef.current);
            autoCloseTimeoutRef.current = null;
        }

        stopLocalMedia();
        closePeerConnection();

        setCallState("idle");
        setCallSession(null);
        setCallDuration(0);
        setStatusMessage("");
        setCallError(null);
        setAudioEnabled(true);
        setVideoEnabled(true);
    }, [stopLocalMedia, closePeerConnection]);

    // Schedule auto-reset after terminal statuses
    const scheduleAutoClose = useCallback((delayMs = 2500) => {
        if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
        autoCloseTimeoutRef.current = setTimeout(() => {
            resetCallState();
        }, delayMs);
    }, [resetCallState]);

    // -------------------------------------------------------------
    // Acquire local camera/microphone stream
    // -------------------------------------------------------------
    const acquireLocalMedia = useCallback(async () => {
        try {
            if (localStreamRef.current && localStreamRef.current.active) {
                return localStreamRef.current;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            setAudioEnabled(true);
            setVideoEnabled(true);
            return stream;
        } catch (err) {
            console.error("[DirectCall] Camera/Microphone access error:", err);
            let msg = "Could not access camera or microphone.";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                msg = "Camera and microphone permissions were denied. Please grant permission in your browser.";
            } else if (err.name === "NotFoundError") {
                msg = "No camera or microphone device found.";
            }
            setCallError(msg);
            throw new Error(msg);
        }
    }, []);

    // -------------------------------------------------------------
    // Create RTCPeerConnection instance with configured ICE servers
    // -------------------------------------------------------------
    const createPeerConnection = useCallback(async (session, myStream) => {
        closePeerConnection();

        let iceServers = DEFAULT_ICE_SERVERS;
        if (typeof getIceServers === "function") {
            try {
                const fetched = await getIceServers();
                if (fetched && Array.isArray(fetched.iceServers) && fetched.iceServers.length > 0) {
                    iceServers = fetched.iceServers;
                }
            } catch (e) {
                console.warn("[DirectCall] Could not fetch ICE servers from backend, using default STUN:", e);
            }
        }

        const pc = new RTCPeerConnection({
            iceServers,
            iceTransportPolicy: "all",
        });

        // Add local tracks
        if (myStream) {
            myStream.getTracks().forEach((track) => {
                try {
                    pc.addTrack(track, myStream);
                } catch (e) {
                    console.warn("[DirectCall] addTrack error:", e);
                }
            });
        }

        // Handle remote stream tracks
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current && session) {
                const partnerId = session.partner?._id || session.partner?.id || session.partner;
                socketRef.current.emit("call:signal", {
                    callId: session.callId,
                    targetUserId: partnerId?.toString(),
                    signal: {
                        type: "candidate",
                        candidate: event.candidate,
                    },
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "failed") {
                console.warn("[DirectCall] ICE Connection failed.");
            }
        };

        pcRef.current = pc;
        return pc;
    }, [closePeerConnection, getIceServers]);

    // -------------------------------------------------------------
    // Flush queued ICE candidates after remote description is set
    // -------------------------------------------------------------
    const flushPendingIceCandidates = useCallback(async (pc) => {
        if (!pc || !pc.remoteDescription) return;
        while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.warn("[DirectCall] Error adding queued ICE candidate:", e);
            }
        }
    }, []);

    // -------------------------------------------------------------
    // 1. INITIATE DIRECT CALL (Caller Action)
    // -------------------------------------------------------------
    const initiateDirectCall = useCallback(async (targetUser, conversationId = null) => {
        if (!targetUser || (!targetUser._id && !targetUser.id)) {
            console.error("[DirectCall] Target user required to initiate call");
            return;
        }

        const targetUserId = (targetUser._id || targetUser.id).toString();

        try {
            // 1. Acquire local camera & microphone
            await acquireLocalMedia();

            setCallError(null);
            setStatusMessage(`Calling ${targetUser.name || "user"}...`);
            setCallState("outgoing_ringing");
            ringtone.startRing("outgoing");

            // 2. Emit call:initiate to server
            if (!socketRef.current || !socketRef.current.connected) {
                throw new Error("Video calling server connection not ready. Please try again.");
            }

            const response = await new Promise((resolve) => {
                socketRef.current.emit(
                    "call:initiate",
                    { targetUserId, conversationId },
                    resolve
                );
            });

            if (!response || !response.success) {
                ringtone.stop();
                stopLocalMedia();

                const code = response?.code;
                let errMsg = response?.message || "Failed to start call";

                if (code === "USER_BUSY") {
                    setCallState("busy");
                    setStatusMessage(`${targetUser.name || "User"} is currently busy on another call.`);
                    scheduleAutoClose(3000);
                    return;
                }
                if (code === "CALL_UNAUTHORIZED") {
                    setCallState("declined");
                    setStatusMessage("Video calling requires an active, accepted connection.");
                    scheduleAutoClose(3500);
                    return;
                }
                if (code === "BLOCKED_USER") {
                    setCallState("declined");
                    setStatusMessage("Cannot call this user.");
                    scheduleAutoClose(2500);
                    return;
                }

                setCallState("idle");
                setCallError(errMsg);
                return;
            }

            // Successfully ringing
            const session = {
                callId: response.callId,
                role: "caller",
                partner: targetUser,
                conversationId,
            };
            setCallSession(session);
        } catch (err) {
            console.error("[DirectCall] initiateDirectCall error:", err);
            ringtone.stop();
            stopLocalMedia();
            setCallState("idle");
            setCallError(err.message || "Failed to start video call");
        }
    }, [acquireLocalMedia, scheduleAutoClose, stopLocalMedia]);

    // -------------------------------------------------------------
    // 2. ACCEPT INCOMING CALL (Callee Action)
    // -------------------------------------------------------------
    const acceptDirectCall = useCallback(async () => {
        const session = callSessionRef.current;
        if (!session || !session.callId) return;

        ringtone.stop();

        try {
            setStatusMessage("Connecting video call...");
            setCallState("connecting");

            // 1. Acquire local camera & microphone
            const stream = await acquireLocalMedia();

            // 2. Create peer connection
            await createPeerConnection(session, stream);

            // 3. Emit call:accept to server
            if (socketRef.current) {
                socketRef.current.emit("call:accept", { callId: session.callId }, (ack) => {
                    if (ack && ack.success) {
                        socketRef.current.emit("call:join", {
                            callId: session.callId,
                            targetUserId: (session.partner?._id || session.partner?.id)?.toString(),
                        });
                    }
                });
            }
        } catch (err) {
            console.error("[DirectCall] acceptDirectCall error:", err);
            ringtone.stop();
            stopLocalMedia();
            closePeerConnection();
            setCallState("idle");
            setCallError(err.message || "Could not accept video call");
        }
    }, [acquireLocalMedia, createPeerConnection, closePeerConnection, stopLocalMedia]);

    // -------------------------------------------------------------
    // 3. DECLINE INCOMING CALL (Callee Action)
    // -------------------------------------------------------------
    const declineDirectCall = useCallback(() => {
        const session = callSessionRef.current;
        ringtone.stop();

        if (session && session.callId && socketRef.current) {
            const partnerId = session.partner?._id || session.partner?.id;
            socketRef.current.emit("call:decline", {
                callId: session.callId,
                targetUserId: partnerId ? partnerId.toString() : null,
            });
        }

        resetCallState();
    }, [resetCallState]);

    // -------------------------------------------------------------
    // 4. END ACTIVE CALL (Either Participant)
    // -------------------------------------------------------------
    const endDirectCall = useCallback(() => {
        const session = callSessionRef.current;
        ringtone.stop();

        if (session && session.callId && socketRef.current) {
            const partnerId = session.partner?._id || session.partner?.id;
            socketRef.current.emit("call:end", {
                callId: session.callId,
                targetUserId: partnerId ? partnerId.toString() : null,
            });
        }

        setStatusMessage("Call ended");
        setCallState("ended");
        scheduleAutoClose(1800);
    }, [scheduleAutoClose]);

    // -------------------------------------------------------------
    // 5. MEDIA CONTROLS (Mute / Camera Toggle)
    // -------------------------------------------------------------
    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            if (audioTracks.length > 0) {
                const nextState = !audioTracks[0].enabled;
                audioTracks.forEach((t) => {
                    t.enabled = nextState;
                });
                setAudioEnabled(nextState);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            if (videoTracks.length > 0) {
                const nextState = !videoTracks[0].enabled;
                videoTracks.forEach((t) => {
                    t.enabled = nextState;
                });
                setVideoEnabled(nextState);
            }
        }
    }, []);

    // -------------------------------------------------------------
    // Call duration timer (Connected state)
    // -------------------------------------------------------------
    useEffect(() => {
        if (callState === "connected") {
            setCallDuration(0);
            timerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [callState]);

    // -------------------------------------------------------------
    // Socket.IO Connection & Event Handlers
    // -------------------------------------------------------------
    useEffect(() => {
        if (!token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const socket = io(server, {
            auth: { token },
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        // 1. INCOMING CALL EVENT (Callee received call from partner)
        socket.on("call:incoming", ({ callId, caller, conversationId }) => {
            // If already busy on another call or currently in random video pool, report busy
            const inRandomVideo = typeof window !== "undefined" && (
                window.location.pathname.startsWith("/random-video") ||
                window.location.pathname.startsWith("/random-call")
            );
            if (callSessionRef.current || inRandomVideo) {
                socket.emit("call:busy", { targetUserId: caller?._id });
                return;
            }

            setCallSession({
                callId,
                role: "callee",
                partner: caller,
                conversationId,
            });
            setCallState("incoming_ringing");
            setStatusMessage(`Incoming video call from ${caller?.name || "someone"}...`);
            ringtone.startRing("incoming");
        });

        // 2. CALL ACCEPTED EVENT (Caller notified that Callee accepted)
        socket.on("call:accepted", async ({ callId }) => {
            ringtone.stop();
            const session = callSessionRef.current;
            if (!session || session.callId !== callId) return;

            try {
                setStatusMessage("Partner connected. Setting up media...");
                setCallState("connecting");

                // Caller creates RTCPeerConnection and initiates SDP offer
                const pc = await createPeerConnection(session, localStreamRef.current);

                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                });
                await pc.setLocalDescription(offer);

                const partnerId = (session.partner?._id || session.partner?.id)?.toString();
                socket.emit("call:signal", {
                    callId,
                    targetUserId: partnerId,
                    signal: offer,
                });
            } catch (err) {
                console.error("[DirectCall] Error sending offer on call:accepted:", err);
                endDirectCall();
            }
        });

        // 3. CALL DECLINED EVENT
        socket.on("call:declined", () => {
            ringtone.stop();
            setStatusMessage("Call was declined.");
            setCallState("declined");
            scheduleAutoClose(2500);
        });

        // 4. CALL BUSY EVENT
        socket.on("call:busy", () => {
            ringtone.stop();
            setStatusMessage("User is currently busy on another call.");
            setCallState("busy");
            scheduleAutoClose(2500);
        });

        // 5. CALL NO-ANSWER / TIMEOUT EVENT
        socket.on("call:no-answer", () => {
            ringtone.stop();
            setStatusMessage("No answer.");
            setCallState("no_answer");
            scheduleAutoClose(2500);
        });

        // 6. CALL ENDED EVENT
        socket.on("call:ended", ({ reason }) => {
            ringtone.stop();
            const msg = reason === "timeout" ? "Call timed out." : "Call ended by partner.";
            setStatusMessage(msg);
            setCallState("ended");
            scheduleAutoClose(2000);
        });

        // 7. WEBRTC SIGNALING ROUTING (Offer / Answer / ICE Candidates)
        socket.on("call:signal", async ({ callId, senderId, signal }) => {
            const session = callSessionRef.current;
            if (!session || session.callId !== callId) return;

            try {
                let pc = pcRef.current;

                if (signal.type === "offer") {
                    // Callee received offer from caller
                    if (!pc) {
                        pc = await createPeerConnection(session, localStreamRef.current);
                    }
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    await flushPendingIceCandidates(pc);

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    socket.emit("call:signal", {
                        callId,
                        targetUserId: senderId?.toString(),
                        signal: answer,
                    });

                    setCallState("connected");
                    setStatusMessage("Connected");
                } else if (signal.type === "answer") {
                    // Caller received answer from callee
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal));
                        await flushPendingIceCandidates(pc);
                        setCallState("connected");
                        setStatusMessage("Connected");
                    }
                } else if (signal.type === "candidate" && signal.candidate) {
                    // Either side received an ICE candidate
                    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        } catch (e) {
                            console.warn("[DirectCall] Error adding ICE candidate:", e);
                        }
                    } else {
                        // Queue candidate until remote description is set
                        pendingCandidatesRef.current.push(signal.candidate);
                    }
                }
            } catch (err) {
                console.error("[DirectCall] Signal handling error:", err);
            }
        });

        // 8. CALL ERROR EVENT
        socket.on("call:error", (err) => {
            console.error("[DirectCall] Socket call:error:", err);
            if (err?.code === "CALL_UNAUTHORIZED") {
                setStatusMessage("Video calling requires an active, accepted connection.");
                setCallState("declined");
                scheduleAutoClose(3000);
            } else if (err?.code === "USER_BUSY") {
                setStatusMessage("User is currently on another call.");
                setCallState("busy");
                scheduleAutoClose(2500);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [
        token,
        createPeerConnection,
        flushPendingIceCandidates,
        scheduleAutoClose,
        endDirectCall,
    ]);

    const value = useMemo(
        () => ({
            callState,
            callSession,
            localStream,
            remoteStream,
            audioEnabled,
            videoEnabled,
            callDuration,
            statusMessage,
            callError,
            initiateDirectCall,
            acceptDirectCall,
            declineDirectCall,
            endDirectCall,
            toggleAudio,
            toggleVideo,
        }),
        [
            callState,
            callSession,
            localStream,
            remoteStream,
            audioEnabled,
            videoEnabled,
            callDuration,
            statusMessage,
            callError,
            initiateDirectCall,
            acceptDirectCall,
            declineDirectCall,
            endDirectCall,
            toggleAudio,
            toggleVideo,
        ]
    );

    return (
        <DirectCallContext.Provider value={value}>
            {children}
        </DirectCallContext.Provider>
    );
};

export const useDirectCall = () => {
    return useContext(DirectCallContext);
};
