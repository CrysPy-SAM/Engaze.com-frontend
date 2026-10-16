import React from "react";
import { useNavigate } from "react-router-dom";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import VideocamIcon from "@mui/icons-material/Videocam";
import ChatIcon from "@mui/icons-material/Chat";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SecurityIcon from "@mui/icons-material/Security";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, color: "#FFFFFF", overflowX: "hidden" }}>
            {/* Top Navigation */}
            <Box
                sx={{
                    px: { xs: 2.5, md: 6 },
                    py: 2.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    backgroundColor: "rgba(11, 13, 23, 0.7)",
                    backdropFilter: "blur(16px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                {/* Logo */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: "12px",
                            background: BRAND_COLORS.primaryGradient,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 18px rgba(253, 58, 115, 0.4)",
                        }}
                    >
                        <WhatshotIcon sx={{ color: "#fff", fontSize: 28 }} />
                    </Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: "-0.03em",
                            background: "linear-gradient(135deg, #FFFFFF 60%, rgba(255,255,255,0.7) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        ENGAZE<span style={{ color: BRAND_COLORS.coralPink }}>.</span>
                    </Typography>
                </Box>

                {/* Right CTAs */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                        variant="text"
                        onClick={() => navigate("/auth")}
                        sx={{
                            color: "rgba(255,255,255,0.85)",
                            borderRadius: 9999,
                            px: 3,
                            "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
                        }}
                    >
                        Sign In
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate("/auth")}
                        sx={{
                            background: BRAND_COLORS.primaryGradient,
                            borderRadius: 9999,
                            px: 3.5,
                            fontWeight: 800,
                            boxShadow: "0 4px 20px rgba(253, 58, 115, 0.4)",
                        }}
                    >
                        Get Started
                    </Button>
                </Stack>
            </Box>

            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 10 } }}>
                <Grid container spacing={6} alignItems="center">
                    {/* Left Column: Headlines & Call to Action */}
                    <Grid item xs={12} md={7}>
                        <Box sx={{ maxWidth: 620 }}>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 2,
                                    py: 0.8,
                                    borderRadius: 9999,
                                    bgcolor: "rgba(253, 58, 115, 0.12)",
                                    border: "1px solid rgba(253, 58, 115, 0.3)",
                                    color: BRAND_COLORS.coralPink,
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    mb: 3,
                                }}
                            >
                                <WhatshotIcon sx={{ fontSize: 18 }} />
                                The Next Generation of Dating
                            </Box>

                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: "2.8rem", sm: "3.6rem", md: "4.2rem" },
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                    letterSpacing: "-0.03em",
                                    mb: 3,
                                }}
                            >
                                Where Real Connections{" "}
                                <span className="gradient-text">Ignite.</span>
                            </Typography>

                            <Typography
                                variant="h6"
                                sx={{
                                    color: BRAND_COLORS.textSecondary,
                                    fontWeight: 400,
                                    lineHeight: 1.6,
                                    mb: 5,
                                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                                }}
                            >
                                Match through intuitive card discovery, chat instantly with mutual likes, and meet face-to-face via secure 1-to-1 video calling.
                            </Typography>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate("/auth")}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        py: 1.8,
                                        px: 4.5,
                                        fontSize: "1.1rem",
                                        fontWeight: 800,
                                        borderRadius: 9999,
                                        boxShadow: "0 8px 30px rgba(253, 58, 115, 0.5)",
                                    }}
                                >
                                    Start Swiping Now
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<VideocamIcon />}
                                    onClick={() => navigate("/auth")}
                                    sx={{
                                        borderColor: "rgba(255, 255, 255, 0.2)",
                                        color: "#FFFFFF",
                                        py: 1.8,
                                        px: 4,
                                        fontSize: "1.05rem",
                                        fontWeight: 700,
                                        borderRadius: 9999,
                                        "&:hover": {
                                            borderColor: BRAND_COLORS.coralPink,
                                            bgcolor: "rgba(253, 58, 115, 0.08)",
                                        },
                                    }}
                                >
                                    Explore Video Dating
                                </Button>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* Right Column: Visual Card Composition */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
                            {/* Decorative background glow */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: "120%",
                                    height: "120%",
                                    background: "radial-gradient(circle, rgba(253, 58, 115, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)",
                                    filter: "blur(40px)",
                                    zIndex: 0,
                                }}
                            />

                            {/* Floating Mock Profile Card */}
                            <Paper
                                elevation={10}
                                className="float-animation"
                                sx={{
                                    width: { xs: 300, sm: 340 },
                                    height: { xs: 440, sm: 480 },
                                    borderRadius: "32px",
                                    overflow: "hidden",
                                    position: "relative",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: "2px solid rgba(255, 255, 255, 0.12)",
                                    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
                                    zIndex: 1,
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/login&register.png"
                                    alt="Engaze Dating Preview"
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 3,
                                        background: BRAND_COLORS.cardOverlay,
                                    }}
                                >
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff" }}>
                                        Sophia, 24
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 1.5 }}>
                                        Photography, Travel & Coffee
                                    </Typography>

                                    {/* Action Preview Buttons */}
                                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "rgba(239, 68, 68, 0.2)", border: "2px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                                            <WhatshotIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: BRAND_COLORS.primaryGradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                                            <FavoriteIcon fontSize="small" />
                                        </Box>
                                    </Stack>
                                </Box>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>

                {/* 3 Value Highlights */}
                <Grid container spacing={4} sx={{ mt: { xs: 8, md: 12 } }}>
                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                transition: "transform 0.2s ease, border-color 0.2s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(253, 58, 115, 0.4)",
                                },
                            }}
                        >
                            <Box sx={{ width: 52, height: 52, borderRadius: "16px", bgcolor: "rgba(253, 58, 115, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND_COLORS.coralPink, mb: 2.5 }}>
                                <FavoriteIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#fff" }}>
                                Smart Dating Discovery
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.6 }}>
                                Clean portrait cards with mutual gender and age compatibility. Swipe right to like, swipe left to pass.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                transition: "transform 0.2s ease, border-color 0.2s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(139, 92, 246, 0.4)",
                                },
                            }}
                        >
                            <Box sx={{ width: 52, height: 52, borderRadius: "16px", bgcolor: "rgba(139, 92, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND_COLORS.violet, mb: 2.5 }}>
                                <VideocamIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#fff" }}>
                                1-to-1 Video Matchmaking
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.6 }}>
                                Meet members face-to-face via fast, encrypted WebRTC video matchmaking with skip and mute controls.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                transition: "transform 0.2s ease, border-color 0.2s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(16, 185, 129, 0.4)",
                                },
                            }}
                        >
                            <Box sx={{ width: 52, height: 52, borderRadius: "16px", bgcolor: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND_COLORS.emerald, mb: 2.5 }}>
                                <ChatIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#fff" }}>
                                Private Real-Time Chat
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.6 }}>
                                Chat smoothly with verified mutual matches using live read receipts, photo sharing previews, and WebSocket persistence.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Footer */}
            <Box sx={{ py: 6, borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`, textAlign: "center" }}>
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
                    <SecurityIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 18 }} />
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                        Verified 18+ Dating Platform &bull; Encrypted Video & Messaging
                    </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.textMuted }}>
                    &copy; {new Date().getFullYear()} ENGAZE.com &bull; All Rights Reserved
                </Typography>
            </Box>
        </Box>
    );
}
