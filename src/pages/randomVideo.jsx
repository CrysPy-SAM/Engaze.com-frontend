import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import server from "../environment";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Snackbar,
    Alert,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

function RandomVideoPage() {
    const navigate = useNavigate();
    const { userData, token } = useContext(AuthContext);

    // Call state: 'idle' | 'searching' | 'connecting' | 'connected' | 'ended'
    const [callState, setCallState] = useState("idle");
    const [partner, setPartner] = useState(null);
    const [callId, setCallId] = useState(null);
    const [searchDuration, setSearchDuration] = useState(0);

    // Media states
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [mediaError, setMediaError] = useState("");
    const [permissionDeniedDialog, setPermissionDeniedDialog] = useState(false);
    const [endReasonNotice, setEndReasonNotice] = useState("");
    const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);

    // Notification toast
    const [toastMessage, setToastMessage] = useState("");
    const [toastSeverity, setToastSeverity] = useState("info");
    const [openToast, setOpenToast] = useState(false);

    // Refs
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const iceCandidateQueue = useRef([]);
    const pendingSignalsRef = useRef([]);
    const isInitiatorRef = useRef(false);
    const activeCallIdRef = useRef(null);
    const timerRef = useRef(null);

    const showToast = useCallback((msg, severity = "info") => {
        setToastMessage(msg);
        setToastSeverity(severity);
        setOpenToast(true);
    }, []);

    // -------------------------------------------------------------
    // Audio Route & Playback Recovery Engine
    // -------------------------------------------------------------
    const resumeRemoteAudio = useCallback(async () => {
        const videoEl = remoteVideoRef.current;
        if (!videoEl) return;

        try {
            // Reset sinkId to system default output (built-in speaker on mobile)
            if (typeof videoEl.setSinkId === "function") {
                try {
                    await videoEl.setSinkId("");
                } catch (sinkErr) {
                    console.warn("[WebRTC Audio] setSinkId('') error:", sinkErr);
                }
            }

            videoEl.muted = false;
            videoEl.volume = 1.0;

            if (videoEl.paused) {
                console.log("[WebRTC Audio] Resuming paused remote video/audio element");
                await videoEl.play();
            }
            setAudioPlaybackBlocked(false);
        } catch (err) {
            console.warn("[WebRTC Audio] resumeRemoteAudio error:", err);
            if (err.name === "NotAllowedError" || err.name === "NotSupportedError") {
                setAudioPlaybackBlocked(true);
            }
        }
    }, []);

    const recoverLocalAudioTrack = useCallback(async () => {
        if (!localStreamRef.current || !pcRef.current) return;

        const currentAudioTracks = localStreamRef.current.getAudioTracks();
        const isTrackDead =
            currentAudioTracks.length === 0 ||
            currentAudioTracks.some((t) => t.readyState === "ended");

        if (isTrackDead) {
            console.log("[WebRTC Audio] Local audio track ended after device change. Re-acquiring microphone...");
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });
                const newAudioTrack = newStream.getAudioTracks()[0];
                if (!newAudioTrack) return;

                currentAudioTracks.forEach((t) => t.stop());
                currentAudioTracks.forEach((t) => localStreamRef.current.removeTrack(t));
                localStreamRef.current.addTrack(newAudioTrack);

                const senders = pcRef.current.getSenders();
                const audioSender = senders.find((s) => s.track && s.track.kind === "audio");
                if (audioSender) {
                    await audioSender.replaceTrack(newAudioTrack);
                    console.log("[WebRTC Audio] Successfully replaced audio track on RTCRtpSender with built-in mic");
                }
            } catch (err) {
                console.warn("[WebRTC Audio] Could not re-acquire local microphone:", err);
            }
        }
    }, []);

    // -------------------------------------------------------------
    // 1. Initialize Local Media Stream
    // -------------------------------------------------------------
    const initializeMedia = useCallback(async () => {
        try {
            if (localStreamRef.current) {
                return localStreamRef.current;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play().catch(() => {});
            }
            setMediaError("");
            return stream;
        } catch (err) {
            console.error("Camera/Mic access error:", err);
            let msg = "Could not access camera or microphone.";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                msg = "Camera and microphone permissions were denied. Please allow camera and mic permissions in your browser.";
                setPermissionDeniedDialog(true);
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                msg = "No camera or microphone device found on this system.";
            }
            setMediaError(msg);
            showToast(msg, "error");
            return null;
        }
    }, [showToast]);

    // Cleanup WebRTC connection
    const cleanupPeerConnection = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.onconnectionstatechange = null;
            try {
                pcRef.current.close();
            } catch (e) {
                console.warn("[WebRTC] Error closing peer connection:", e);
            }
            pcRef.current = null;
        }
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach((track) => track.stop());
            remoteStreamRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.pause();
            remoteVideoRef.current.srcObject = null;
        }
        setAudioPlaybackBlocked(false);
        iceCandidateQueue.current = [];
        pendingSignalsRef.current = [];
        isInitiatorRef.current = false;
        activeCallIdRef.current = null;
    }, []);

    // -------------------------------------------------------------
    // 2. Setup WebRTC PeerConnection for an Active Call
    // -------------------------------------------------------------
    const createPeerConnection = useCallback((currentCallId, isInitiator) => {
        cleanupPeerConnection();

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        activeCallIdRef.current = currentCallId;
        isInitiatorRef.current = isInitiator;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.ontrack = (event) => {
            console.log("[WebRTC] ontrack received track:", event.track.kind);
            let stream = remoteStreamRef.current;
            if (!stream) {
                stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream();
                remoteStreamRef.current = stream;
            }
            if (event.streams && event.streams[0]) {
                remoteStreamRef.current = event.streams[0];
            } else {
                if (!stream.getTracks().includes(event.track)) {
                    stream.addTrack(event.track);
                }
            }

            // Route & unmute recovery listeners for audio track
            if (event.track.kind === "audio") {
                const audioTrack = event.track;
                audioTrack.onmute = () => {
                    console.log("[WebRTC Audio] Remote audio track muted (switching route/device)");
                };
                audioTrack.onunmute = () => {
                    console.log("[WebRTC Audio] Remote audio track unmuted - restoring audio playback");
                    resumeRemoteAudio();
                };
                audioTrack.onended = () => {
                    console.log("[WebRTC Audio] Remote audio track ended");
                };
            }

            // Always transition callState to connected immediately upon receiving remote track
            setCallState("connected");

            if (remoteVideoRef.current && remoteStreamRef.current) {
                if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
                    remoteVideoRef.current.srcObject = remoteStreamRef.current;
                }
                remoteVideoRef.current.play().catch((err) => {
                    console.warn("[WebRTC] remote video play error:", err);
                    if (err.name === "NotAllowedError") {
                        setAudioPlaybackBlocked(true);
                    }
                });
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current && activeCallIdRef.current === currentCallId) {
                socketRef.current.emit("random:signal", {
                    callId: currentCallId,
                    signalData: {
                        type: "ice-candidate",
                        candidate: event.candidate,
                    },
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log("[WebRTC] connectionState:", pc.connectionState);
            if (pc.connectionState === "connected") {
                setCallState("connected");
            } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                showToast("Video connection interrupted.", "warning");
            }
        };

        return pc;
    }, [cleanupPeerConnection, resumeRemoteAudio, showToast]);

    // Process incoming WebRTC signals
    const handleRemoteSignal = useCallback(async (signalData, currentCallId) => {
        // Discard signals that don't belong to the active call session
        if (!currentCallId || (activeCallIdRef.current && activeCallIdRef.current !== currentCallId)) {
            console.log("[WebRTC] Discarding signal from obsolete or mismatched callId:", currentCallId);
            return;
        }

        const pc = pcRef.current;
        if (!pc || activeCallIdRef.current !== currentCallId) {
            // Buffer incoming signal until peer connection finishes initialization
            if (activeCallIdRef.current === currentCallId) {
                console.log("[WebRTC] Buffering signal while peer connection is initializing:", signalData?.type);
                pendingSignalsRef.current.push({ signalData, currentCallId });
            }
            return;
        }

        try {
            if (signalData.type === "offer") {
                console.log("[WebRTC] Received offer, setting remote description");
                await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

                while (iceCandidateQueue.current.length > 0) {
                    const cand = iceCandidateQueue.current.shift();
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(cand));
                    } catch (e) {
                        console.warn("[WebRTC] Error adding queued ICE candidate:", e);
                    }
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (socketRef.current) {
                    socketRef.current.emit("random:signal", {
                        callId: currentCallId,
                        signalData: {
                            type: "answer",
                            sdp: answer,
                        },
                    });
                }
            } else if (signalData.type === "answer") {
                console.log("[WebRTC] Received answer, setting remote description");
                if (pc.signalingState === "have-local-offer") {
                    await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

                    while (iceCandidateQueue.current.length > 0) {
                        const cand = iceCandidateQueue.current.shift();
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(cand));
                        } catch (e) {
                            console.warn("[WebRTC] Error adding queued ICE candidate:", e);
                        }
                    }
                }
            } else if (signalData.type === "ice-candidate") {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                    } catch (e) {
                        console.warn("[WebRTC] Error adding ICE candidate:", e);
                    }
                } else {
                    iceCandidateQueue.current.push(signalData.candidate);
                }
            }
        } catch (err) {
            console.error("Error processing WebRTC signal:", err);
        }
    }, []);

    // -------------------------------------------------------------
    // 3. Socket Connection & Event Listeners
    // -------------------------------------------------------------
    useEffect(() => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) {
            navigate("/auth");
            return;
        }

        initializeMedia();

        const socket = io(server, {
            auth: { token: authToken },
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect_error", (err) => {
            console.error("[RandomVideo] Socket connect_error:", err.message);
            if (err.message && err.message.toLowerCase().includes("authentication error")) {
                showToast("Session expired or invalid. Please sign in again.", "error");
                navigate("/auth");
            }
        });

        socket.on("random:queue-joined", () => {
            setCallState("searching");
            showToast("Searching for an available match...", "info");
        });

        socket.on("random:matched", async ({ callId: newCallId, isInitiator, partner: matchedPartner }) => {
            activeCallIdRef.current = newCallId;
            setCallId(newCallId);
            setPartner(matchedPartner);
            setCallState("connecting");
            showToast(`Connected with ${matchedPartner?.name || "a member"}! Setting up video...`, "success");

            await initializeMedia();
            const pc = createPeerConnection(newCallId, isInitiator);

            // Drain any signals that arrived while initializeMedia was executing
            if (pendingSignalsRef.current.length > 0) {
                console.log(`[WebRTC] Processing ${pendingSignalsRef.current.length} queued signals`);
                const queued = [...pendingSignalsRef.current];
                pendingSignalsRef.current = [];
                for (const item of queued) {
                    await handleRemoteSignal(item.signalData, item.currentCallId || newCallId);
                }
            }

            if (isInitiator) {
                try {
                    const offer = await pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                    });
                    await pc.setLocalDescription(offer);

                    socket.emit("random:signal", {
                        callId: newCallId,
                        signalData: {
                            type: "offer",
                            sdp: offer,
                        },
                    });
                } catch (err) {
                    console.error("Error creating WebRTC offer:", err);
                }
            }
        });

        socket.on("random:signal", ({ callId: sigCallId, signalData }) => {
            handleRemoteSignal(signalData, sigCallId);
        });

        socket.on("random:call-ended", ({ reason }) => {
            cleanupPeerConnection();
            setCallState("ended");
            let notice = "Call has ended.";
            if (reason === "partner_disconnected") {
                notice = "Your partner disconnected.";
            } else if (reason === "ended_by_user" || reason === "ended_by_partner") {
                notice = "Your partner left the call.";
            } else if (reason === "skipped_by_partner") {
                notice = "Your partner moved to the next match.";
            }
            setEndReasonNotice(notice);
            showToast(notice, "info");
        });

        socket.on("random:queue-left", () => {
            setCallState("idle");
        });

        socket.on("random:error", ({ message }) => {
            showToast(message || "Matchmaking error", "error");
        });

        return () => {
            cleanupPeerConnection();
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
        };
    }, [token, navigate, initializeMedia, createPeerConnection, handleRemoteSignal, cleanupPeerConnection, showToast]);

    // Continuously synchronize media streams with video DOM elements whenever callState changes
    useEffect(() => {
        if (callState === "connected") {
            if (remoteVideoRef.current && remoteStreamRef.current) {
                if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
                    remoteVideoRef.current.srcObject = remoteStreamRef.current;
                }
                remoteVideoRef.current.play().catch((err) => {
                    console.warn("[WebRTC] remote video play error:", err);
                });
            }
            if (localVideoRef.current && localStreamRef.current) {
                if (localVideoRef.current.srcObject !== localStreamRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
                localVideoRef.current.play().catch((err) => {
                    console.warn("[WebRTC] local video play error:", err);
                });
            }
        } else if (callState === "idle") {
            if (localVideoRef.current && localStreamRef.current) {
                if (localVideoRef.current.srcObject !== localStreamRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
                localVideoRef.current.play().catch((err) => {
                    console.warn("[WebRTC] local preview play error:", err);
                });
            }
        }
    }, [callState]);

    useEffect(() => {
        if (callState === "searching") {
            setSearchDuration(0);
            timerRef.current = setInterval(() => {
                setSearchDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [callState]);

    // -------------------------------------------------------------
    // Hardware Audio & Routing Event Handlers (Bluetooth Disconnect Recovery)
    // -------------------------------------------------------------
    useEffect(() => {
        let deviceChangeTimeout = null;

        const handleDeviceChange = async () => {
            console.log("[WebRTC Audio] Audio device change detected (Bluetooth connect/disconnect)");
            clearTimeout(deviceChangeTimeout);
            deviceChangeTimeout = setTimeout(async () => {
                if (activeCallIdRef.current) {
                    await resumeRemoteAudio();
                    await recoverLocalAudioTrack();
                }
            }, 200);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && activeCallIdRef.current) {
                console.log("[WebRTC Audio] Tab returned to visible - verifying audio playback");
                resumeRemoteAudio();
            }
        };

        const handleWindowFocus = () => {
            if (activeCallIdRef.current) {
                resumeRemoteAudio();
            }
        };

        if (navigator.mediaDevices?.addEventListener) {
            navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            clearTimeout(deviceChangeTimeout);
            if (navigator.mediaDevices?.removeEventListener) {
                navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [resumeRemoteAudio, recoverLocalAudioTrack]);

    // -------------------------------------------------------------
    // 4. User Actions: Start, Cancel, Next, End, Mute, Camera
    // -------------------------------------------------------------
    const handleStartSearch = async () => {
        const stream = await initializeMedia();
        if (!stream) return;

        if (socketRef.current) {
            setCallState("searching");
            socketRef.current.emit("random:join-queue", {}, (ack) => {
                if (ack && !ack.success) {
                    showToast(ack.message || "Failed to join queue", "error");
                    setCallState("idle");
                }
            });
        }
    };

    const handleCancelSearch = () => {
        if (socketRef.current) {
            socketRef.current.emit("random:leave-queue", {}, () => {
                setCallState("idle");
                showToast("Search cancelled.", "info");
            });
        }
    };

    const handleNextMatch = () => {
        if (callState === "searching") return;
        const currentCallId = callId || activeCallIdRef.current;
        cleanupPeerConnection();
        setPartner(null);
        setCallId(null);
        setCallState("searching");
        if (socketRef.current) {
            socketRef.current.emit("random:next", { callId: currentCallId });
        }
    };

    const handleEndCall = () => {
        const currentCallId = callId || activeCallIdRef.current;
        cleanupPeerConnection();
        setCallState("idle");
        setPartner(null);
        setCallId(null);
        if (socketRef.current) {
            socketRef.current.emit("random:end-call", { callId: currentCallId });
        }
        showToast("Call ended.", "info");
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            if (audioTracks.length > 0) {
                const nextState = !audioEnabled;
                audioTracks.forEach((t) => (t.enabled = nextState));
                setAudioEnabled(nextState);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            if (videoTracks.length > 0) {
                const nextState = !videoEnabled;
                videoTracks.forEach((t) => (t.enabled = nextState));
                setVideoEnabled(nextState);
            }
        }
    };

    const handleRouteAudioToSpeaker = async () => {
        try {
            if (
                navigator.mediaDevices &&
                typeof navigator.mediaDevices.selectAudioOutput === "function"
            ) {
                try {
                    const audioDevice = await navigator.mediaDevices.selectAudioOutput();
                    if (
                        remoteVideoRef.current &&
                        typeof remoteVideoRef.current.setSinkId === "function"
                    ) {
                        await remoteVideoRef.current.setSinkId(audioDevice.deviceId);
                        showToast(`Audio output: ${audioDevice.label || "Speaker"}`, "success");
                        return;
                    }
                } catch (selErr) {
                    if (selErr.name !== "AbortError" && selErr.name !== "NotAllowedError") {
                        console.warn("[WebRTC Audio] selectAudioOutput error:", selErr);
                    }
                }
            }

            // Default fallback: resume audio and route to default built-in speaker
            await resumeRemoteAudio();
            showToast("Audio routed to phone speaker 🔊", "success");
        } catch (e) {
            console.warn("[WebRTC Audio] handleRouteAudioToSpeaker error:", e);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: BRAND_COLORS.backgroundDark,
                color: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                overflowX: "hidden",
            }}
        >
            {/* Unified Brand Navigation (hide bottom nav during active call for maximum cinema space) */}
            <Navbar hideBottomNav={callState === "connected"} />

            {/* Main Video Arena */}
            <Box
                sx={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: { xs: 2, md: 4 },
                }}
            >
                {/* 1. IDLE STATE: Local Video Preview & Start Button */}
                {callState === "idle" && (
                    <Container maxWidth="sm" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 4 },
                                borderRadius: "28px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                color: "#FFFFFF",
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 2,
                                    py: 0.6,
                                    borderRadius: "9999px",
                                    bgcolor: "rgba(139, 92, 246, 0.15)",
                                    border: "1px solid rgba(139, 92, 246, 0.3)",
                                    mb: 2,
                                }}
                            >
                                <SparklesIcon sx={{ fontSize: 16, color: BRAND_COLORS.violet }} />
                                <Typography variant="caption" sx={{ color: "#D8B4FE", fontWeight: 700 }}>
                                    REAL-TIME 1-ON-1 VIDEO
                                </Typography>
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.02em" }}>
                                Video Matchmaking
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3.5, px: 2 }}>
                                Connect face-to-face with verified members instantly over private, encrypted WebRTC streams.
                            </Typography>

                            {mediaError && (
                                <Alert severity="warning" variant="filled" sx={{ mb: 3, borderRadius: "14px", textAlign: "left" }}>
                                    {mediaError}
                                </Alert>
                            )}

                            {/* Camera Preview Box */}
                            <Box
                                sx={{
                                    width: "100%",
                                    height: { xs: 260, md: 340 },
                                    borderRadius: "20px",
                                    overflow: "hidden",
                                    backgroundColor: "#000",
                                    position: "relative",
                                    mb: 3.5,
                                    border: `2px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                }}
                            >
                                <video
                                    ref={(el) => {
                                        localVideoRef.current = el;
                                        if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                            el.srcObject = localStreamRef.current;
                                            el.play().catch(() => {});
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        transform: "scaleX(-1)",
                                    }}
                                />
                                {!videoEnabled && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "rgba(11, 13, 23, 0.95)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <VideocamOffIcon sx={{ fontSize: 50, color: BRAND_COLORS.textSecondary, mb: 1 }} />
                                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                            Camera is turned off
                                        </Typography>
                                    </Box>
                                )}

                                {/* Floating Preview Controls */}
                                <Stack
                                    direction="row"
                                    spacing={1.5}
                                    sx={{
                                        position: "absolute",
                                        bottom: 14,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        backgroundColor: "rgba(11, 13, 23, 0.8)",
                                        backdropFilter: "blur(12px)",
                                        borderRadius: "9999px",
                                        px: 2,
                                        py: 0.8,
                                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={toggleAudio}
                                        sx={{
                                            bgcolor: audioEnabled ? "rgba(255,255,255,0.1)" : "#EF4444",
                                            color: "#FFFFFF",
                                            "&:hover": { bgcolor: audioEnabled ? "rgba(255,255,255,0.2)" : "#DC2626" },
                                        }}
                                    >
                                        {audioEnabled ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={toggleVideo}
                                        sx={{
                                            bgcolor: videoEnabled ? "rgba(255,255,255,0.1)" : "#EF4444",
                                            color: "#FFFFFF",
                                            "&:hover": { bgcolor: videoEnabled ? "rgba(255,255,255,0.2)" : "#DC2626" },
                                        }}
                                    >
                                        {videoEnabled ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                                    </IconButton>
                                </Stack>
                            </Box>

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<SearchIcon />}
                                onClick={handleStartSearch}
                                sx={{
                                    background: BRAND_COLORS.primaryGradient,
                                    fontWeight: 800,
                                    fontSize: "1.05rem",
                                    borderRadius: "14px",
                                    px: 5,
                                    py: 1.6,
                                    boxShadow: "0 8px 25px rgba(253, 58, 115, 0.4)",
                                    "&:hover": {
                                        opacity: 0.95,
                                    },
                                }}
                            >
                                Start Matchmaking
                            </Button>

                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                                <SecurityIcon sx={{ fontSize: 16, color: "#10B981" }} />
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Private 2-participant encrypted WebRTC connection
                                </Typography>
                            </Stack>
                        </Paper>
                    </Container>
                )}

                {/* 2. SEARCHING STATE: Radar Animation & Timer */}
                {callState === "searching" && (
                    <Container maxWidth="xs" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 5,
                                borderRadius: "28px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                            }}
                        >
                            {/* Pulsing Radar Effect */}
                            <Box sx={{ position: "relative", mb: 4, width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Box
                                    className="radar-wave"
                                    sx={{
                                        position: "absolute",
                                        width: 140,
                                        height: 140,
                                        borderRadius: "50%",
                                        background: "radial-gradient(circle, rgba(253, 58, 115, 0.3) 0%, rgba(253, 58, 115, 0) 70%)",
                                    }}
                                />
                                <Avatar
                                    src={userData?.photos?.[0]}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        border: `3px solid ${BRAND_COLORS.coralPink}`,
                                        boxShadow: "0 0 30px rgba(253, 58, 115, 0.5)",
                                        zIndex: 2,
                                    }}
                                >
                                    {userData?.name?.charAt(0) || "U"}
                                </Avatar>
                            </Box>

                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 0.8 }}>
                                Finding your match...
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 1 }}>
                                Connecting you to an active member
                            </Typography>

                            {/* Timer pill */}
                            <Box
                                sx={{
                                    px: 2,
                                    py: 0.6,
                                    borderRadius: "9999px",
                                    bgcolor: "rgba(255, 255, 255, 0.06)",
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    mb: 4,
                                }}
                            >
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 700 }}>
                                    ⏱️ {formatTime(searchDuration)}
                                </Typography>
                            </Box>

                            <Button
                                variant="outlined"
                                onClick={handleCancelSearch}
                                sx={{
                                    borderRadius: "12px",
                                    px: 4,
                                    borderColor: "rgba(239, 68, 68, 0.4)",
                                    color: "#EF4444",
                                    "&:hover": {
                                        borderColor: "#EF4444",
                                        bgcolor: "rgba(239, 68, 68, 0.08)",
                                    },
                                }}
                            >
                                Cancel Search
                            </Button>
                        </Paper>
                    </Container>
                )}

                {/* 3. CONNECTING STATE */}
                {callState === "connecting" && (
                    <Container maxWidth="xs" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4.5,
                                borderRadius: "28px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid rgba(253, 58, 115, 0.4)`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                            }}
                        >
                            <Avatar
                                src={partner?.photos?.[0]}
                                sx={{
                                    width: 90,
                                    height: 90,
                                    mb: 2.5,
                                    border: `3px solid #10B981`,
                                    boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)",
                                }}
                            >
                                {partner?.name?.charAt(0) || "P"}
                            </Avatar>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 0.5 }}>
                                Matched with {partner?.name || "a member"}!
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                                Negotiating encrypted video stream...
                            </Typography>
                            <CircularProgress size={32} sx={{ color: BRAND_COLORS.coralPink }} />
                        </Paper>
                    </Container>
                )}

                {/* 4. CONNECTED STATE: Full Video Experience */}
                {callState === "connected" && (
                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: 1100,
                            height: { xs: "calc(100dvh - 120px)", md: "calc(100vh - 140px)" },
                            position: "relative",
                            borderRadius: "28px",
                            overflow: "hidden",
                            backgroundColor: "#000",
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        }}
                    >
                        {/* Remote Video (Main) */}
                        <video
                            ref={(el) => {
                                remoteVideoRef.current = el;
                                if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                                    el.srcObject = remoteStreamRef.current;
                                    el.play().catch((err) => {
                                        if (err.name === "NotAllowedError") {
                                            setAudioPlaybackBlocked(true);
                                        }
                                    });
                                }
                            }}
                            autoPlay
                            playsInline
                            onPause={() => {
                                if (activeCallIdRef.current) {
                                    console.log("[WebRTC Audio] Remote video paused by browser (e.g. Bluetooth disconnected). Auto-resuming...");
                                    setTimeout(() => {
                                        resumeRemoteAudio();
                                    }, 100);
                                }
                            }}
                            onPlay={() => setAudioPlaybackBlocked(false)}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />

                        {/* Floating Audio Playback Blocked Alert (Tap to Resume) */}
                        {audioPlaybackBlocked && (
                            <Box
                                onClick={resumeRemoteAudio}
                                sx={{
                                    position: "absolute",
                                    top: { xs: 70, sm: 80 },
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    backgroundColor: "rgba(253, 58, 115, 0.95)",
                                    backdropFilter: "blur(12px)",
                                    borderRadius: "9999px",
                                    px: { xs: 2.2, sm: 3 },
                                    py: 0.9,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    boxShadow: "0 8px 30px rgba(253, 58, 115, 0.5)",
                                    cursor: "pointer",
                                    zIndex: 25,
                                    border: "1px solid rgba(255, 255, 255, 0.3)",
                                }}
                            >
                                <VolumeUpIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "0.82rem", sm: "0.9rem" } }}>
                                    Audio Paused — Tap to Hear Sound 🔊
                                </Typography>
                            </Box>
                        )}

                        {/* Partner Profile Badge (Top Left) */}
                        {partner && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: { xs: 12, sm: 18 },
                                    left: { xs: 12, sm: 18 },
                                    backgroundColor: "rgba(11, 13, 23, 0.75)",
                                    backdropFilter: "blur(12px)",
                                    borderRadius: "16px",
                                    px: { xs: 1.2, sm: 2 },
                                    py: 0.8,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    maxWidth: { xs: 170, sm: 260 },
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                }}
                            >
                                <Avatar src={partner.photos?.[0]} sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, border: `2px solid ${BRAND_COLORS.coralPink}` }}>
                                    {partner.name?.charAt(0) || "P"}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, fontSize: { xs: "0.82rem", sm: "0.9rem" } }}>
                                        {partner.name}{partner.age ? `, ${partner.age}` : ""}
                                    </Typography>
                                    <Typography variant="caption" noWrap sx={{ color: BRAND_COLORS.textSecondary, display: "block", textTransform: "capitalize" }}>
                                        {partner.gender || "Engaze Member"}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Local Video Picture-in-Picture (Top Right) */}
                        <Box
                            sx={{
                                position: "absolute",
                                top: { xs: 12, sm: 18 },
                                right: { xs: 12, sm: 18 },
                                width: { xs: 95, sm: 150, md: 220 },
                                height: { xs: 130, sm: 110, md: 160 },
                                borderRadius: "18px",
                                overflow: "hidden",
                                border: `2px solid rgba(255, 255, 255, 0.3)`,
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
                                zIndex: 5,
                            }}
                        >
                            <video
                                ref={(el) => {
                                    localVideoRef.current = el;
                                    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                        el.srcObject = localStreamRef.current;
                                        el.play().catch(() => {});
                                    }
                                }}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transform: "scaleX(-1)",
                                }}
                            />
                            {!videoEnabled && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        backgroundColor: "rgba(11, 13, 23, 0.9)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <VideocamOffIcon sx={{ color: BRAND_COLORS.textSecondary, fontSize: 24 }} />
                                </Box>
                            )}
                        </Box>

                        {/* Floating Bottom Control Bar */}
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: 24,
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(11, 13, 23, 0.85)",
                                backdropFilter: "blur(16px)",
                                borderRadius: "9999px",
                                px: { xs: 2.5, sm: 3.5 },
                                py: 1.2,
                                display: "flex",
                                alignItems: "center",
                                gap: { xs: 1.5, sm: 2.5 },
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                                zIndex: 10,
                            }}
                        >
                            {/* Toggle Audio */}
                            <Tooltip title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}>
                                <IconButton
                                    onClick={toggleAudio}
                                    sx={{
                                        backgroundColor: audioEnabled ? "rgba(255,255,255,0.12)" : "#EF4444",
                                        color: "#FFFFFF",
                                        "&:hover": { backgroundColor: audioEnabled ? "rgba(255,255,255,0.22)" : "#DC2626" },
                                        width: 46,
                                        height: 46,
                                    }}
                                >
                                    {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                            </Tooltip>

                            {/* Toggle Video */}
                            <Tooltip title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}>
                                <IconButton
                                    onClick={toggleVideo}
                                    sx={{
                                        backgroundColor: videoEnabled ? "rgba(255,255,255,0.12)" : "#EF4444",
                                        color: "#FFFFFF",
                                        "&:hover": { backgroundColor: videoEnabled ? "rgba(255,255,255,0.22)" : "#DC2626" },
                                        width: 46,
                                        height: 46,
                                    }}
                                >
                                    {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                            </Tooltip>

                            {/* Audio Output / Speaker Route Button */}
                            <Tooltip title="Route Audio to Phone Speaker / Output">
                                <IconButton
                                    onClick={handleRouteAudioToSpeaker}
                                    sx={{
                                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                                        color: "#FFFFFF",
                                        "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.22)" },
                                        width: 46,
                                        height: 46,
                                    }}
                                >
                                    <VolumeUpIcon />
                                </IconButton>
                            </Tooltip>

                            {/* Next Match Button */}
                            <Tooltip title="Skip to Next Match">
                                <Button
                                    variant="contained"
                                    startIcon={<SkipNextIcon />}
                                    onClick={handleNextMatch}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        color: "#FFFFFF",
                                        borderRadius: "9999px",
                                        px: { xs: 2.5, sm: 3.5 },
                                        fontWeight: 800,
                                        height: 46,
                                        boxShadow: "0 4px 15px rgba(253, 58, 115, 0.4)",
                                    }}
                                >
                                    Next Match
                                </Button>
                            </Tooltip>

                            {/* End Call Button */}
                            <Tooltip title="End Call">
                                <IconButton
                                    onClick={handleEndCall}
                                    sx={{
                                        backgroundColor: "#EF4444",
                                        color: "#FFFFFF",
                                        "&:hover": { backgroundColor: "#DC2626" },
                                        width: 46,
                                        height: 46,
                                    }}
                                >
                                    <CallEndIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                )}

                {/* 5. CALL ENDED MODAL / NOTICE */}
                {callState === "ended" && (
                    <Container maxWidth="xs" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4.5,
                                borderRadius: "28px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(239, 68, 68, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2,
                                }}
                            >
                                <CallEndIcon sx={{ fontSize: 34, color: "#EF4444" }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 0.5 }}>
                                Call Ended
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3.5 }}>
                                {endReasonNotice || "The call has ended."}
                            </Typography>

                            <Stack spacing={1.5} sx={{ width: "100%" }}>
                                <Button
                                    variant="contained"
                                    onClick={handleStartSearch}
                                    startIcon={<SearchIcon />}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        borderRadius: "14px",
                                        py: 1.4,
                                        fontWeight: 800,
                                        boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                                    }}
                                >
                                    Find Next Match
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setCallState("idle")}
                                    sx={{
                                        borderRadius: "14px",
                                        py: 1.2,
                                        color: BRAND_COLORS.textSecondary,
                                        borderColor: BRAND_COLORS.surfaceDarkBorder,
                                        "&:hover": {
                                            borderColor: "rgba(255,255,255,0.2)",
                                            bgcolor: "rgba(255,255,255,0.04)",
                                        },
                                    }}
                                >
                                    Back to Preview
                                </Button>
                            </Stack>
                        </Paper>
                    </Container>
                )}
            </Box>

            {/* Permission Denied Dialog */}
            <Dialog
                open={permissionDeniedDialog}
                onClose={() => setPermissionDeniedDialog(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "20px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        color: "#FFFFFF",
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    },
                }}
            >
                <DialogTitle sx={{ color: "#EF4444", fontWeight: 800 }}>Camera & Microphone Access Required</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: BRAND_COLORS.textSecondary }}>
                        Engaze 1-to-1 video matchmaking requires camera and microphone permissions to connect you with members.
                        Please enable permissions in your browser's address bar and click Retry.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setPermissionDeniedDialog(false)} sx={{ color: BRAND_COLORS.textSecondary }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setPermissionDeniedDialog(false);
                            initializeMedia();
                        }}
                        variant="contained"
                        sx={{
                            background: BRAND_COLORS.primaryGradient,
                            borderRadius: "10px",
                            fontWeight: 700,
                        }}
                    >
                        Retry
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Toast Snackbar */}
            <Snackbar
                open={openToast}
                autoHideDuration={4000}
                onClose={() => setOpenToast(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={toastSeverity}
                    variant="filled"
                    onClose={() => setOpenToast(false)}
                    sx={{ width: "100%", borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                >
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default withAuth(RandomVideoPage);
