import React, { useEffect, useRef } from "react";
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import CallIcon from "@mui/icons-material/Call";
import CallEndIcon from "@mui/icons-material/CallEnd";
import PhoneDisabledIcon from "@mui/icons-material/PhoneDisabled";
import PhoneBusyIcon from "@mui/icons-material/PhoneMissed";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import { BRAND_COLORS } from "../theme";
import { useDirectCall } from "../contexts/DirectCallContext";

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function DirectVideoCallModal() {
    const {
        callState,
        callSession,
        localStream,
        remoteStream,
        audioEnabled,
        videoEnabled,
        callDuration,
        statusMessage,
        callError,
        acceptDirectCall,
        declineDirectCall,
        endDirectCall,
        toggleAudio,
        toggleVideo,
    } = useDirectCall();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(() => {});
        }
    }, [localStream, callState]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
        }
    }, [remoteStream, callState]);

    if (callState === "idle" && !callError) {
        return null;
    }

    const partner = callSession?.partner;
    const partnerName = partner?.name || partner?.username || "Match";
    const partnerPhoto = partner?.photos?.[0] || "";

    // -------------------------------------------------------------
    // 1. INCOMING CALL SCREEN (Callee View)
    // -------------------------------------------------------------
    if (callState === "incoming_ringing") {
        return (
            <Dialog
                open
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: "rgba(17, 24, 39, 0.95)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(253, 58, 115, 0.3)",
                        p: 3,
                        textAlign: "center",
                        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
                    },
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
                    {/* Ringing Ripple Avatar */}
                    <Box
                        sx={{
                            position: "relative",
                            mb: 3,
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                background: "rgba(253, 58, 115, 0.35)",
                                animation: "pulse-ring 1.8s infinite",
                            },
                        }}
                    >
                        <Avatar
                            src={partnerPhoto}
                            alt={partnerName}
                            sx={{
                                width: 104,
                                height: 104,
                                border: `3px solid ${BRAND_COLORS.coralPink}`,
                                boxShadow: "0 0 25px rgba(253, 58, 115, 0.5)",
                            }}
                        />
                    </Box>

                    <Typography variant="overline" sx={{ color: BRAND_COLORS.coralPink, letterSpacing: 2, fontWeight: 800 }}>
                        Incoming Video Call
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", mt: 0.5, mb: 0.5 }}>
                        {partnerName}
                        {partner?.age ? `, ${partner.age}` : ""}
                    </Typography>

                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 4 }}>
                        Established Connection &bull; 1-on-1 Direct Video
                    </Typography>

                    {/* Action Buttons: Accept & Decline */}
                    <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
                        <Box sx={{ textAlign: "center", cursor: "pointer" }} onClick={declineDirectCall}>
                            <IconButton
                                aria-label="Decline Call"
                                onClick={declineDirectCall}
                                sx={{
                                    bgcolor: "#EF4444",
                                    color: "#FFFFFF",
                                    width: 64,
                                    height: 64,
                                    boxShadow: "0 8px 24px rgba(239, 68, 68, 0.45)",
                                    "&:hover": { bgcolor: "#DC2626", transform: "scale(1.05)" },
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <CallEndIcon sx={{ fontSize: 32 }} />
                            </IconButton>
                            <Typography variant="caption" sx={{ display: "block", color: "#EF4444", fontWeight: 700, mt: 1 }}>
                                Decline
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: "center", cursor: "pointer" }} onClick={acceptDirectCall}>
                            <IconButton
                                aria-label="Accept Call"
                                onClick={acceptDirectCall}
                                sx={{
                                    bgcolor: "#10B981",
                                    color: "#FFFFFF",
                                    width: 64,
                                    height: 64,
                                    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.45)",
                                    "&:hover": { bgcolor: "#059669", transform: "scale(1.05)" },
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <CallIcon sx={{ fontSize: 32 }} />
                            </IconButton>
                            <Typography variant="caption" sx={{ display: "block", color: "#10B981", fontWeight: 700, mt: 1 }}>
                                Accept
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Dialog>
        );
    }

    // -------------------------------------------------------------
    // 2. OUTGOING CALL SCREEN (Caller Ringing View)
    // -------------------------------------------------------------
    if (callState === "outgoing_ringing") {
        return (
            <Dialog
                open
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: "rgba(17, 24, 39, 0.95)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        p: 3,
                        textAlign: "center",
                        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
                    },
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
                    <Box sx={{ position: "relative", mb: 3 }}>
                        <Avatar
                            src={partnerPhoto}
                            alt={partnerName}
                            sx={{
                                width: 104,
                                height: 104,
                                border: `3px solid ${BRAND_COLORS.violet}`,
                                boxShadow: "0 0 25px rgba(139, 92, 246, 0.5)",
                            }}
                        />
                    </Box>

                    <Typography variant="overline" sx={{ color: BRAND_COLORS.violet, letterSpacing: 2, fontWeight: 800 }}>
                        Direct Video Call
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", mt: 0.5 }}>
                        Calling {partnerName}...
                    </Typography>

                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 4, mt: 0.5 }}>
                        Ringing partner's device
                    </Typography>

                    {/* Local Camera Preview PIP */}
                    {localStream && (
                        <Box
                            sx={{
                                width: 140,
                                height: 90,
                                borderRadius: "14px",
                                overflow: "hidden",
                                mb: 3,
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                bgcolor: "#000",
                            }}
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                            />
                        </Box>
                    )}

                    <Box sx={{ textAlign: "center", cursor: "pointer" }} onClick={endDirectCall}>
                        <IconButton
                            aria-label="End Call"
                            onClick={endDirectCall}
                            sx={{
                                bgcolor: "#EF4444",
                                color: "#FFFFFF",
                                width: 64,
                                height: 64,
                                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.45)",
                                "&:hover": { bgcolor: "#DC2626", transform: "scale(1.05)" },
                            }}
                        >
                            <CallEndIcon sx={{ fontSize: 32 }} />
                        </IconButton>
                        <Typography variant="caption" sx={{ display: "block", color: BRAND_COLORS.textSecondary, mt: 1 }}>
                            End Call
                        </Typography>
                    </Box>
                </Box>
            </Dialog>
        );
    }

    // -------------------------------------------------------------
    // 3. CONNECTING SCREEN
    // -------------------------------------------------------------
    if (callState === "connecting") {
        return (
            <Dialog
                open
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: "rgba(17, 24, 39, 0.95)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        p: 3,
                        textAlign: "center",
                    },
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
                    <CircularProgress size={54} sx={{ color: BRAND_COLORS.emerald, mb: 2.5 }} />
                    <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                        Connecting with {partnerName}...
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mt: 0.5, mb: 3 }}>
                        Establishing secure encrypted media stream
                    </Typography>
                    <IconButton
                        onClick={endDirectCall}
                        sx={{
                            bgcolor: "#EF4444",
                            color: "#FFFFFF",
                            width: 52,
                            height: 52,
                            "&:hover": { bgcolor: "#DC2626" },
                        }}
                    >
                        <CallEndIcon />
                    </IconButton>
                </Box>
            </Dialog>
        );
    }

    // -------------------------------------------------------------
    // 4. TERMINAL STATUS SCREENS (Declined, Busy, No Answer, Ended)
    // -------------------------------------------------------------
    if (["declined", "busy", "no_answer", "ended"].includes(callState)) {
        let IconComponent = PhoneDisabledIcon;
        let iconColor = "#EF4444";

        if (callState === "busy") {
            IconComponent = PhoneBusyIcon;
            iconColor = "#F59E0B";
        } else if (callState === "ended") {
            IconComponent = CallEndIcon;
            iconColor = BRAND_COLORS.violet;
        }

        return (
            <Dialog
                open
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "24px",
                        bgcolor: "rgba(17, 24, 39, 0.95)",
                        backdropFilter: "blur(20px)",
                        border: `1px solid ${iconColor}40`,
                        p: 3,
                        textAlign: "center",
                    },
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
                    <Avatar
                        sx={{
                            width: 68,
                            height: 68,
                            bgcolor: `${iconColor}20`,
                            color: iconColor,
                            mb: 2,
                        }}
                    >
                        <IconComponent sx={{ fontSize: 36 }} />
                    </Avatar>

                    <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 800 }}>
                        {statusMessage || "Call Finished"}
                    </Typography>

                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mt: 0.5 }}>
                        {callState === "ended" && callDuration > 0
                            ? `Call duration: ${formatDuration(callDuration)}`
                            : "Returning to application..."}
                    </Typography>
                </Box>
            </Dialog>
        );
    }

    // -------------------------------------------------------------
    // 5. CONNECTED FULL-SCREEN VIDEO CALL INTERFACE
    // -------------------------------------------------------------
    if (callState === "connected") {
        return (
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    bgcolor: "#000000",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Top Status Header */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 16,
                        left: 20,
                        right: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        zIndex: 10,
                    }}
                >
                    {/* Partner Details */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={partnerPhoto} alt={partnerName} sx={{ width: 42, height: 42, border: "2px solid #10B981" }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ color: "#FFFFFF", fontWeight: 800, lineHeight: 1.2 }}>
                                {partnerName}
                            </Typography>
                            <Stack direction="row" spacing={0.8} alignItems="center">
                                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#10B981" }} />
                                <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 700 }}>
                                    Connected &bull; {formatDuration(callDuration)}
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>

                    <Box
                        sx={{
                            px: 1.6,
                            py: 0.6,
                            borderRadius: "9999px",
                            bgcolor: "rgba(0, 0, 0, 0.6)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                        }}
                    >
                        <SparklesIcon sx={{ fontSize: 16, color: BRAND_COLORS.coralPink }} />
                        <Typography variant="caption" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                            Direct 1-on-1 Call
                        </Typography>
                    </Box>
                </Box>

                {/* Main Remote Video */}
                <Box
                    sx={{
                        flex: 1,
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#0F172A",
                    }}
                >
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

                    {/* Fallback if remote video track hasn't rendered yet */}
                    {!remoteStream && (
                        <Box sx={{ position: "absolute", textAlign: "center" }}>
                            <Avatar
                                src={partnerPhoto}
                                alt={partnerName}
                                sx={{ width: 96, height: 96, mx: "auto", mb: 2, border: `3px solid ${BRAND_COLORS.violet}` }}
                            />
                            <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                                Waiting for {partnerName}'s video...
                            </Typography>
                        </Box>
                    )}

                    {/* Picture-in-Picture Local Video Feed */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: { xs: 96, sm: 104 },
                            right: 20,
                            width: { xs: 110, sm: 170 },
                            height: { xs: 155, sm: 240 },
                            borderRadius: "18px",
                            overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
                            border: "2px solid rgba(255, 255, 255, 0.25)",
                            bgcolor: "#000",
                            zIndex: 10,
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
                                    bgcolor: "rgba(0, 0, 0, 0.8)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <VideocamOffIcon sx={{ color: "#EF4444", fontSize: 28 }} />
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Bottom In-Call Controls Toolbar */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 24,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 20,
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            bgcolor: "rgba(15, 23, 42, 0.85)",
                            backdropFilter: "blur(16px)",
                            px: 3,
                            py: 1.2,
                            borderRadius: "9999px",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            boxShadow: "0 12px 35px rgba(0, 0, 0, 0.5)",
                        }}
                    >
                        {/* Audio Toggle Button */}
                        <Tooltip title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}>
                            <IconButton
                                onClick={toggleAudio}
                                sx={{
                                    width: 52,
                                    height: 52,
                                    bgcolor: audioEnabled ? "rgba(255, 255, 255, 0.12)" : "#EF4444",
                                    color: "#FFFFFF",
                                    "&:hover": {
                                        bgcolor: audioEnabled ? "rgba(255, 255, 255, 0.2)" : "#DC2626",
                                    },
                                }}
                            >
                                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {/* Video Toggle Button */}
                        <Tooltip title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}>
                            <IconButton
                                onClick={toggleVideo}
                                sx={{
                                    width: 52,
                                    height: 52,
                                    bgcolor: videoEnabled ? "rgba(255, 255, 255, 0.12)" : "#EF4444",
                                    color: "#FFFFFF",
                                    "&:hover": {
                                        bgcolor: videoEnabled ? "rgba(255, 255, 255, 0.2)" : "#DC2626",
                                    },
                                }}
                            >
                                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {/* End Call Button */}
                        <Tooltip title="End Call">
                            <IconButton
                                onClick={endDirectCall}
                                sx={{
                                    width: 52,
                                    height: 52,
                                    bgcolor: "#EF4444",
                                    color: "#FFFFFF",
                                    "&:hover": {
                                        bgcolor: "#DC2626",
                                    },
                                }}
                            >
                                <CallEndIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
            </Box>
        );
    }

    return null;
}
