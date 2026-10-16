import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Avatar,
    Box,
    Button,
    Card,
    Container,
    Grid,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatIcon from "@mui/icons-material/Chat";
import VideocamIcon from "@mui/icons-material/Videocam";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VideoCallIcon from "@mui/icons-material/VideoCall";

function HomeComponent() {
    const navigate = useNavigate();
    const { userData, addToUserHistory } = useContext(AuthContext);
    const [meetingCode, setMeetingCode] = useState("");

    const handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        try {
            await addToUserHistory(meetingCode);
        } catch (e) {
            console.error("Failed to add to history:", e);
        }
        navigate(`/${meetingCode.trim()}`);
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, pb: { xs: 10, md: 6 } }}>
            {/* Unified Brand Navigation */}
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 5 } }}>
                {/* User Welcome Banner */}
                <Paper
                    elevation={4}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: "28px",
                        backgroundColor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2.5,
                        mb: 5,
                        background: "linear-gradient(135deg, rgba(19, 22, 37, 0.9) 0%, rgba(30, 25, 48, 0.95) 100%)",
                    }}
                >
                    <Stack direction="row" spacing={2.5} alignItems="center">
                        <Avatar
                            src={userData?.photos?.[0]}
                            alt={userData?.name}
                            sx={{
                                width: { xs: 58, sm: 72 },
                                height: { xs: 58, sm: 72 },
                                border: `3px solid ${BRAND_COLORS.coralPink}`,
                                boxShadow: "0 4px 20px rgba(253, 58, 115, 0.4)",
                            }}
                        >
                            {userData?.name?.charAt(0) || "U"}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff" }}>
                                Welcome back, {userData?.name?.split(" ")[0] || "Member"}!
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                Your profile is {userData?.isProfileComplete ? "complete and active" : "incomplete"}. Ready to make new connections?
                            </Typography>
                        </Box>
                    </Stack>

                    <Button
                        variant="outlined"
                        onClick={() => navigate("/profile")}
                        sx={{
                            borderColor: "rgba(255,255,255,0.2)",
                            color: "#fff",
                            borderRadius: 9999,
                            px: 3,
                            "&:hover": { borderColor: BRAND_COLORS.coralPink, bgcolor: "rgba(253, 58, 115, 0.1)" },
                        }}
                    >
                        Edit Profile
                    </Button>
                </Paper>

                {/* Main Feature Cards Grid */}
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "#FFFFFF" }}>
                    Explore Engaze
                </Typography>

                <Grid container spacing={3.5} sx={{ mb: 6 }}>
                    {/* 1. Dating Discovery */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                p: 3,
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(253, 58, 115, 0.5)",
                                    boxShadow: "0 12px 30px rgba(253, 58, 115, 0.2)",
                                },
                            }}
                        >
                            <Box>
                                <Box sx={{ width: 52, height: 52, borderRadius: "16px", background: BRAND_COLORS.primaryGradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", mb: 2.5, boxShadow: "0 4px 15px rgba(253, 58, 115, 0.4)" }}>
                                    <WhatshotIcon sx={{ fontSize: 28 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>
                                    Discovery
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3, lineHeight: 1.5 }}>
                                    Explore curated dating cards matching your age and gender preferences.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate("/discovery")}
                                sx={{
                                    background: BRAND_COLORS.primaryGradient,
                                    borderRadius: 9999,
                                    fontWeight: 700,
                                }}
                            >
                                Start Swiping
                            </Button>
                        </Card>
                    </Grid>

                    {/* 2. 1-to-1 Video Match */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                p: 3,
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(139, 92, 246, 0.5)",
                                    boxShadow: "0 12px 30px rgba(139, 92, 246, 0.2)",
                                },
                            }}
                        >
                            <Box>
                                <Box sx={{ width: 52, height: 52, borderRadius: "16px", background: BRAND_COLORS.secondaryGradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", mb: 2.5, boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)" }}>
                                    <VideocamIcon sx={{ fontSize: 28 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>
                                    Video Match
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3, lineHeight: 1.5 }}>
                                    Meet available members face-to-face via 1-to-1 speed video matchmaking.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate("/random-video")}
                                sx={{
                                    background: BRAND_COLORS.secondaryGradient,
                                    borderRadius: 9999,
                                    fontWeight: 700,
                                }}
                            >
                                Find Match
                            </Button>
                        </Card>
                    </Grid>

                    {/* 3. Mutual Matches */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                p: 3,
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(253, 58, 115, 0.4)",
                                    boxShadow: "0 12px 30px rgba(253, 58, 115, 0.15)",
                                },
                            }}
                        >
                            <Box>
                                <Box sx={{ width: 52, height: 52, borderRadius: "16px", bgcolor: "rgba(253, 58, 115, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND_COLORS.coralPink, mb: 2.5 }}>
                                    <FavoriteIcon sx={{ fontSize: 28 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>
                                    My Matches
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3, lineHeight: 1.5 }}>
                                    See all the profiles that mutually liked you back and start dating.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate("/matches")}
                                sx={{
                                    borderColor: "rgba(255,255,255,0.2)",
                                    color: "#fff",
                                    borderRadius: 9999,
                                    fontWeight: 700,
                                    "&:hover": { borderColor: BRAND_COLORS.coralPink, bgcolor: "rgba(253, 58, 115, 0.1)" },
                                }}
                            >
                                View Matches
                            </Button>
                        </Card>
                    </Grid>

                    {/* 4. Messages */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                p: 3,
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(16, 185, 129, 0.4)",
                                    boxShadow: "0 12px 30px rgba(16, 185, 129, 0.15)",
                                },
                            }}
                        >
                            <Box>
                                <Box sx={{ width: 52, height: 52, borderRadius: "16px", bgcolor: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND_COLORS.emerald, mb: 2.5 }}>
                                    <ChatIcon sx={{ fontSize: 28 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>
                                    Private Chat
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3, lineHeight: 1.5 }}>
                                    Jump back into your conversations with read receipts and live messaging.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate("/chat")}
                                sx={{
                                    borderColor: "rgba(255,255,255,0.2)",
                                    color: "#fff",
                                    borderRadius: 9999,
                                    fontWeight: 700,
                                    "&:hover": { borderColor: BRAND_COLORS.emerald, bgcolor: "rgba(16, 185, 129, 0.1)" },
                                }}
                            >
                                Open Chats
                            </Button>
                        </Card>
                    </Grid>
                </Grid>

                {/* Legacy Meeting Room Joiner (Preserved & Styled) */}
                <Paper
                    elevation={2}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: "24px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 3,
                    }}
                >
                    <Box sx={{ maxWidth: 520 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                            <VideoCallIcon sx={{ color: BRAND_COLORS.violet, fontSize: 28 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff" }}>
                                Private Meeting Room
                            </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.5 }}>
                            Have a specific room code? Enter it below to join a direct peer-to-peer room.
                        </Typography>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", md: "auto" } }}>
                        <TextField
                            size="small"
                            placeholder="Enter Meeting Code"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleJoinVideoCall()}
                            sx={{ minWidth: { sm: 240 } }}
                        />
                        <Button
                            variant="contained"
                            disabled={!meetingCode.trim()}
                            onClick={handleJoinVideoCall}
                            sx={{
                                bgcolor: BRAND_COLORS.violet,
                                borderRadius: 9999,
                                px: 3,
                                "&:hover": { bgcolor: "#7C3AED" },
                            }}
                        >
                            Join Room
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}

export default withAuth(HomeComponent);