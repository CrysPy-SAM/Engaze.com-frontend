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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SafetyActionModal from "../components/SafetyActionModal";
import {
    createCallDiagnostics,
    recordConnectionState,
    recordIceConnectionState,
    extractSafeCandidatePair,
    buildSanitizedTelemetryPayload,
} from "../utils/webrtcDiagnostics";

const DEFAULT_ICE_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceTransportPolicy: "all",
};

function RandomVideoPage() {
    const navigate = useNavigate();
    const {
        userData,
        token,
        blockUser,
        reportUser,
        getIceServers,
        sendWebRTCDiagnostics,
    } = useContext(AuthContext);

    // Call state: 'idle' | 'searching' | 'consent_pending' | 'waiting_for_partner_consent' | 'media_requesting' | 'waiting_for_partner_media' | 'connecting' | 'reconnecting' | 'connected' | 'failed' | 'ended'
    const [callState, setCallState] = useState("idle");
    const [partner, setPartner] = useState(null);
    const [lastPartner, setLastPartner] = useState(null);
    const [callId, setCallId] = useState(null);
    const [searchDuration, setSearchDuration] = useState(0);
    const [partnerConsented, setPartnerConsented] = useState(false);

    // Safety action modal
    const [safetyModalOpen, setSafetyModalOpen] = useState(false);
    const [safetyActionType, setSafetyActionType] = useState("report");

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
    const mediaSessionTokenRef = useRef(0);
    const timerRef = useRef(null);

    // WebRTC Reliability, Diagnostics & TURN refs
    const iceConfigRef = useRef(DEFAULT_ICE_CONFIG);
    const diagnosticsRef = useRef(null);
    const iceRestartAttemptedRef = useRef(false);
    const connectionTimeoutRef = useRef(null);
    const statsIntervalRef = useRef(null);

    const showToast = useCallback((msg, severity = "info") => {
        setToastMessage(msg);
        setToastSeverity(severity);
        setOpenToast(true);
    }, []);

    // -------------------------------------------------------------
    // Stop & Release Local Camera/Mic Media Tracks
    // -------------------------------------------------------------
    const stopLocalMedia = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch (e) {
                    console.warn("[WebRTC] Error stopping local track:", e);
                }
            });
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
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
    // 1. Initialize Local Media Stream with Race & Staleness Guard
    // -------------------------------------------------------------
    const initializeMedia = useCallback(async (expectedCallId) => {
        const sessionToken = mediaSessionTokenRef.current;
        const targetCallId = expectedCallId || activeCallIdRef.current;

        try {
            if (localStreamRef.current && localStreamRef.current.active) {
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

            // Race Condition Guard: If sessionToken changed, call ended, or targetCallId changed while awaiting getUserMedia
            const isStale = (
                sessionToken !== mediaSessionTokenRef.current ||
                !activeCallIdRef.current ||
                (targetCallId && activeCallIdRef.current !== targetCallId)
            );

            if (isStale) {
                console.log(`[WebRTC] Late getUserMedia resolved for stale/abandoned call (${targetCallId}). Stopping tracks immediately.`);
                if (stream) {
                    stream.getTracks().forEach((track) => {
                        try {
                            track.stop();
                        } catch (e) {}
                    });
                }
                return null;
            }

            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play().catch(() => {});
            }
            setMediaError("");
            return stream;
        } catch (err) {
            // If call session was already cancelled/stale, ignore permission errors
            if (sessionToken !== mediaSessionTokenRef.current || !activeCallIdRef.current) {
                console.log("[WebRTC] Discarding media error on stale/cancelled call session");
                return null;
            }

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

    // Bounded ICE Restart / Recovery Attempt
    const attemptIceRestart = useCallback(async (targetCallId) => {
        const pc = pcRef.current;
        if (!pc || activeCallIdRef.current !== targetCallId) return;
        if (iceRestartAttemptedRef.current) {
            console.log("[WebRTC] ICE restart already attempted for call:", targetCallId);
            return;
        }
        iceRestartAttemptedRef.current = true;

        if (diagnosticsRef.current) {
            diagnosticsRef.current.iceRestartAttempts = (diagnosticsRef.current.iceRestartAttempts || 0) + 1;
        }

        console.log("[WebRTC] Attempting bounded ICE restart for call:", targetCallId);
        setCallState("reconnecting");
        showToast("Reconnecting video connection...", "info");

        try {
            if (typeof pc.restartIce === "function") {
                pc.restartIce();
            }

            if (isInitiatorRef.current) {
                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);

                if (socketRef.current && activeCallIdRef.current === targetCallId) {
                    socketRef.current.emit("random:signal", {
                        callId: targetCallId,
                        signalData: {
                            type: "offer",
                            sdp: offer,
                            iceRestart: true,
                        },
                    });
                }
            }

            // Bounded 10s recovery timeout for restart attempt
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = setTimeout(() => {
                if (activeCallIdRef.current === targetCallId && pcRef.current && pcRef.current.connectionState !== "connected") {
                    console.warn("[WebRTC] ICE restart recovery timed out.");
                    setCallState("failed");
                    setEndReasonNotice("Video connection could not be restored.");
                    showToast("Connection recovery timed out.", "warning");
                }
            }, 10000);
        } catch (err) {
            console.warn("[WebRTC] ICE restart offer failed:", err);
        }
    }, [showToast]);

    // Cleanup WebRTC connection & Flush Safe Diagnostics
    const cleanupPeerConnection = useCallback(() => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
        }

        // Finalize and submit privacy-sanitized diagnostics
        if (diagnosticsRef.current && diagnosticsRef.current.callId) {
            diagnosticsRef.current.endTime = Date.now();
            const payload = buildSanitizedTelemetryPayload(diagnosticsRef.current);
            if (payload && typeof sendWebRTCDiagnostics === "function") {
                sendWebRTCDiagnostics(payload).catch(() => {});
            }
            diagnosticsRef.current = null;
        }
        iceRestartAttemptedRef.current = false;

        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.oniceconnectionstatechange = null;
            try {
                pcRef.current.close();
            } catch (e) {
                console.warn("[WebRTC] Error closing peer connection:", e);
            }
            pcRef.current = null;
        }
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch (e) {}
            });
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
    }, [sendWebRTCDiagnostics]);

    // -------------------------------------------------------------
    // 2. Setup WebRTC PeerConnection for an Active Call
    // -------------------------------------------------------------
    const createPeerConnection = useCallback((currentCallId, isInitiator) => {
        cleanupPeerConnection();

        // Initialize safe call diagnostics
        diagnosticsRef.current = createCallDiagnostics(currentCallId, isInitiator);

        const currentIceConfig = iceConfigRef.current || DEFAULT_ICE_CONFIG;
        const pc = new RTCPeerConnection(currentIceConfig);
        pcRef.current = pc;
        activeCallIdRef.current = currentCallId;
        isInitiatorRef.current = isInitiator;
        iceRestartAttemptedRef.current = false;

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
            const state = pc.connectionState;
            console.log("[WebRTC] connectionState:", state);
            if (diagnosticsRef.current) {
                recordConnectionState(diagnosticsRef.current, state);
            }

            if (state === "connected") {
                setCallState("connected");
                if (connectionTimeoutRef.current) {
                    clearTimeout(connectionTimeoutRef.current);
                    connectionTimeoutRef.current = null;
                }

                // Poll stats up to 3 times to extract candidate pair metadata safely
                if (pc.getStats && !statsIntervalRef.current) {
                    let pollCount = 0;
                    statsIntervalRef.current = setInterval(async () => {
                        pollCount += 1;
                        if (!pcRef.current || pcRef.current.connectionState !== "connected" || pollCount > 3) {
                            if (statsIntervalRef.current) {
                                clearInterval(statsIntervalRef.current);
                                statsIntervalRef.current = null;
                            }
                            return;
                        }
                        try {
                            const report = await pcRef.current.getStats();
                            const pairInfo = extractSafeCandidatePair(report);
                            if (pairInfo && diagnosticsRef.current) {
                                diagnosticsRef.current.selectedCandidatePair = pairInfo;
                                if (statsIntervalRef.current) {
                                    clearInterval(statsIntervalRef.current);
                                    statsIntervalRef.current = null;
                                }
                            }
                        } catch {
                            // Ignored
                        }
                    }, 2000);
                }
            } else if (state === "failed" || state === "disconnected") {
                if (!iceRestartAttemptedRef.current && activeCallIdRef.current === currentCallId) {
                    attemptIceRestart(currentCallId);
                } else if (state === "failed") {
                    setCallState("failed");
                    setEndReasonNotice("Video connection failed. You can find another match or retry.");
                    showToast("Video connection failed.", "error");
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            const iceState = pc.iceConnectionState;
            console.log("[WebRTC] iceConnectionState:", iceState);
            if (diagnosticsRef.current) {
                recordIceConnectionState(diagnosticsRef.current, iceState);
            }

            if (iceState === "failed" && !iceRestartAttemptedRef.current && activeCallIdRef.current === currentCallId) {
                attemptIceRestart(currentCallId);
            }
        };

        return pc;
    }, [cleanupPeerConnection, resumeRemoteAudio, attemptIceRestart, showToast]);

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
                if (signalData.iceRestart) {
                    console.log("[WebRTC] Received peer ICE restart offer for call:", currentCallId);
                    if (diagnosticsRef.current) {
                        diagnosticsRef.current.iceRestartAttempts = (diagnosticsRef.current.iceRestartAttempts || 0) + 1;
                    }
                    setCallState("reconnecting");
                }
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
    // Dynamic ICE / TURN Configuration Initialization
    // -------------------------------------------------------------
    useEffect(() => {
        let isMounted = true;
        if (typeof getIceServers === "function") {
            getIceServers()
                .then((res) => {
                    if (isMounted && res?.iceServers?.length) {
                        iceConfigRef.current = {
                            iceServers: res.iceServers,
                            iceTransportPolicy: res.iceTransportPolicy || "all",
                        };
                        console.log(
                            `[WebRTC] Successfully loaded ICE configuration (hasTurn: ${Boolean(res.hasTurn)}, policy: ${res.iceTransportPolicy || "all"})`
                        );
                    }
                })
                .catch((e) => {
                    console.warn("[WebRTC] Using fallback STUN configuration:", e?.message);
                });
        }
        return () => {
            isMounted = false;
        };
    }, [getIceServers]);

    // -------------------------------------------------------------
    // 3. Socket Connection & Event Listeners
    // -------------------------------------------------------------
    useEffect(() => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) {
            navigate("/auth");
            return;
        }

        // Camera and microphone are NOT accessed on page mount to preserve user privacy

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

        socket.on("random:matched", ({ callId: newCallId, isInitiator, partner: matchedPartner }) => {
            // Invalidate any previous in-flight media session and cleanup old tracks/connections
            mediaSessionTokenRef.current += 1;
            stopLocalMedia();
            cleanupPeerConnection();

            activeCallIdRef.current = newCallId;
            setCallId(newCallId);
            setPartner(matchedPartner);
            setLastPartner(matchedPartner);
            isInitiatorRef.current = isInitiator;
            setPartnerConsented(false);
            setCallState("consent_pending");
            showToast(`Match found with ${matchedPartner?.name || "a member"}! Please confirm to start.`, "info");
        });

        socket.on("random:waiting-for-partner-consent", () => {
            setCallState("waiting_for_partner_consent");
        });

        socket.on("random:partner-consented", () => {
            setPartnerConsented(true);
            showToast("Partner is ready! Waiting for your consent.", "info");
        });

        socket.on("random:both-consented", async ({ callId: consentedCallId }) => {
            if (!consentedCallId || consentedCallId !== activeCallIdRef.current) {
                console.log("[WebRTC] Discarding both-consented event for stale call:", consentedCallId);
                return;
            }

            const currentToken = mediaSessionTokenRef.current;
            setCallState("media_requesting");
            showToast("Both agreed! Initializing camera...", "success");

            const stream = await initializeMedia(consentedCallId);

            // Guard: If session token changed, call was declined/ended, or next match was triggered while awaiting media
            if (currentToken !== mediaSessionTokenRef.current || activeCallIdRef.current !== consentedCallId) {
                console.log("[WebRTC] Call state changed during media acquisition. Aborting readiness emit.");
                return;
            }

            if (!stream) {
                if (socketRef.current && activeCallIdRef.current === consentedCallId) {
                    socketRef.current.emit("random:media-failed", {
                        callId: consentedCallId,
                        reason: "permission_denied",
                    });
                }
                setCallState("ended");
                setEndReasonNotice("Camera and microphone permission required to start call.");
                return;
            }

            setCallState("waiting_for_partner_media");
            if (socketRef.current && activeCallIdRef.current === consentedCallId) {
                socketRef.current.emit("random:media-ready", {
                    callId: consentedCallId,
                });
            }
        });

        socket.on("random:waiting-for-partner-media", () => {
            setCallState("waiting_for_partner_media");
        });

        socket.on("random:media-start", async ({ callId: startCallId, isInitiator }) => {
            const currentCall = startCallId || activeCallIdRef.current;
            if (!currentCall || currentCall !== activeCallIdRef.current) {
                console.log("[WebRTC] Discarding media-start for stale call:", startCallId);
                return;
            }

            setCallState("connecting");
            showToast("Starting encrypted video stream...", "info");

            const pc = createPeerConnection(currentCall, isInitiator);

            // Bounded 15s connection failure timeout
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = setTimeout(() => {
                if (activeCallIdRef.current === currentCall && pcRef.current && pcRef.current.connectionState !== "connected") {
                    console.warn("[WebRTC] Peer connection establishment timed out after 15s");
                    if (!iceRestartAttemptedRef.current) {
                        attemptIceRestart(currentCall);
                    } else {
                        setCallState("failed");
                        setEndReasonNotice("Video connection timed out. Could not establish peer connection.");
                        showToast("Connection timed out.", "warning");
                    }
                }
            }, 15000);

            // Drain any queued signals that arrived while peer connection initialized
            if (pendingSignalsRef.current.length > 0) {
                console.log(`[WebRTC] Processing ${pendingSignalsRef.current.length} queued signals`);
                const queued = [...pendingSignalsRef.current];
                pendingSignalsRef.current = [];
                for (const item of queued) {
                    await handleRemoteSignal(item.signalData, item.currentCallId || currentCall);
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
                        callId: currentCall,
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
            if (!sigCallId || sigCallId !== activeCallIdRef.current) {
                console.log("[WebRTC] Discarding signal for stale call:", sigCallId);
                return;
            }
            handleRemoteSignal(signalData, sigCallId);
        });

        socket.on("random:call-ended", ({ reason }) => {
            mediaSessionTokenRef.current += 1;
            stopLocalMedia();
            cleanupPeerConnection();
            setCallState("ended");
            setPartnerConsented(false);
            let notice = "Call has ended.";
            if (reason === "declined_by_partner") {
                notice = "Your match chose not to connect.";
            } else if (reason === "declined_by_user") {
                notice = "You declined the match.";
            } else if (reason === "partner_media_failed") {
                notice = "Your match had camera or microphone issues.";
            } else if (reason === "media_failed") {
                notice = "Camera or microphone setup failed.";
            } else if (reason === "partner_disconnected") {
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
            mediaSessionTokenRef.current += 1;
            stopLocalMedia();
            setCallState("idle");
        });

        socket.on("random:error", ({ message }) => {
            showToast(message || "Matchmaking error", "error");
        });

        return () => {
            mediaSessionTokenRef.current += 1;
            stopLocalMedia();
            cleanupPeerConnection();
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token, navigate, initializeMedia, createPeerConnection, handleRemoteSignal, attemptIceRestart, cleanupPeerConnection, stopLocalMedia, showToast]);

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
    const handleStartSearch = () => {
        mediaSessionTokenRef.current += 1;
        stopLocalMedia();
        cleanupPeerConnection();
        if (socketRef.current) {
            setCallState("searching");
            setPartner(null);
            setCallId(null);
            setPartnerConsented(false);
            socketRef.current.emit("random:join-queue", {}, (ack) => {
                if (ack && !ack.success) {
                    showToast(ack.message || "Failed to join queue", "error");
                    setCallState("idle");
                }
            });
        }
    };

    const handleCancelSearch = () => {
        mediaSessionTokenRef.current += 1;
        stopLocalMedia();
        cleanupPeerConnection();
        if (socketRef.current) {
            socketRef.current.emit("random:leave-queue", {}, () => {
                setCallState("idle");
                showToast("Search cancelled.", "info");
            });
        }
    };

    const handleAcceptConsent = () => {
        const currentCallId = callId || activeCallIdRef.current;
        setCallState("waiting_for_partner_consent");
        if (socketRef.current && currentCallId) {
            socketRef.current.emit("random:consent", {
                callId: currentCallId,
                consent: true,
            });
        }
    };

    const handleDeclineConsent = () => {
        const currentCallId = callId || activeCallIdRef.current;
        mediaSessionTokenRef.current += 1;
        stopLocalMedia();
        cleanupPeerConnection();
        setCallState("idle");
        setPartner(null);
        setCallId(null);
        setPartnerConsented(false);
        if (socketRef.current && currentCallId) {
            socketRef.current.emit("random:consent", {
                callId: currentCallId,
                consent: false,
            });
        }
        showToast("Match declined.", "info");
    };

    const handleNextMatch = () => {
        if (callState === "searching") return;
        const currentCallId = callId || activeCallIdRef.current;
        mediaSessionTokenRef.current += 1;
        stopLocalMedia();
        cleanupPeerConnection();
        setPartner(null);
        setCallId(null);
        setPartnerConsented(false);
        setCallState("searching");
        if (socketRef.current) {
            socketRef.current.emit("random:next", { callId: currentCallId });
        }
    };

    const handleEndCall = () => {
        const currentCallId = callId || activeCallIdRef.current;
        mediaSessionTokenRef.current += 1;
        stopLocalMedia();
        cleanupPeerConnection();
        setCallState("idle");
        setPartner(null);
        setCallId(null);
        setPartnerConsented(false);
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
                                Connect face-to-face with eligible members instantly over private, encrypted WebRTC streams.
                            </Typography>

                            {mediaError && (
                                <Alert severity="warning" variant="filled" sx={{ mb: 3, borderRadius: "14px", textAlign: "left" }}>
                                    {mediaError}
                                </Alert>
                            )}

                            {/* Camera Standby Box or Active Preview */}
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
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {localStreamRef.current ? (
                                    <>
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
                                    </>
                                ) : (
                                    <Box
                                        sx={{
                                            p: 3,
                                            textAlign: "center",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(255, 255, 255, 0.05)",
                                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                mb: 1.8,
                                            }}
                                        >
                                            <VideocamOffIcon sx={{ fontSize: 32, color: BRAND_COLORS.textSecondary }} />
                                        </Box>
                                        <Typography variant="subtitle1" sx={{ color: "#FFFFFF", fontWeight: 700, mb: 0.8 }}>
                                            Camera & Mic Standby
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, maxWidth: 300, lineHeight: 1.5, display: "block" }}>
                                            Camera and microphone remain inactive until you and your match both confirm consent to connect.
                                        </Typography>
                                    </Box>
                                )}
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

                {/* 3. CONSENT CARD: Explicit 2-party opt-in before camera/mic or WebRTC setup */}
                {(callState === "consent_pending" || callState === "waiting_for_partner_consent") && (
                    <Container maxWidth="xs" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, sm: 4.5 },
                                borderRadius: "28px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            {/* Status Pill */}
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 2,
                                    py: 0.6,
                                    borderRadius: "9999px",
                                    bgcolor: partnerConsented ? "rgba(16, 185, 129, 0.15)" : "rgba(253, 58, 115, 0.15)",
                                    border: `1px solid ${partnerConsented ? "rgba(16, 185, 129, 0.3)" : "rgba(253, 58, 115, 0.3)"}`,
                                    mb: 2.5,
                                }}
                            >
                                <SparklesIcon sx={{ fontSize: 16, color: partnerConsented ? "#10B981" : BRAND_COLORS.coralPink }} />
                                <Typography variant="caption" sx={{ color: partnerConsented ? "#34D399" : "#FCA5A5", fontWeight: 700 }}>
                                    {partnerConsented ? "PARTNER IS READY" : "MATCH FOUND"}
                                </Typography>
                            </Box>

                            <Avatar
                                src={partner?.photos?.[0]}
                                sx={{
                                    width: 96,
                                    height: 96,
                                    mb: 2,
                                    border: `3px solid ${partnerConsented ? "#10B981" : BRAND_COLORS.coralPink}`,
                                    boxShadow: partnerConsented
                                        ? "0 0 30px rgba(16, 185, 129, 0.4)"
                                        : "0 0 30px rgba(253, 58, 115, 0.4)",
                                }}
                            >
                                {partner?.name?.charAt(0) || "P"}
                            </Avatar>

                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 0.5 }}>
                                {partner?.name || "New Member"}{partner?.age ? `, ${partner.age}` : ""}
                            </Typography>

                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 1, textTransform: "capitalize" }}>
                                {partner?.gender || "Engaze Member"}
                            </Typography>

                            {partner?.bio && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: BRAND_COLORS.textSecondary,
                                        mb: 2.5,
                                        px: 2,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    "{partner.bio}"
                                </Typography>
                            )}

                            <Typography variant="body2" sx={{ color: "#E5E7EB", fontWeight: 600, mb: 0.8, px: 1 }}>
                                Ready to start a private 1-on-1 video call?
                            </Typography>
                            <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, mb: 3, px: 2 }}>
                                🔒 Your camera and microphone will only activate after both of you agree.
                            </Typography>

                            {callState === "consent_pending" ? (
                                <Stack direction="column" spacing={1.5} sx={{ width: "100%" }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleAcceptConsent}
                                        sx={{
                                            background: BRAND_COLORS.primaryGradient,
                                            fontWeight: 800,
                                            borderRadius: "14px",
                                            py: 1.4,
                                            boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                                        }}
                                    >
                                        Ready to Start
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="medium"
                                        startIcon={<CancelIcon />}
                                        onClick={handleDeclineConsent}
                                        sx={{
                                            borderRadius: "14px",
                                            py: 1.1,
                                            borderColor: "rgba(239, 68, 68, 0.4)",
                                            color: "#EF4444",
                                            "&:hover": {
                                                borderColor: "#EF4444",
                                                bgcolor: "rgba(239, 68, 68, 0.08)",
                                            },
                                        }}
                                    >
                                        Not Now
                                    </Button>
                                </Stack>
                            ) : (
                                <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <CircularProgress size={22} sx={{ color: BRAND_COLORS.coralPink }} />
                                        <Typography variant="body2" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 700 }}>
                                            Waiting for {partner?.name || "partner"} to confirm...
                                        </Typography>
                                    </Stack>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={handleDeclineConsent}
                                        sx={{ color: BRAND_COLORS.textSecondary, mt: 1 }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Container>
                )}

                {/* 4. MEDIA SETUP STATE: Both consented; initializing camera & mic */}
                {(callState === "media_requesting" || callState === "waiting_for_partner_media") && (
                    <Container maxWidth="xs" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, sm: 4.5 },
                                borderRadius: "28px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid rgba(139, 92, 246, 0.3)`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                            }}
                        >
                            <Avatar
                                src={partner?.photos?.[0]}
                                sx={{
                                    width: 80,
                                    height: 80,
                                    mb: 2.5,
                                    border: `3px solid #10B981`,
                                    boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)",
                                }}
                            >
                                {partner?.name?.charAt(0) || "P"}
                            </Avatar>
                            <CircularProgress size={36} sx={{ color: BRAND_COLORS.violet, mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 0.5 }}>
                                {callState === "media_requesting"
                                    ? "Setting up camera & mic..."
                                    : `Waiting for ${partner?.name || "partner"}'s media...`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 1.5 }}>
                                {callState === "media_requesting"
                                    ? "Requesting device permissions..."
                                    : "Your camera is ready. Waiting for peer..."}
                            </Typography>
                            <Button
                                variant="text"
                                size="small"
                                onClick={handleDeclineConsent}
                                sx={{ color: BRAND_COLORS.textSecondary }}
                            >
                                Cancel
                            </Button>
                        </Paper>
                    </Container>
                )}

                {/* 5. CONNECTING / RECONNECTING STATE */}
                {(callState === "connecting" || callState === "reconnecting") && (
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
                                {callState === "reconnecting" ? "Reconnecting Video..." : `Matched with ${partner?.name || "a member"}!`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                                {callState === "reconnecting" ? "Restoring encrypted WebRTC connection..." : "Negotiating encrypted video stream..."}
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
                                bottom: { xs: 16, sm: 24 },
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(11, 13, 23, 0.88)",
                                backdropFilter: "blur(18px)",
                                borderRadius: "9999px",
                                px: { xs: 1.2, sm: 3 },
                                py: { xs: 0.8, sm: 1.2 },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: { xs: 0.8, sm: 2 },
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                boxShadow: "0 12px 40px rgba(0,0,0,0.65)",
                                zIndex: 10,
                                maxWidth: "calc(100% - 16px)",
                                boxSizing: "border-box",
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
                                        width: { xs: 38, sm: 46 },
                                        height: { xs: 38, sm: 46 },
                                        p: { xs: 0.8, sm: 1.2 },
                                    }}
                                >
                                    {audioEnabled ? <MicIcon sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <MicOffIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
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
                                        width: { xs: 38, sm: 46 },
                                        height: { xs: 38, sm: 46 },
                                        p: { xs: 0.8, sm: 1.2 },
                                    }}
                                >
                                    {videoEnabled ? <VideocamIcon sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <VideocamOffIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
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
                                        width: { xs: 38, sm: 46 },
                                        height: { xs: 38, sm: 46 },
                                        p: { xs: 0.8, sm: 1.2 },
                                    }}
                                >
                                    <VolumeUpIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                </IconButton>
                            </Tooltip>

                            {/* Report & Safety Button */}
                            <Tooltip title="Report or Block Partner">
                                <IconButton
                                    onClick={() => {
                                        setSafetyActionType("report");
                                        setSafetyModalOpen(true);
                                    }}
                                    sx={{
                                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                                        color: "#F59E0B",
                                        "&:hover": { backgroundColor: "rgba(245, 158, 11, 0.22)" },
                                        width: { xs: 38, sm: 46 },
                                        height: { xs: 38, sm: 46 },
                                        p: { xs: 0.8, sm: 1.2 },
                                    }}
                                >
                                    <SecurityIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                </IconButton>
                            </Tooltip>

                            {/* Next Match Button */}
                            <Tooltip title="Skip to Next Match">
                                <Button
                                    variant="contained"
                                    startIcon={<SkipNextIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                    onClick={handleNextMatch}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        color: "#FFFFFF",
                                        borderRadius: "9999px",
                                        px: { xs: 1.5, sm: 3 },
                                        fontWeight: 800,
                                        height: { xs: 38, sm: 46 },
                                        fontSize: { xs: "0.80rem", sm: "0.92rem" },
                                        boxShadow: "0 4px 15px rgba(253, 58, 115, 0.4)",
                                        whiteSpace: "nowrap",
                                        minWidth: "auto",
                                    }}
                                >
                                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                                        Next Match
                                    </Box>
                                    <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                                        Next
                                    </Box>
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
                                        width: { xs: 38, sm: 46 },
                                        height: { xs: 38, sm: 46 },
                                        p: { xs: 0.8, sm: 1.2 },
                                    }}
                                >
                                    <CallEndIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                )}

                {/* 5. CALL ENDED / FAILED NOTICE */}
                {(callState === "ended" || callState === "failed") && (
                    <Container maxWidth="xs" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4.5,
                                borderRadius: "28px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${callState === "failed" ? "rgba(239, 68, 68, 0.4)" : BRAND_COLORS.surfaceDarkBorder}`,
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
                                {callState === "failed" ? "Connection Failed" : "Call Ended"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3.5 }}>
                                {endReasonNotice || (callState === "failed" ? "Video connection could not be established." : "The call has ended.")}
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
                                {lastPartner && (
                                    <Button
                                        variant="text"
                                        startIcon={<SecurityIcon sx={{ color: "#F59E0B" }} />}
                                        onClick={() => {
                                            setSafetyActionType("report");
                                            setSafetyModalOpen(true);
                                        }}
                                        sx={{
                                            color: "#F59E0B",
                                            borderRadius: "14px",
                                            py: 1,
                                            fontWeight: 600,
                                            textTransform: "none",
                                            "&:hover": {
                                                bgcolor: "rgba(245, 158, 11, 0.08)",
                                            },
                                        }}
                                    >
                                        Report or Block {lastPartner.name || "partner"}
                                    </Button>
                                )}
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

            {/* Safety Action Modal */}
            <SafetyActionModal
                isOpen={safetyModalOpen}
                onClose={() => setSafetyModalOpen(false)}
                actionType={safetyActionType}
                targetUser={partner || lastPartner}
                callId={callId || activeCallIdRef.current}
                context="call"
                onBlockUser={blockUser}
                onReportUser={reportUser}
                onSuccess={(result) => {
                    if (result.action === "block" || result.alsoBlocked) {
                        handleEndCall();
                        showToast("User blocked. You will no longer be paired in video calls.", "info");
                    } else {
                        showToast("Report submitted successfully. Thank you for keeping Engaze safe.", "success");
                    }
                }}
            />
        </Box>
    );
}

export default withAuth(RandomVideoPage);
