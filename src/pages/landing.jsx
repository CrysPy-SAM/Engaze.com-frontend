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
    Chip,
    IconButton,
} from "@mui/material";
import EngazeLogo from "../components/EngazeLogo";

// Icons
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

export default function LandingPage() {
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, color: "#FFFFFF", overflowX: "hidden" }}>
            {/* Top Navigation Bar */}
            <Box
                component="header"
                sx={{
                    px: { xs: 2, sm: 4, md: 8 },
                    py: { xs: 1.8, md: 2.2 },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    backgroundColor: "rgba(11, 13, 23, 0.8)",
                    backdropFilter: "blur(20px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                {/* Official Brand Logo */}
                <EngazeLogo
                    size={38}
                    fontSize="1.5rem"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                />

                {/* Desktop Anchor Navigation */}
                <Stack
                    direction="row"
                    spacing={3.5}
                    sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
                >
                    <Typography
                        variant="body2"
                        onClick={() => scrollToSection("features")}
                        sx={{
                            color: "rgba(255, 255, 255, 0.75)",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "color 0.2s ease",
                            "&:hover": { color: "#FFFFFF" },
                        }}
                    >
                        Features
                    </Typography>
                    <Typography
                        variant="body2"
                        onClick={() => scrollToSection("video-dating")}
                        sx={{
                            color: "rgba(255, 255, 255, 0.75)",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "color 0.2s ease",
                            "&:hover": { color: "#FFFFFF" },
                        }}
                    >
                        Live Video Dating
                    </Typography>
                    <Typography
                        variant="body2"
                        onClick={() => scrollToSection("difference")}
                        sx={{
                            color: "rgba(255, 255, 255, 0.75)",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "color 0.2s ease",
                            "&:hover": { color: "#FFFFFF" },
                        }}
                    >
                        Why Engaze
                    </Typography>
                    <Typography
                        variant="body2"
                        onClick={() => scrollToSection("safety")}
                        sx={{
                            color: "rgba(255, 255, 255, 0.75)",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "color 0.2s ease",
                            "&:hover": { color: "#FFFFFF" },
                        }}
                    >
                        Safety & Trust
                    </Typography>
                </Stack>

                {/* Right Action Buttons */}
                <Stack direction="row" spacing={{ xs: 1.2, sm: 2 }} alignItems="center">
                    <Button
                        variant="text"
                        onClick={() => navigate("/auth")}
                        sx={{
                            color: "rgba(255, 255, 255, 0.85)",
                            borderRadius: 9999,
                            px: { xs: 1.5, sm: 2.5 },
                            fontSize: { xs: "0.85rem", sm: "0.92rem" },
                            fontWeight: 700,
                            "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.06)" },
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
                            px: { xs: 2.2, sm: 3.5 },
                            py: { xs: 0.9, sm: 1.1 },
                            fontSize: { xs: "0.85rem", sm: "0.95rem" },
                            fontWeight: 800,
                            boxShadow: "0 4px 20px rgba(253, 58, 115, 0.4)",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            "&:hover": {
                                transform: "translateY(-1px)",
                                boxShadow: "0 6px 25px rgba(253, 58, 115, 0.6)",
                            },
                        }}
                    >
                        Join Free
                    </Button>
                </Stack>
            </Box>

            {/* Hero Section */}
            <Container maxWidth="xl" sx={{ pt: { xs: 6, sm: 8, md: 12 }, pb: { xs: 8, md: 12 }, px: { xs: 2.5, sm: 4, md: 6 } }}>
                <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
                    {/* Left Column: Headlines & Call to Action */}
                    <Grid item xs={12} md={7}>
                        <Box sx={{ maxWidth: 660 }}>
                            {/* Eyebrow Pill */}
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    px: 2.2,
                                    py: 0.9,
                                    borderRadius: 9999,
                                    bgcolor: "rgba(253, 58, 115, 0.12)",
                                    border: "1px solid rgba(253, 58, 115, 0.3)",
                                    color: BRAND_COLORS.coralPink,
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    mb: 3,
                                }}
                            >
                                <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
                                The Modern Standard for Dating & Live Video
                            </Box>

                            {/* Headline */}
                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: "2.6rem", sm: "3.5rem", md: "4.2rem" },
                                    fontWeight: 900,
                                    lineHeight: 1.08,
                                    letterSpacing: "-0.035em",
                                    mb: 3,
                                }}
                            >
                                Where Real Sparks{" "}
                                <br />
                                <span className="gradient-text">Become Real Connections.</span>
                            </Typography>

                            {/* Subtitle */}
                            <Typography
                                variant="body1"
                                sx={{
                                    color: BRAND_COLORS.textSecondary,
                                    lineHeight: 1.65,
                                    fontSize: { xs: "1.05rem", sm: "1.15rem", md: "1.25rem" },
                                    mb: 4.5,
                                    maxWidth: 580,
                                }}
                            >
                                Experience dating without the guesswork. Browse compatible singles, chat instantly with mutual likes, and test genuine chemistry through secure 1-on-1 video dates — before exchanging numbers.
                            </Typography>

                            {/* CTAs */}
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4.5 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    endIcon={<ArrowForwardRoundedIcon />}
                                    onClick={() => navigate("/auth")}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        py: { xs: 1.6, sm: 1.9 },
                                        px: { xs: 3.5, sm: 4.5 },
                                        fontSize: "1.05rem",
                                        fontWeight: 800,
                                        borderRadius: 9999,
                                        boxShadow: "0 8px 30px rgba(253, 58, 115, 0.45)",
                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 12px 35px rgba(253, 58, 115, 0.65)",
                                        },
                                    }}
                                >
                                    Start Discovering Free
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<VideocamRoundedIcon />}
                                    onClick={() => navigate("/auth")}
                                    sx={{
                                        borderColor: "rgba(255, 255, 255, 0.2)",
                                        color: "#FFFFFF",
                                        py: { xs: 1.6, sm: 1.9 },
                                        px: { xs: 3, sm: 4 },
                                        fontSize: "1.02rem",
                                        fontWeight: 700,
                                        borderRadius: 9999,
                                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                                        backdropFilter: "blur(8px)",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            borderColor: BRAND_COLORS.coralPink,
                                            backgroundColor: "rgba(253, 58, 115, 0.08)",
                                            transform: "translateY(-2px)",
                                        },
                                    }}
                                >
                                    Explore Video Dating
                                </Button>
                            </Stack>

                            {/* Trust Signals Row */}
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={{ xs: 1.5, sm: 3 }}
                                sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.85rem" }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <ShieldOutlinedIcon sx={{ fontSize: 18, color: BRAND_COLORS.emerald }} />
                                    <span>Adult 18+ Profiles</span>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <FavoriteRoundedIcon sx={{ fontSize: 18, color: BRAND_COLORS.coralPink }} />
                                    <span>Mutual Likes Only</span>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <LockOutlinedIcon sx={{ fontSize: 18, color: BRAND_COLORS.violet }} />
                                    <span>Encrypted WebRTC Video</span>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* Right Column: High-Fidelity Product Discovery Showcase */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", py: 2 }}>
                            {/* Decorative Multi-Color Ambient Glow */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: { xs: 300, sm: 420 },
                                    height: { xs: 440, sm: 540 },
                                    background: "radial-gradient(circle, rgba(253, 58, 115, 0.35) 0%, rgba(139, 92, 246, 0.22) 50%, transparent 75%)",
                                    filter: "blur(55px)",
                                    zIndex: 0,
                                    pointerEvents: "none",
                                }}
                            />

                            {/* Floating "Video Date Available" Chip (Top Right) */}
                            <Paper
                                elevation={6}
                                sx={{
                                    position: "absolute",
                                    top: { xs: -12, sm: 10 },
                                    right: { xs: -4, sm: -15 },
                                    zIndex: 5,
                                    backgroundColor: "rgba(19, 22, 37, 0.92)",
                                    border: "1px solid rgba(139, 92, 246, 0.4)",
                                    backdropFilter: "blur(16px)",
                                    borderRadius: "18px",
                                    py: 1.2,
                                    px: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                    }}
                                >
                                    <VideocamRoundedIcon sx={{ fontSize: 18 }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.violet, fontWeight: 800, display: "block", lineHeight: 1.1 }}>
                                        LIVE VIDEO READY
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.82rem" }}>
                                        Instant 1-on-1 Vibe Check
                                    </Typography>
                                </Box>
                            </Paper>

                            {/* Main Discovery Card Preview (Real Profile Mockup) */}
                            <Paper
                                elevation={12}
                                className="float-animation"
                                sx={{
                                    width: { xs: 310, sm: 360 },
                                    height: { xs: 490, sm: 540 },
                                    borderRadius: "32px",
                                    overflow: "hidden",
                                    position: "relative",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: "2px solid rgba(255, 255, 255, 0.12)",
                                    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.8)",
                                    zIndex: 2,
                                }}
                            >
                                {/* Profile Background Photo */}
                                <Box
                                    component="img"
                                    src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
                                    alt="Ananya Sharma on Engaze"
                                    loading="eager"
                                    fetchpriority="high"
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />

                                {/* Top Compatibility & Distance Badges */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 18,
                                        left: 18,
                                        right: 18,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        zIndex: 4,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 0.6,
                                            px: 1.5,
                                            py: 0.6,
                                            borderRadius: 9999,
                                            backgroundColor: "rgba(11, 13, 23, 0.75)",
                                            backdropFilter: "blur(12px)",
                                            border: "1px solid rgba(253, 58, 115, 0.4)",
                                            color: "#FFFFFF",
                                            fontSize: "0.78rem",
                                            fontWeight: 800,
                                        }}
                                    >
                                        <BoltRoundedIcon sx={{ fontSize: 16, color: BRAND_COLORS.coralPink }} />
                                        Demo Profile
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            px: 1.4,
                                            py: 0.6,
                                            borderRadius: 9999,
                                            backgroundColor: "rgba(11, 13, 23, 0.75)",
                                            backdropFilter: "blur(12px)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            color: "#FFFFFF",
                                            fontSize: "0.78rem",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <LocationOnRoundedIcon sx={{ fontSize: 14, color: BRAND_COLORS.skyBlue }} />
                                        New Delhi
                                    </Box>
                                </Box>

                                {/* Card Bottom Gradient & Information */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: { xs: 2.2, sm: 2.8 },
                                        pt: 9,
                                        background: "linear-gradient(to top, rgba(11, 13, 23, 0.98) 0%, rgba(11, 13, 23, 0.85) 45%, rgba(11, 13, 23, 0.35) 75%, transparent 100%)",
                                        zIndex: 3,
                                    }}
                                >
                                    {/* Name and Age */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                                            Ananya Sharma, 24
                                        </Typography>
                                    </Box>

                                    {/* Bio snippet */}
                                    <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.82)", mb: 1.5, fontSize: "0.85rem", lineHeight: 1.4 }}>
                                        Architect in South Delhi • Coffee enthusiast, watercolor painter & indie music lover ☕🎨
                                    </Typography>

                                    {/* Interest Chips */}
                                    <Stack direction="row" spacing={0.8} sx={{ mb: 2.5, flexWrap: "wrap", gap: 0.8 }}>
                                        <Chip
                                            label="Art 🎨"
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                                color: "#FFFFFF",
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
                                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                            }}
                                        />
                                        <Chip
                                            label="Coffee ☕"
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                                color: "#FFFFFF",
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
                                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                            }}
                                        />
                                        <Chip
                                            label="Music 🎵"
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                                color: "#FFFFFF",
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
                                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                            }}
                                        />
                                        <Chip
                                            label="Travel ✈️"
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                                color: "#FFFFFF",
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
                                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                            }}
                                        />
                                    </Stack>

                                    {/* Realistic Discovery Action Buttons Dock */}
                                    <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center">
                                        {/* Reset Deck */}
                                        <IconButton
                                            aria-label="Reset deck (Demo)"
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(234, 179, 8, 0.15)",
                                                border: "1.5px solid rgba(234, 179, 8, 0.4)",
                                                color: BRAND_COLORS.amberGold,
                                                "&:hover": { bgcolor: "rgba(234, 179, 8, 0.25)" },
                                            }}
                                        >
                                            <ReplayRoundedIcon sx={{ fontSize: 20 }} />
                                        </IconButton>

                                        {/* Pass / Nope */}
                                        <IconButton
                                            sx={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(239, 68, 68, 0.15)",
                                                border: "2px solid rgba(239, 68, 68, 0.5)",
                                                color: BRAND_COLORS.crimson,
                                                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.2)",
                                                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.25)" },
                                            }}
                                        >
                                            <CloseRoundedIcon sx={{ fontSize: 26 }} />
                                        </IconButton>

                                        {/* Super Like */}
                                        <IconButton
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(56, 189, 248, 0.15)",
                                                border: "1.5px solid rgba(56, 189, 248, 0.45)",
                                                color: BRAND_COLORS.skyBlue,
                                                "&:hover": { bgcolor: "rgba(56, 189, 248, 0.25)" },
                                            }}
                                        >
                                            <StarRoundedIcon sx={{ fontSize: 22 }} />
                                        </IconButton>

                                        {/* Like */}
                                        <IconButton
                                            sx={{
                                                width: 54,
                                                height: 54,
                                                borderRadius: "50%",
                                                background: BRAND_COLORS.primaryGradient,
                                                color: "#FFFFFF",
                                                boxShadow: "0 6px 20px rgba(253, 58, 115, 0.5)",
                                                transition: "transform 0.15s ease",
                                                "&:hover": { transform: "scale(1.08)" },
                                            }}
                                        >
                                            <FavoriteRoundedIcon sx={{ fontSize: 28 }} />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            </Paper>

                            {/* Floating "Mutual Match!" Toast (Bottom Left) */}
                            <Paper
                                elevation={8}
                                sx={{
                                    position: "absolute",
                                    bottom: { xs: -16, sm: 8 },
                                    left: { xs: -6, sm: -20 },
                                    zIndex: 5,
                                    backgroundColor: "rgba(19, 22, 37, 0.94)",
                                    border: "1px solid rgba(16, 185, 129, 0.45)",
                                    backdropFilter: "blur(16px)",
                                    borderRadius: "20px",
                                    py: 1.2,
                                    px: 2.2,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.4,
                                    boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                    }}
                                >
                                    <FavoriteRoundedIcon sx={{ fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.emerald, fontWeight: 800, display: "block", lineHeight: 1.1 }}>
                                        IT'S A MUTUAL MATCH!
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.85rem" }}>
                                        You & Ananya liked each other
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>

                {/* Metrics Bar */}
                <Paper
                    sx={{
                        mt: { xs: 8, md: 12 },
                        p: { xs: 3, sm: 4 },
                        borderRadius: "24px",
                        backgroundColor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                    }}
                >
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={6} md={3} sx={{ textAlign: "center", borderRight: { md: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` } }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: BRAND_COLORS.coralPink, mb: 0.5, letterSpacing: "-0.02em" }}>
                                100%
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 600 }}>
                                Mutual Match Opt-In (Zero Spam)
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3} sx={{ textAlign: "center", borderRight: { md: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` } }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: BRAND_COLORS.violet, mb: 0.5, letterSpacing: "-0.02em" }}>
                                &lt; 60s
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 600 }}>
                                Easy Onboarding & Setup
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3} sx={{ textAlign: "center", borderRight: { md: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` } }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: BRAND_COLORS.emerald, mb: 0.5, letterSpacing: "-0.02em" }}>
                                HD Video
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 600 }}>
                                WebRTC Encrypted Video Dating
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3} sx={{ textAlign: "center" }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: BRAND_COLORS.skyBlue, mb: 0.5, letterSpacing: "-0.02em" }}>
                                Free
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 600 }}>
                                Unlimited Swipes & Mutual Chats
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>

            {/* Core Product Pillars Section */}
            <Box id="features" sx={{ py: { xs: 8, md: 14 }, borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                <Container maxWidth="xl" sx={{ px: { xs: 2.5, sm: 4, md: 6 } }}>
                    <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto", mb: { xs: 6, md: 10 } }}>
                        <Typography
                            variant="overline"
                            sx={{ color: BRAND_COLORS.coralPink, fontWeight: 800, letterSpacing: "0.15em", fontSize: "0.85rem" }}
                        >
                            ENGINEERED FOR CHEMISTRY
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: "2rem", sm: "2.8rem", md: "3.2rem" },
                                letterSpacing: "-0.03em",
                                mt: 1,
                                mb: 2,
                            }}
                        >
                            Everything You Need to Find Real Chemistry.
                        </Typography>
                        <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "1.1rem" }}>
                            Engaze is designed from the ground up to replace superficial swiping with authentic, high-confidence connections.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {/* Pillar 1: Smart Card Discovery */}
                        <Grid item xs={12} md={4}>
                            <Paper
                                sx={{
                                    p: 4.5,
                                    height: "100%",
                                    borderRadius: "28px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-6px)",
                                        borderColor: "rgba(253, 58, 115, 0.4)",
                                        boxShadow: "0 20px 40px rgba(253, 58, 115, 0.15)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: "18px",
                                        bgcolor: "rgba(253, 58, 115, 0.15)",
                                        border: "1px solid rgba(253, 58, 115, 0.3)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: BRAND_COLORS.coralPink,
                                        mb: 3,
                                    }}
                                >
                                    <FavoriteRoundedIcon sx={{ fontSize: 32 }} />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                    Portrait Card Discovery
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7, fontSize: "0.95rem", mb: 3 }}>
                                    Browse edge-to-edge profile portraits with full photo galleries, bio highlights, and smart age & gender filters. Swipe right when you feel a spark, swipe left without awkwardness.
                                </Typography>
                                <Box sx={{ mt: "auto", pt: 2, borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 700 }}>
                                        ✓ Mutual opt-in &bull; Zero cold spam
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Pillar 2: 1-to-1 Video Matchmaking */}
                        <Grid item xs={12} md={4}>
                            <Paper
                                id="video-dating"
                                sx={{
                                    p: 4.5,
                                    height: "100%",
                                    borderRadius: "28px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-6px)",
                                        borderColor: "rgba(139, 92, 246, 0.4)",
                                        boxShadow: "0 20px 40px rgba(139, 92, 246, 0.15)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: "18px",
                                        bgcolor: "rgba(139, 92, 246, 0.15)",
                                        border: "1px solid rgba(139, 92, 246, 0.3)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: BRAND_COLORS.violet,
                                        mb: 3,
                                    }}
                                >
                                    <VideocamRoundedIcon sx={{ fontSize: 32 }} />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                    Encrypted 1-on-1 Video Dating
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7, fontSize: "0.95rem", mb: 3 }}>
                                    Connect face-to-face from your browser through low-latency WebRTC peer connections. Test real-world vibes and chemistry before exchanging personal phone numbers or socials.
                                </Typography>
                                <Box sx={{ mt: "auto", pt: 2, borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.violet, fontWeight: 700 }}>
                                        ✓ Peer-to-peer encrypted &bull; Instant skip control
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Pillar 3: Real-Time Chat */}
                        <Grid item xs={12} md={4}>
                            <Paper
                                sx={{
                                    p: 4.5,
                                    height: "100%",
                                    borderRadius: "28px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-6px)",
                                        borderColor: "rgba(16, 185, 129, 0.4)",
                                        boxShadow: "0 20px 40px rgba(16, 185, 129, 0.15)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: "18px",
                                        bgcolor: "rgba(16, 185, 129, 0.15)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: BRAND_COLORS.emerald,
                                        mb: 3,
                                    }}
                                >
                                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 32 }} />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                    Instant Real-Time Chat
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7, fontSize: "0.95rem", mb: 3 }}>
                                    Break the ice effortlessly with genuine mutual matches. Powered by high-speed WebSockets featuring real-time typing indicators, double-check read receipts, and photo previews.
                                </Typography>
                                <Box sx={{ mt: "auto", pt: 2, borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.emerald, fontWeight: 700 }}>
                                        ✓ Live double-check receipts &bull; Zero delay
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Why Engaze / Comparison Section */}
            <Box id="difference" sx={{ py: { xs: 8, md: 12 }, backgroundColor: "rgba(19, 22, 37, 0.4)", borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 4 } }}>
                    <Box sx={{ textAlign: "center", maxWidth: 680, mx: "auto", mb: { xs: 6, md: 8 } }}>
                        <Typography
                            variant="overline"
                            sx={{ color: BRAND_COLORS.coralPink, fontWeight: 800, letterSpacing: "0.15em", fontSize: "0.85rem" }}
                        >
                            THE ENGAZE DIFFERENCE
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: "1.85rem", sm: "2.6rem" },
                                letterSpacing: "-0.03em",
                                mt: 1,
                                mb: 2,
                            }}
                        >
                            Why Modern Singles Are Switching to Engaze.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {/* Old Apps */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    p: 4.5,
                                    height: "100%",
                                    borderRadius: "24px",
                                    backgroundColor: "rgba(11, 13, 23, 0.8)",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: BRAND_COLORS.crimson, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                                    <CancelRoundedIcon sx={{ fontSize: 24 }} />
                                    Legacy Dating Apps
                                </Typography>

                                <Stack spacing={2.5}>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CancelRoundedIcon sx={{ color: "rgba(239, 68, 68, 0.7)", fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                                            Flooded with ghost profiles, abandoned accounts, and automated bots.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CancelRoundedIcon sx={{ color: "rgba(239, 68, 68, 0.7)", fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                                            Aggressive paywalls just to read incoming messages or see who liked your profile.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CancelRoundedIcon sx={{ color: "rgba(239, 68, 68, 0.7)", fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                                            Forced to share personal phone numbers or Instagram before knowing if you vibe.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CancelRoundedIcon sx={{ color: "rgba(239, 68, 68, 0.7)", fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                                            Unsolicited messages and intrusive cold DMs cluttering your inbox.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Engaze Platform */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    p: 4.5,
                                    height: "100%",
                                    borderRadius: "24px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: "1.5px solid rgba(253, 58, 115, 0.45)",
                                    boxShadow: "0 10px 40px rgba(253, 58, 115, 0.15)",
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: BRAND_COLORS.coralPink, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                                    <CheckCircleRoundedIcon sx={{ fontSize: 24, color: BRAND_COLORS.emerald }} />
                                    Engaze.com
                                </Typography>

                                <Stack spacing={2.5}>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CheckCircleRoundedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600, lineHeight: 1.6 }}>
                                            Authentic 18+ profiles with member discovery and safety reporting.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CheckCircleRoundedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600, lineHeight: 1.6 }}>
                                            100% Free mutual discovery, unlimited likes, and instant real-time chat.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CheckCircleRoundedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600, lineHeight: 1.6 }}>
                                            Encrypted 1-on-1 video dates right in your browser without exposing your number.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                        <CheckCircleRoundedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 20, mt: 0.3 }} />
                                        <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600, lineHeight: 1.6 }}>
                                            Strict mutual opt-in gatekeeper: only mutually matched members can contact you.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Safety & Trust Section */}
            <Box id="safety" sx={{ py: { xs: 8, md: 12 }, borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                <Container maxWidth="xl" sx={{ px: { xs: 2.5, sm: 4, md: 6 } }}>
                    <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto", mb: { xs: 6, md: 8 } }}>
                        <Typography
                            variant="overline"
                            sx={{ color: BRAND_COLORS.emerald, fontWeight: 800, letterSpacing: "0.15em", fontSize: "0.85rem" }}
                        >
                            TRUST & PROTECTION
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: "2rem", sm: "2.8rem" },
                                letterSpacing: "-0.03em",
                                mt: 1,
                                mb: 2,
                            }}
                        >
                            Your Safety and Privacy Come First.
                        </Typography>
                        <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "1.1rem" }}>
                            Dating should be exciting and safe. Engaze integrates multi-layered privacy controls to protect every connection.
                        </Typography>
                    </Box>

                    <Grid container spacing={3.5}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: "100%",
                                    borderRadius: "20px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                }}
                            >
                                <ShieldOutlinedIcon sx={{ color: BRAND_COLORS.skyBlue, fontSize: 36, mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#FFFFFF" }}>
                                    Adult 18+ Profiles
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.6 }}>
                                    Age-verified onboarding and safety reporting ensure you connect with genuine adults across discovery.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: "100%",
                                    borderRadius: "20px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                }}
                            >
                                <ShieldOutlinedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 36, mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#FFFFFF" }}>
                                    Mutual-Like Shield
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.6 }}>
                                    Nobody can message or call you unless both of you swipe right. Unwanted spam is structurally impossible.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: "100%",
                                    borderRadius: "20px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                }}
                            >
                                <LockOutlinedIcon sx={{ color: BRAND_COLORS.violet, fontSize: 36, mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#FFFFFF" }}>
                                    Peer-to-Peer Encryption
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.6 }}>
                                    WebRTC video streams and messaging connections are securely transmitted without exposing personal phone numbers.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: "100%",
                                    borderRadius: "20px",
                                    backgroundColor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                }}
                            >
                                <BoltRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 36, mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#FFFFFF" }}>
                                    One-Tap Protection
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.6 }}>
                                    Instant block and report controls immediately terminate calls and permanently remove disruptive profiles.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Bottom Call to Action Banner */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, px: { xs: 2.5, sm: 4 } }}>
                <Paper
                    sx={{
                        p: { xs: 5, sm: 8 },
                        borderRadius: "36px",
                        textAlign: "center",
                        background: "linear-gradient(135deg, rgba(253, 58, 115, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
                        border: "1.5px solid rgba(253, 58, 115, 0.35)",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: 620,
                            mx: "auto",
                            position: "relative",
                            zIndex: 2,
                        }}
                    >
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: "2.2rem", sm: "3.2rem" },
                                letterSpacing: "-0.03em",
                                mb: 2,
                            }}
                        >
                            Ready to Find Your{" "}
                            <span className="gradient-text">Match?</span>
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: "rgba(255, 255, 255, 0.8)",
                                fontSize: "1.15rem",
                                lineHeight: 1.6,
                                mb: 4.5,
                            }}
                        >
                            Join Engaze today. Create your profile in under 60 seconds and start discovering people who match your wavelength.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardRoundedIcon />}
                            onClick={() => navigate("/auth")}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                py: 2,
                                px: { xs: 4, sm: 6 },
                                fontSize: "1.15rem",
                                fontWeight: 900,
                                borderRadius: 9999,
                                boxShadow: "0 8px 30px rgba(253, 58, 115, 0.5)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 12px 35px rgba(253, 58, 115, 0.7)",
                                },
                            }}
                        >
                            Get Started Free
                        </Button>
                        <Typography variant="caption" sx={{ display: "block", mt: 2, color: BRAND_COLORS.textSecondary }}>
                            No credit card required &bull; 100% free mutual matching & messaging
                        </Typography>
                    </Box>
                </Paper>
            </Container>

            {/* Official Comprehensive Footer */}
            <Box
                component="footer"
                sx={{
                    pt: { xs: 8, md: 10 },
                    pb: 6,
                    borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    backgroundColor: "rgba(11, 13, 23, 0.95)",
                }}
            >
                <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 8 } }}>
                    <Grid container spacing={{ xs: 5, md: 8 }}>
                        {/* Brand Column */}
                        <Grid item xs={12} md={4}>
                            <EngazeLogo size={36} fontSize="1.45rem" sx={{ mb: 2 }} />
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7, maxWidth: 340, mb: 3 }}>
                                Engaze connects genuine singles through intuitive card discovery, instant mutual messaging, and encrypted 1-on-1 video dates.
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: BRAND_COLORS.emerald, fontSize: "0.85rem", fontWeight: 700 }}>
                                <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
                                Adult 18+ Dating Platform
                            </Box>
                        </Grid>

                        {/* Navigation Links */}
                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" sx={{ color: "#FFFFFF", fontWeight: 800, mb: 2.5, letterSpacing: "0.05em" }}>
                                DISCOVERY
                            </Typography>
                            <Stack spacing={1.6}>
                                <Typography
                                    variant="body2"
                                    onClick={() => navigate("/discovery")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    Card Discovery
                                </Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => navigate("/matches")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    Mutual Matches
                                </Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => navigate("/random-video")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    1-on-1 Video Dating
                                </Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => navigate("/auth")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    Sign In / Register
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Safety & Guidelines */}
                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" sx={{ color: "#FFFFFF", fontWeight: 800, mb: 2.5, letterSpacing: "0.05em" }}>
                                TRUST & SAFETY
                            </Typography>
                            <Stack spacing={1.6}>
                                <Typography
                                    variant="body2"
                                    onClick={() => scrollToSection("safety")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    Community Guidelines
                                </Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => scrollToSection("safety")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    Safety Tips
                                </Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => scrollToSection("safety")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    Profile Verification
                                </Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => scrollToSection("safety")}
                                    sx={{ color: BRAND_COLORS.textSecondary, cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}
                                >
                                    Anti-Harassment Policy
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Legal & Policy */}
                        <Grid item xs={12} sm={4} md={3}>
                            <Typography variant="subtitle2" sx={{ color: "#FFFFFF", fontWeight: 800, mb: 2.5, letterSpacing: "0.05em" }}>
                                LEGAL & CONTACT
                            </Typography>
                            <Stack spacing={1.6}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Privacy Policy &bull; Terms of Service
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Cookie Preferences
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Support: <span style={{ color: "#FFFFFF" }}>support@engaze.com</span>
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>

                    {/* Bottom Copyright Divider */}
                    <Box
                        sx={{
                            mt: 8,
                            pt: 4,
                            borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                            textAlign: { xs: "center", sm: "left" },
                        }}
                    >
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textMuted }}>
                            &copy; {new Date().getFullYear()} Engaze.com &bull; All Rights Reserved.
                        </Typography>
                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textMuted }}>
                            Designed for genuine romantic connections and live video chemistry.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
