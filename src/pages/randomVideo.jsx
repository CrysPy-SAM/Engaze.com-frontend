import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import server from "../environment";
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
import WhatshotIcon from "@mui/icons-material/Whatshot";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonIcon from "@mui/icons-material/Person";
import ChatIcon from "@mui/icons-material/Chat";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

function RandomVideoPage() {
    const navigate = useNavigate();
    const { userData, token, handleLogout } = useContext(AuthContext);

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

    // Notification toast
    const [toastMessage, setToastMessage] = useState("");
    const [toastSeverity, setToastSeverity] = useState("info");
    const [openToast, setOpenToast] = useState(false);

    // Refs
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const iceCandidateQueue = useRef([]);
    const isInitiatorRef = useRef(false);
    const activeCallIdRef = useRef(null);
    const timerRef = useRef(null);

    const showToast = useCallback((msg, severity = "info") => {
        setToastMessage(msg);
        setToastSeverity(severity);
        setOpenToast(true);
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
                audio: true,
            });

            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
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
            pcRef.current.close();
            pcRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        iceCandidateQueue.current = [];
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

        // Attach local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Handle remote stream tracks
        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setCallState("connected");
            }
        };

        // ICE candidate transmission
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

        // Connection state monitoring
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
                setCallState("connected");
            } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                showToast("Video connection interrupted.", "warning");
            }
        };

        return pc;
    }, [cleanupPeerConnection, showToast]);

    // Process incoming WebRTC signals
    const handleRemoteSignal = useCallback(async (signalData, currentCallId) => {
        const pc = pcRef.current;
        if (!pc || activeCallIdRef.current !== currentCallId) return;

        try {
            if (signalData.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

                // Process any ICE candidates that arrived before offer
                while (iceCandidateQueue.current.length > 0) {
                    const cand = iceCandidateQueue.current.shift();
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                }

                // Create and send answer
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
                await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

                // Process any queued ICE candidates
                while (iceCandidateQueue.current.length > 0) {
                    const cand = iceCandidateQueue.current.shift();
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                }
            } else if (signalData.type === "ice-candidate") {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
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

        // Initialize media stream on mount
        initializeMedia();

        const socket = io(server, {
            auth: { token: authToken },
            transports: ["websocket"],
        });
        socketRef.current = socket;

        // Socket Events
        socket.on("random:queue-joined", () => {
            setCallState("searching");
            showToast("Searching for an available match...", "info");
        });

        socket.on("random:matched", async ({ callId: newCallId, isInitiator, partner: matchedPartner }) => {
            setCallId(newCallId);
            setPartner(matchedPartner);
            setCallState("connecting");
            showToast(`Connected with ${matchedPartner?.name || "a member"}! Setting up video...`, "success");

            // Ensure media stream is active
            await initializeMedia();

            // Setup peer connection
            const pc = createPeerConnection(newCallId, isInitiator);

            // If initiator: create and send WebRTC offer
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

    // Reattach local stream when video element becomes available
    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [callState]);

    // Search timer effect
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
        cleanupPeerConnection();
        setCallState("searching");
        if (socketRef.current) {
            socketRef.current.emit("random:next", { callId });
            socketRef.current.emit("random:join-queue");
        }
    };

    const handleEndCall = () => {
        cleanupPeerConnection();
        setCallState("idle");
        setPartner(null);
        setCallId(null);
        if (socketRef.current) {
            socketRef.current.emit("random:end-call", { callId });
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

    // Format seconds as MM:SS
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#fff", display: "flex", flexDirection: "column" }}>
            {/* Top Navigation Bar */}
            <Box
                sx={{
                    px: { xs: 2, md: 4 },
                    py: 1.5,
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    zIndex: 10,
                }}
            >
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        color: "#FF9839",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                    onClick={() => navigate("/home")}
                >
                    <WhatshotIcon sx={{ color: "#FF9839", fontSize: 28 }} /> ENGAZE.com
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                        startIcon={<WhatshotIcon />}
                        onClick={() => navigate("/discovery")}
                        sx={{ color: "#cbd5e1", textTransform: "none" }}
                    >
                        Discovery
                    </Button>
                    <Button
                        startIcon={<FavoriteIcon />}
                        onClick={() => navigate("/matches")}
                        sx={{ color: "#cbd5e1", textTransform: "none" }}
                    >
                        Matches
                    </Button>
                    <Button
                        startIcon={<ChatIcon />}
                        onClick={() => navigate("/chat")}
                        sx={{ color: "#cbd5e1", textTransform: "none" }}
                    >
                        Chat
                    </Button>
                    <IconButton title="Profile" onClick={() => navigate("/profile")} sx={{ color: "#cbd5e1" }}>
                        <PersonIcon />
                    </IconButton>
                    <IconButton title="Home" onClick={() => navigate("/home")} sx={{ color: "#cbd5e1" }}>
                        <HomeIcon />
                    </IconButton>
                    <Button variant="outlined" color="error" size="small" onClick={handleLogout} sx={{ textTransform: "none" }}>
                        Logout
                    </Button>
                </Stack>
            </Box>

            {/* Main Video Arena */}
            <Box sx={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: { xs: 1, md: 3 } }}>
                {/* 1. IDLE STATE: Local Video Preview & Start Button */}
                {callState === "idle" && (
                    <Container maxWidth="sm" sx={{ textAlign: "center" }}>
                        <Paper
                            elevation={6}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                backgroundColor: "rgba(30, 41, 59, 0.9)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "#FF9839" }}>
                                1-to-1 Random Video Match
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                                Meet available verified members instantly via private one-to-one video calls.
                            </Typography>

                            {mediaError && (
                                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, textAlign: "left" }}>
                                    {mediaError}
                                </Alert>
                            )}

                            {/* Camera Preview Box */}
                            <Box
                                sx={{
                                    width: "100%",
                                    height: { xs: 240, md: 320 },
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    backgroundColor: "#000",
                                    position: "relative",
                                    mb: 3,
                                    border: "2px solid rgba(255, 152, 57, 0.4)",
                                }}
                            >
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        transform: "scaleX(-1)", // Mirror local preview
                                    }}
                                />
                                {!videoEnabled && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "rgba(0,0,0,0.85)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <VideocamOffIcon sx={{ fontSize: 50, color: "#94a3b8", mb: 1 }} />
                                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                                            Camera is turned off
                                        </Typography>
                                    </Box>
                                )}

                                {/* Floating Preview Controls */}
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        position: "absolute",
                                        bottom: 12,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        borderRadius: 4,
                                        px: 2,
                                        py: 0.5,
                                    }}
                                >
                                    <IconButton size="small" onClick={toggleAudio} sx={{ color: audioEnabled ? "#fff" : "#ef4444" }}>
                                        {audioEnabled ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                                    </IconButton>
                                    <IconButton size="small" onClick={toggleVideo} sx={{ color: videoEnabled ? "#fff" : "#ef4444" }}>
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
                                    backgroundColor: "#FF9839",
                                    "&:hover": { backgroundColor: "#e68933" },
                                    fontWeight: 700,
                                    fontSize: "1.1rem",
                                    borderRadius: 4,
                                    px: 5,
                                    py: 1.5,
                                    textTransform: "none",
                                    boxShadow: "0 4px 20px rgba(255, 152, 57, 0.4)",
                                }}
                            >
                                Start Matchmaking
                            </Button>

                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
                                <SecurityIcon sx={{ fontSize: 16, color: "#10b981" }} />
                                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
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
                            elevation={6}
                            sx={{
                                p: 5,
                                borderRadius: 4,
                                backgroundColor: "rgba(30, 41, 59, 0.95)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <Box sx={{ position: "relative", mb: 3 }}>
                                <CircularProgress size={100} sx={{ color: "#FF9839" }} thickness={3} />
                                <Avatar
                                    src={userData?.photos?.[0]}
                                    sx={{
                                        position: "absolute",
                                        top: 15,
                                        left: 15,
                                        width: 70,
                                        height: 70,
                                        border: "3px solid #FF9839",
                                    }}
                                >
                                    {userData?.name?.charAt(0) || "U"}
                                </Avatar>
                            </Box>

                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                Finding your match...
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                                Searching for an available person ({formatTime(searchDuration)})
                            </Typography>

                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleCancelSearch}
                                sx={{ borderRadius: 4, px: 4, textTransform: "none" }}
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
                            elevation={6}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                backgroundColor: "rgba(30, 41, 59, 0.95)",
                                border: "1px solid rgba(255, 152, 57, 0.5)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <Avatar
                                src={partner?.photos?.[0]}
                                sx={{ width: 90, height: 90, mb: 2, border: "3px solid #10b981" }}
                            >
                                {partner?.name?.charAt(0) || "P"}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff" }}>
                                Matched with {partner?.name || "a member"}!
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                                Negotiating video stream...
                            </Typography>
                            <CircularProgress size={30} sx={{ color: "#FF9839" }} />
                        </Paper>
                    </Container>
                )}

                {/* 4. CONNECTED STATE: Full Video Experience */}
                {callState === "connected" && (
                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: 1100,
                            height: { xs: "calc(100vh - 120px)", md: "calc(100vh - 140px)" },
                            position: "relative",
                            borderRadius: 4,
                            overflow: "hidden",
                            backgroundColor: "#000",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
                        }}
                    >
                        {/* Remote Video (Main) */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />

                        {/* Partner Profile Badge (Top Left) */}
                        {partner && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 16,
                                    left: 16,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(8px)",
                                    borderRadius: 4,
                                    px: 2,
                                    py: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    border: "1px solid rgba(255,255,255,0.15)",
                                }}
                            >
                                <Avatar src={partner.photos?.[0]} sx={{ width: 36, height: 36 }}>
                                    {partner.name?.charAt(0) || "P"}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                        {partner.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                        @{partner.username}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Local Video Picture-in-Picture (Top Right) */}
                        <Box
                            sx={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                width: { xs: 100, sm: 160, md: 220 },
                                height: { xs: 140, sm: 110, md: 150 },
                                borderRadius: 3,
                                overflow: "hidden",
                                border: "2px solid rgba(255,255,255,0.4)",
                                backgroundColor: "#1e293b",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                                zIndex: 5,
                            }}
                        >
                            <video
                                ref={localVideoRef}
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
                                        backgroundColor: "rgba(0,0,0,0.9)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <VideocamOffIcon sx={{ color: "#94a3b8", fontSize: 24 }} />
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
                                backgroundColor: "rgba(15, 23, 42, 0.85)",
                                backdropFilter: "blur(12px)",
                                borderRadius: 8,
                                px: { xs: 2, sm: 3 },
                                py: 1.2,
                                display: "flex",
                                alignItems: "center",
                                gap: { xs: 1.5, sm: 2.5 },
                                border: "1px solid rgba(255,255,255,0.15)",
                                boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                                zIndex: 10,
                            }}
                        >
                            {/* Toggle Audio */}
                            <Tooltip title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}>
                                <IconButton
                                    onClick={toggleAudio}
                                    sx={{
                                        backgroundColor: audioEnabled ? "rgba(255,255,255,0.15)" : "#ef4444",
                                        color: "#fff",
                                        "&:hover": { backgroundColor: audioEnabled ? "rgba(255,255,255,0.25)" : "#dc2626" },
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
                                        backgroundColor: videoEnabled ? "rgba(255,255,255,0.15)" : "#ef4444",
                                        color: "#fff",
                                        "&:hover": { backgroundColor: videoEnabled ? "rgba(255,255,255,0.25)" : "#dc2626" },
                                        width: 46,
                                        height: 46,
                                    }}
                                >
                                    {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                            </Tooltip>

                            {/* Next Match Button */}
                            <Tooltip title="Skip to Next Match">
                                <Button
                                    variant="contained"
                                    startIcon={<SkipNextIcon />}
                                    onClick={handleNextMatch}
                                    sx={{
                                        backgroundColor: "#FF9839",
                                        "&:hover": { backgroundColor: "#e68933" },
                                        borderRadius: 4,
                                        px: { xs: 2, sm: 3 },
                                        fontWeight: 700,
                                        textTransform: "none",
                                        height: 46,
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
                                        backgroundColor: "#ef4444",
                                        color: "#fff",
                                        "&:hover": { backgroundColor: "#dc2626" },
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
                            elevation={6}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                backgroundColor: "rgba(30, 41, 59, 0.95)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <CallEndIcon sx={{ fontSize: 50, color: "#ef4444", mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Call Finished
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                                {endReasonNotice || "The call has ended."}
                            </Typography>

                            <Stack spacing={1.5} sx={{ width: "100%" }}>
                                <Button
                                    variant="contained"
                                    onClick={handleStartSearch}
                                    startIcon={<SearchIcon />}
                                    sx={{
                                        backgroundColor: "#FF9839",
                                        "&:hover": { backgroundColor: "#e68933" },
                                        borderRadius: 4,
                                        py: 1.2,
                                        fontWeight: 700,
                                        textTransform: "none",
                                    }}
                                >
                                    Find Next Match
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setCallState("idle")}
                                    sx={{ borderRadius: 4, py: 1.2, textTransform: "none", color: "#cbd5e1" }}
                                >
                                    Back to Preview
                                </Button>
                            </Stack>
                        </Paper>
                    </Container>
                )}
            </Box>

            {/* Permission Denied Dialog */}
            <Dialog open={permissionDeniedDialog} onClose={() => setPermissionDeniedDialog(false)}>
                <DialogTitle sx={{ color: "#ef4444" }}>Camera & Microphone Access Required</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Engaze 1-to-1 video matchmaking requires camera and microphone permissions to connect you with members.
                        Please enable permissions in your browser's address bar and click Retry.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPermissionDeniedDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            setPermissionDeniedDialog(false);
                            initializeMedia();
                        }}
                        variant="contained"
                        sx={{ backgroundColor: "#FF9839" }}
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
                <Alert severity={toastSeverity} onClose={() => setOpenToast(false)} sx={{ width: "100%", borderRadius: 3 }}>
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default withAuth(RandomVideoPage);
