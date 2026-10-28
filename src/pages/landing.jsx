import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    Stack,
    Typography,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
} from "@mui/material";
import EngazeLogo from "../components/EngazeLogo";

// Icons
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LocalCafeRoundedIcon from "@mui/icons-material/LocalCafeRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";

// Hand-drawn SVG Doodles matching Sky Blue Hero styling
const BurstLines = ({ sx = {}, rotation = 0, color = "#0A6CFF" }) => (
    <Box
        component="svg"
        viewBox="0 0 44 44"
        sx={{
            width: 36,
            height: 36,
            transform: `rotate(${rotation}deg)`,
            pointerEvents: "none",
            userSelect: "none",
            ...sx,
        }}
    >
        <path d="M8 8L16 16M22 4V14M36 8L28 16" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Box>
);

const HeartDoodle = ({ sx = {}, rotation = 0, color = "#F06C9B" }) => (
    <Box
        component="svg"
        viewBox="0 0 48 48"
        sx={{
            width: 38,
            height: 38,
            transform: `rotate(${rotation}deg)`,
            pointerEvents: "none",
            userSelect: "none",
            ...sx,
        }}
    >
        <path
            d="M24 37.5C24 37.5 10 27.5 10 18.5C10 13.5 14 9.5 19 9.5C22 9.5 24 11.5 24 11.5C24 11.5 26 9.5 29 9.5C34 9.5 38 13.5 38 18.5C38 27.5 24 37.5 24 37.5Z"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </Box>
);

const SquiggleDoodle = ({ sx = {}, color = "#8FA8FF" }) => (
    <Box
        component="svg"
        viewBox="0 0 64 110"
        sx={{
            width: 40,
            height: 70,
            pointerEvents: "none",
            userSelect: "none",
            ...sx,
        }}
    >
        <path
            d="M18 10C34 25 36 38 22 52C8 66 12 82 28 92C36 97 42 102 38 106"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="4 7"
            fill="none"
        />
    </Box>
);

// Modern Senior-Developer Mobile Auto-Swipe Carousel for Feature Cards
function MobileAutoFeatureCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const touchStartX = React.useRef(0);
    const touchEndX = React.useRef(0);

    const features = [
        {
            num: "01",
            bg: "#24C5F7",
            textColor: "#0D0E15",
            icon: <VideocamRoundedIcon sx={{ fontSize: 24, color: "#FD2E7A" }} />,
            title: "Live 1-on-1 Video Dates",
            desc: "Instant WebRTC video calls right in your browser. Test real-world vibes and authentic chemistry before ever giving out your phone number.",
            badge: "Peer-to-Peer Encrypted",
            badgeBg: "#FFFFFF",
            badgeColor: "#0D0E15",
        },
        {
            num: "02",
            bg: "#FFD233",
            textColor: "#0D0E15",
            icon: <FavoriteRoundedIcon sx={{ fontSize: 24, color: "#FD2E7A" }} />,
            title: "Mutual Match Shield",
            desc: "Zero unsolicited cold messages, zero spam. Conversations and video calls only unlock when both singles mutually like each other.",
            badge: "100% Consent-Driven",
            badgeBg: "#FFFFFF",
            badgeColor: "#0D0E15",
        },
        {
            num: "03",
            bg: "#FF7A29",
            textColor: "#FFFFFF",
            icon: <ChatBubbleRoundedIcon sx={{ fontSize: 22, color: "#FF7A29" }} />,
            title: "High-Speed Live Chat",
            desc: "High-speed WebSocket messaging with instant typing indicators, read receipts, and photo previews. Say goodbye to laggy messaging.",
            badge: "Live WebSockets",
            badgeBg: "#0D0E15",
            badgeColor: "#FFFFFF",
        },
        {
            num: "04",
            bg: "#FFFFFF",
            textColor: "#0D0E15",
            icon: <StarRoundedIcon sx={{ fontSize: 24, color: "#FFD233" }} />,
            title: "Rich Portrait Discovery",
            desc: "Edge-to-edge candidate cards with verified bio highlights, interests, and smart age/gender filters. Swipe with full context instead of tiny thumbnails.",
            badge: "Full-Screen Cards",
            badgeBg: "#FCEEF2",
            badgeColor: "#FD2E7A",
        },
        {
            num: "05",
            bg: "#FD2E7A",
            textColor: "#FFFFFF",
            icon: <ShieldOutlinedIcon sx={{ fontSize: 24, color: "#FD2E7A" }} />,
            title: "18+ Adult Safety",
            desc: "Strict age verification, automated GPS metadata stripping, one-tap instant reporting, and real-time moderation for bad actors.",
            badge: "Safe & Moderated",
            badgeBg: "#0D0E15",
            badgeColor: "#FFFFFF",
        },
    ];

    React.useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % features.length);
        }, 3600);
        return () => clearInterval(interval);
    }, [isPaused, features.length]);

    const handleTouchStart = (e) => {
        setIsPaused(true);
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 45) {
            setActiveIndex((prev) => (prev + 1) % features.length);
        } else if (diff < -45) {
            setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
        }
        setTimeout(() => setIsPaused(false), 2500);
    };

    const current = features[activeIndex];

    return (
        <Box
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            sx={{
                width: "100%",
                maxWidth: 420,
                mx: "auto",
                position: "relative",
            }}
        >
            {/* The Animated Card with Smooth Transition */}
            <Paper
                key={activeIndex}
                elevation={0}
                className="neo-card"
                sx={{
                    backgroundColor: current.bg,
                    color: current.textColor,
                    p: 2.8,
                    borderRadius: "24px",
                    minHeight: 250,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "4px 4px 0px #0D0E15",
                    animation: "cardSlideIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    "@keyframes cardSlideIn": {
                        "0%": { opacity: 0.6, transform: "scale(0.97)" },
                        "100%": { opacity: 1, transform: "scale(1)" },
                    },
                }}
            >
                <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: "1.35rem", opacity: 0.7 }}>
                            {current.num}
                        </Typography>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                backgroundColor: current.num === "04" ? "#FD2E7A" : "#FFFFFF",
                                border: "2px solid #0D0E15",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "2px 2px 0px #0D0E15",
                            }}
                        >
                            {current.icon}
                        </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: "1.28rem", lineHeight: 1.25, mb: 1.2 }}>
                        {current.title}
                    </Typography>
                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            lineHeight: 1.55,
                            color: current.textColor === "#FFFFFF" ? "rgba(255,255,255,0.95)" : "#142B45",
                        }}
                    >
                        {current.desc}
                    </Typography>
                </Box>
                <Box sx={{ pt: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box
                        className="sticker-tag"
                        sx={{
                            backgroundColor: current.badgeBg,
                            color: current.badgeColor,
                            fontSize: "0.78rem",
                            py: 0.45,
                            px: 1.4,
                        }}
                    >
                        {current.badge}
                    </Box>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, opacity: 0.6 }}>
                        {activeIndex + 1} / {features.length}
                    </Typography>
                </Box>
            </Paper>

            {/* Interactive Pill Pagination Controls */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mt: 2.5,
                }}
            >
                {features.map((_, dotIdx) => {
                    const isActive = dotIdx === activeIndex;
                    return (
                        <Box
                            key={dotIdx}
                            onClick={() => setActiveIndex(dotIdx)}
                            sx={{
                                height: 8,
                                width: isActive ? 28 : 8,
                                borderRadius: "9999px",
                                backgroundColor: isActive ? "#0A6CFF" : "rgba(10, 26, 74, 0.2)",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                cursor: "pointer",
                            }}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

// Senior-Developer Segmented Control Switcher for The Difference Section
function MobileDifferenceSwitch() {
    const [selectedTab, setSelectedTab] = useState("engaze");

    return (
        <Box sx={{ width: "100%", maxWidth: 420, mx: "auto" }}>
            <Box
                sx={{
                    display: "flex",
                    p: 0.6,
                    backgroundColor: "rgba(10, 26, 74, 0.06)",
                    borderRadius: "9999px",
                    border: "1.5px solid rgba(10, 26, 74, 0.12)",
                    mb: 2.5,
                }}
            >
                <Button
                    onClick={() => setSelectedTab("traditional")}
                    sx={{
                        flex: 1,
                        py: 0.85,
                        borderRadius: "9999px",
                        fontWeight: 800,
                        fontSize: "0.80rem",
                        textTransform: "none",
                        color: selectedTab === "traditional" ? "#0A1A4A" : "#62748A",
                        backgroundColor: selectedTab === "traditional" ? "#FFFFFF" : "transparent",
                        boxShadow: selectedTab === "traditional" ? "0 4px 12px rgba(10, 26, 74, 0.1)" : "none",
                        transition: "all 0.2s ease",
                    }}
                >
                    Traditional Apps
                </Button>
                <Button
                    onClick={() => setSelectedTab("engaze")}
                    sx={{
                        flex: 1,
                        py: 0.85,
                        borderRadius: "9999px",
                        fontWeight: 800,
                        fontSize: "0.80rem",
                        textTransform: "none",
                        color: selectedTab === "engaze" ? "#FFFFFF" : "#62748A",
                        backgroundColor: selectedTab === "engaze" ? "#0A6CFF" : "transparent",
                        boxShadow: selectedTab === "engaze" ? "0 4px 14px rgba(10, 108, 255, 0.3)" : "none",
                        transition: "all 0.2s ease",
                    }}
                >
                    The Engaze Way ✨
                </Button>
            </Box>

            {selectedTab === "traditional" ? (
                <Paper
                    elevation={0}
                    className="neo-card"
                    sx={{
                        border: "2.5px solid #0D0E15",
                        borderRadius: "24px",
                        p: 2.8,
                        backgroundColor: "#F3F4F6",
                        color: "#0D0E15",
                        boxShadow: "3px 3px 0px #D1D5DB",
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 900, fontSize: "1.2rem", mb: 2, opacity: 0.85 }}>
                        Traditional Dating Apps
                    </Typography>
                    <Stack spacing={1.6}>
                        {[
                            "Endless superficial swiping that leads nowhere",
                            "Awkward text chats that drag on for weeks",
                            "Catfishing & profiles from 5 years ago",
                            "Unwanted cold DMs and spam requests",
                            "Giving out your phone number on day one",
                        ].map((point, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                                <CancelRoundedIcon sx={{ color: "#EF4444", fontSize: 18, mt: 0.2 }} />
                                <Typography sx={{ fontWeight: 600, color: "#4B4E63", fontSize: "0.85rem" }}>
                                    {point}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            ) : (
                <Paper
                    elevation={0}
                    className="neo-card"
                    sx={{
                        border: "3px solid #0D0E15 !important",
                        borderRadius: "24px",
                        p: 2.8,
                        backgroundColor: "#FFFFFF",
                        color: "#0D0E15",
                        boxShadow: "4px 4px 0px #0D0E15 !important",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#FD2E7A" }}>
                            The Engaze Way
                        </Typography>
                        <Box className="sticker-tag" sx={{ backgroundColor: "#FFD233", fontSize: "0.74rem", py: 0.3, px: 1.2 }}>
                            Next-Gen
                        </Box>
                    </Box>
                    <Stack spacing={1.6}>
                        {[
                            "Immediate 1-on-1 video dates right in your browser",
                            "Mutual likes only — zero unsolicited messages",
                            "Encrypted peer-to-peer WebRTC video",
                            "Test the real vibe before exchanging numbers",
                            "Strict 18+ adult community with active moderation",
                        ].map((point, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                                <CheckCircleRoundedIcon sx={{ color: "#10B981", fontSize: 18, mt: 0.2 }} />
                                <Typography sx={{ fontWeight: 700, color: "#0D0E15", fontSize: "0.85rem" }}>
                                    {point}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Box>
    );
}

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const elem = document.getElementById(id);
        if (elem) {
            elem.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#FFFDF9", color: "#0D0E15", overflowX: "hidden" }}>
            {/* ============================================================
                1. FLOATING PILL NAVIGATION BAR
                Clean, rounded pill with 2.5px dark border & pop shadow.
                ============================================================ */}
            <Box
                component="header"
                sx={{
                    position: "sticky",
                    top: { xs: 8, md: 16 },
                    zIndex: 1100,
                    px: { xs: 2, sm: 3, md: 4 },
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        pointerEvents: "auto",
                        width: "100%",
                        maxWidth: 1040,
                        backgroundColor: "#FFFFFF",
                        border: "1.5px solid rgba(10, 26, 74, 0.08)",
                        borderRadius: "9999px",
                        boxShadow: "0 8px 24px rgba(10, 108, 255, 0.10)",
                        px: { xs: 2, sm: 3, md: 3.5 },
                        py: { xs: 0.75, md: 1.0 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Official Brand Logo */}
                    <Box
                        component={Link}
                        to="/"
                        aria-label="Engaze Dating Platform Homepage"
                        sx={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                    >
                        <EngazeLogo size={30} fontSize="1.3rem" textColor="#0A1A4A" />
                    </Box>

                    {/* Desktop Navigation Links */}
                    <Stack
                        component="nav"
                        aria-label="Main Navigation"
                        direction="row"
                        spacing={3}
                        sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}
                    >
                        {[
                            { label: "Features", id: "features" },
                            { label: "Live Video", id: "video-dating" },
                            { label: "Why Engaze", id: "difference" },
                            { label: "Safety & Trust", id: "safety" },
                            { label: "FAQ", id: "faq" },
                        ].map((link) => (
                            <Box
                                key={link.id}
                                component="a"
                                href={`#${link.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    scrollToSection(link.id);
                                }}
                                sx={{
                                    color: "#0A1A4A",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    fontSize: "0.88rem",
                                    letterSpacing: "-0.01em",
                                    transition: "color 0.18s ease",
                                    "&:hover": { color: "#0A6CFF" },
                                }}
                            >
                                {link.label}
                            </Box>
                        ))}
                    </Stack>

                    {/* Right Action CTA Buttons */}
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <Button
                            component={Link}
                            to="/auth"
                            variant="text"
                            sx={{
                                display: { xs: "none", sm: "inline-flex" },
                                color: "#0A1A4A",
                                fontWeight: 800,
                                fontSize: "0.88rem",
                                textTransform: "none",
                                px: { sm: 1.8 },
                                "&:hover": { color: "#0A6CFF", backgroundColor: "transparent" },
                            }}
                        >
                            Sign In
                        </Button>

                        <Button
                            component={Link}
                            to="/auth"
                            className="engaze-btn-primary"
                            variant="contained"
                            sx={{
                                backgroundColor: "#0A6CFF",
                                color: "#FFFFFF",
                                px: { xs: 2.2, sm: 2.8 },
                                py: { xs: 0.75, sm: 0.95 },
                                fontSize: { xs: "0.82rem", sm: "0.90rem" },
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.8,
                                textTransform: "none",
                                borderRadius: "9999px",
                                boxShadow: "0 6px 18px rgba(10, 108, 255, 0.28)",
                                "&:hover": {
                                    backgroundColor: "#0857D0",
                                    transform: "translateY(-1px)",
                                },
                            }}
                        >
                            <span>Get Started</span>
                            <Box
                                component="span"
                                sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#0A6CFF",
                                    fontSize: "0.80rem",
                                    lineHeight: 1,
                                    fontWeight: 900,
                                }}
                            >
                                →
                            </Box>
                        </Button>

                        {/* Mobile Menu Hamburger */}
                        <IconButton
                            aria-label="Open navigation menu"
                            onClick={() => setMobileMenuOpen(true)}
                            sx={{
                                display: { xs: "inline-flex", lg: "none" },
                                color: "#0A1A4A",
                                p: 0.6,
                            }}
                        >
                            <MenuRoundedIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                    </Stack>
                </Paper>
            </Box>

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="top"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: "#FFFFFF",
                        borderBottom: "2px solid rgba(20, 43, 69, 0.1)",
                        p: 3,
                    },
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <EngazeLogo size={32} fontSize="1.35rem" textColor="#142B45" />
                    <IconButton onClick={() => setMobileMenuOpen(false)}>
                        <CloseRoundedIcon sx={{ fontSize: 28, color: "#142B45" }} />
                    </IconButton>
                </Box>
                <List sx={{ mb: 2 }}>
                    {[
                        { label: "Features", id: "features" },
                        { label: "Live Video Dating", id: "video-dating" },
                        { label: "Why Engaze", id: "difference" },
                        { label: "Safety & Trust", id: "safety" },
                        { label: "FAQ", id: "faq" },
                    ].map((item) => (
                        <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => scrollToSection(item.id)}
                                sx={{
                                    borderRadius: 3,
                                    border: "1.5px solid rgba(20, 43, 69, 0.08)",
                                    boxShadow: "0 2px 8px rgba(20, 43, 69, 0.04)",
                                    fontWeight: 800,
                                    py: 1.2,
                                    color: "#142B45",
                                }}
                            >
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 800, color: "#142B45" }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Stack spacing={1.5}>
                    <Button
                        component={Link}
                        to="/auth"
                        variant="contained"
                        className="engaze-btn-primary"
                        sx={{
                            backgroundColor: "#2589D8",
                            color: "#FFFFFF",
                            py: 1.4,
                            fontSize: "1rem",
                            textTransform: "none",
                            borderRadius: "9999px",
                            "&:hover": { backgroundColor: "#1E73B9" },
                        }}
                    >
                        Create Free Account
                    </Button>
                    <Button
                        component={Link}
                        to="/auth"
                        variant="outlined"
                        className="engaze-btn-secondary"
                        sx={{
                            backgroundColor: "#FFFFFF",
                            color: "#142B45",
                            borderColor: "rgba(20, 43, 69, 0.16)",
                            py: 1.2,
                            fontSize: "1rem",
                            textTransform: "none",
                            borderRadius: "9999px",
                            "&:hover": { borderColor: "#142B45", backgroundColor: "#F7FAFE" },
                        }}
                    >
                        Sign In
                    </Button>
                </Stack>
            </Drawer>

            {/* ============================================================
                2. HERO SECTION
                Soft sky blue background with circular profile portraits framing
                the deep navy headline, playful chat bubbles & clear CTAs.
                ============================================================ */}
            <Box
                component="section"
                sx={{
                    position: "relative",
                    background: "linear-gradient(180deg, #E8F4FD 0%, #DCEEFC 100%)",
                    color: "#0A1A4A",
                    pt: { xs: 4, sm: 6, md: 8 },
                    pb: { xs: 5, sm: 6, md: 7 },
                    px: { xs: 2, sm: 3, md: 5 },
                    overflow: "hidden",
                    borderBottom: "1px solid rgba(10, 26, 74, 0.08)",
                    minHeight: { xs: "auto", md: 540, lg: 600 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Soft Organic Background Blobs (#CDE6FA) */}
                <Box
                    sx={{
                        position: "absolute",
                        top: -80,
                        left: -80,
                        width: { xs: 220, md: 380 },
                        height: { xs: 220, md: 380 },
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(205, 230, 250, 0.65) 0%, rgba(232, 244, 253, 0) 70%)",
                        pointerEvents: "none",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: -80,
                        right: -80,
                        width: { xs: 220, md: 380 },
                        height: { xs: 220, md: 380 },
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(205, 230, 250, 0.65) 0%, rgba(232, 244, 253, 0) 70%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Decorative Hand-Drawn Vector Doodles (Desktop/Tablet sm+) */}
                <Box sx={{ display: { xs: "none", md: "block" }, pointerEvents: "none" }}>
                    <BurstLines sx={{ position: "absolute", top: { sm: 15, md: 20 }, left: { sm: 40, md: "6%" } }} rotation={0} />
                    <HeartDoodle sx={{ position: "absolute", top: { sm: 70, md: 80 }, left: { sm: 160, md: "16%" } }} rotation={15} />
                    <SquiggleDoodle sx={{ position: "absolute", top: { md: 180, lg: 200 }, left: { md: "5%", lg: "6%" } }} />
                    <BurstLines sx={{ position: "absolute", top: { sm: 15, md: 20 }, right: { sm: 40, md: "6%" } }} rotation={120} />
                    <BurstLines sx={{ position: "absolute", bottom: { sm: 15, md: 20 }, left: { sm: 80, md: "8%" } }} rotation={60} />
                    <HeartDoodle sx={{ position: "absolute", bottom: { sm: 160, md: 180 }, right: { sm: 110, md: "14%" } }} rotation={-15} />
                    <BurstLines sx={{ position: "absolute", bottom: { sm: 140, md: 160 }, right: { sm: 15, md: "3%" } }} rotation={120} />
                </Box>

                {/* Four Circular Profile Portraits (Framing the Corners on sm+) */}
                {/* 1. Upper-Left Avatar (Smiling Woman on Periwinkle Circle #8FA8FF) */}
                <Box
                    component="img"
                    src={process.env.PUBLIC_URL + "/images/hero-1.png"}
                    alt="Engaze member smiling"
                    className="engaze-hero-portrait engaze-float-1"
                    sx={{
                        position: "absolute",
                        top: { sm: 20, md: 30, lg: 35 },
                        left: { sm: 15, md: "3%", lg: "4%" },
                        width: { sm: 85, md: 110, lg: 130 },
                        height: { sm: 85, md: 110, lg: 130 },
                        borderRadius: "50%",
                        border: "6px solid #FFFFFF",
                        boxShadow: "0 14px 30px rgba(10, 26, 74, 0.12)",
                        backgroundColor: "#8FA8FF",
                        objectFit: "cover",
                        zIndex: 2,
                        display: { xs: "none", sm: "block" },
                    }}
                />

                {/* 2. Upper-Right Avatar (Smiling Man on Purple Circle #A98BFF) */}
                <Box
                    component="img"
                    src={process.env.PUBLIC_URL + "/images/hero-2.png"}
                    alt="Engaze member laughing"
                    className="engaze-hero-portrait engaze-float-2"
                    sx={{
                        position: "absolute",
                        top: { sm: 20, md: 30, lg: 35 },
                        right: { sm: 15, md: "3%", lg: "4%" },
                        width: { sm: 85, md: 110, lg: 130 },
                        height: { sm: 85, md: 110, lg: 130 },
                        borderRadius: "50%",
                        border: "6px solid #FFFFFF",
                        boxShadow: "0 14px 30px rgba(10, 26, 74, 0.12)",
                        backgroundColor: "#A98BFF",
                        objectFit: "cover",
                        zIndex: 2,
                        display: { xs: "none", sm: "block" },
                    }}
                />

                {/* 3. Lower-Left Avatar (Smiling Man on Yellow Circle #FFD84D) */}
                <Box
                    component="img"
                    src={process.env.PUBLIC_URL + "/images/hero-3.png"}
                    alt="Engaze member profile"
                    className="engaze-hero-portrait engaze-float-2"
                    sx={{
                        position: "absolute",
                        bottom: { sm: 20, md: 30, lg: 40 },
                        left: { sm: 15, md: "3%", lg: "4%" },
                        width: { sm: 85, md: 110, lg: 135 },
                        height: { sm: 85, md: 110, lg: 135 },
                        borderRadius: "50%",
                        border: "6px solid #FFFFFF",
                        boxShadow: "0 14px 30px rgba(10, 26, 74, 0.12)",
                        backgroundColor: "#FFD84D",
                        objectFit: "cover",
                        zIndex: 2,
                        display: { xs: "none", sm: "block" },
                    }}
                />

                {/* 4. Lower-Right Avatar (Smiling Woman on Pink Circle #F06C9B) */}
                <Box
                    component="img"
                    src={process.env.PUBLIC_URL + "/images/hero-4.png"}
                    alt="Engaze member connecting"
                    className="engaze-hero-portrait engaze-float-1"
                    sx={{
                        position: "absolute",
                        bottom: { sm: 20, md: 30, lg: 40 },
                        right: { sm: 15, md: "3%", lg: "4%" },
                        width: { sm: 85, md: 110, lg: 135 },
                        height: { sm: 85, md: 110, lg: 135 },
                        borderRadius: "50%",
                        border: "6px solid #FFFFFF",
                        boxShadow: "0 14px 30px rgba(10, 26, 74, 0.12)",
                        backgroundColor: "#F06C9B",
                        objectFit: "cover",
                        zIndex: 2,
                        display: { xs: "none", sm: "block" },
                    }}
                />

                {/* Floating Tilted Conversation Bubbles (Desktop lg+ only) */}
                {/* Bubble 1: White with Navy Text (-12deg) */}
                <Box
                    className="engaze-chat-bubble engaze-float-2"
                    sx={{
                        position: "absolute",
                        top: { lg: 115 },
                        left: { lg: "11%", xl: "12%" },
                        backgroundColor: "#FFFFFF",
                        color: "#0A1A4A",
                        border: "1px solid rgba(10, 108, 255, 0.15)",
                        borderRadius: "16px",
                        transform: "rotate(-12deg)",
                        boxShadow: "0 8px 24px rgba(10, 108, 255, 0.12)",
                        px: 2,
                        py: 0.8,
                        fontSize: "0.82rem",
                        zIndex: 3,
                        display: { xs: "none", lg: "inline-flex" },
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <VideocamRoundedIcon sx={{ fontSize: 17, color: "#0A6CFF" }} />
                    <Typography component="span" sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0A1A4A" }}>
                        Face-to-face vibe check? 📹
                    </Typography>
                </Box>

                {/* Bubble 2: Lavender (#C9B6F5) (+8deg) */}
                <Box
                    className="engaze-chat-bubble engaze-float-1"
                    sx={{
                        position: "absolute",
                        top: { lg: 110 },
                        right: { lg: "11%", xl: "12%" },
                        backgroundColor: "#C9B6F5",
                        color: "#0A1A4A",
                        border: "1px solid rgba(10, 26, 74, 0.10)",
                        borderRadius: "16px",
                        transform: "rotate(8deg)",
                        boxShadow: "0 8px 24px rgba(10, 26, 74, 0.10)",
                        px: 2,
                        py: 0.8,
                        fontSize: "0.82rem",
                        zIndex: 3,
                        display: { xs: "none", lg: "inline-flex" },
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <LocalCafeRoundedIcon sx={{ fontSize: 17, color: "#0A1A4A" }} />
                    <Typography component="span" sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0A1A4A" }}>
                        Coffee & banter this weekend? ☕
                    </Typography>
                </Box>

                {/* Bubble 3: Pink (#F9A8C0) (-10deg) */}
                <Box
                    className="engaze-chat-bubble engaze-float-1"
                    sx={{
                        position: "absolute",
                        bottom: { lg: 125 },
                        left: { lg: "11%", xl: "12%" },
                        backgroundColor: "#F9A8C0",
                        color: "#0A1A4A",
                        border: "1px solid rgba(10, 26, 74, 0.10)",
                        borderRadius: "16px",
                        transform: "rotate(-10deg)",
                        boxShadow: "0 8px 24px rgba(10, 26, 74, 0.10)",
                        px: 2,
                        py: 0.8,
                        fontSize: "0.82rem",
                        zIndex: 3,
                        display: { xs: "none", lg: "inline-flex" },
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Typography component="span" sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0A1A4A" }}>
                        That playlist is a vibe 🎵
                    </Typography>
                </Box>

                {/* Bubble 4: Yellow (#FFE680) (-8deg) */}
                <Box
                    className="engaze-chat-bubble engaze-float-2"
                    sx={{
                        position: "absolute",
                        bottom: { lg: 130 },
                        right: { lg: "11%", xl: "12%" },
                        backgroundColor: "#FFE680",
                        color: "#0A1A4A",
                        border: "1px solid rgba(10, 26, 74, 0.10)",
                        borderRadius: "16px",
                        transform: "rotate(-8deg)",
                        boxShadow: "0 8px 24px rgba(10, 26, 74, 0.10)",
                        px: 2,
                        py: 0.8,
                        fontSize: "0.82rem",
                        zIndex: 3,
                        display: { xs: "none", lg: "inline-flex" },
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <FavoriteRoundedIcon sx={{ fontSize: 15, color: "#FF3366" }} />
                    <Typography component="span" sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0A1A4A" }}>
                        Mutual match unlocked! 💖
                    </Typography>
                </Box>

                {/* Central Hero Content Column */}
                <Container maxWidth={false} sx={{ maxWidth: { xs: "100%", sm: 520, md: 620, lg: 700 }, position: "relative", zIndex: 5, textAlign: "center", py: { xs: 2, sm: 3, md: 4 } }}>
                    {/* Eyebrow Pill */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.8,
                            backgroundColor: "#FFFFFF",
                            color: "#0A6CFF",
                            border: "1.5px solid rgba(10, 108, 255, 0.22)",
                            boxShadow: "0 4px 12px rgba(10, 108, 255, 0.08)",
                            px: 2,
                            py: 0.5,
                            borderRadius: "9999px",
                            fontSize: "0.74rem",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            mb: 2.2,
                        }}
                    >
                        <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: "#0A6CFF" }} />
                        <span>A Modern Dating Platform</span>
                    </Box>

                    {/* Compact Headline (Well-Proportioned) */}
                    <Typography
                        variant="h1"
                        sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: { xs: "1.95rem", sm: "2.6rem", md: "3.2rem", lg: "3.75rem" },
                            fontWeight: 900,
                            lineHeight: { xs: 1.1, md: 1.05 },
                            letterSpacing: "-0.03em",
                            mb: 2,
                        }}
                    >
                        <Box component="span" sx={{ color: "#0A1A4A", display: "block" }}>
                            Real Connections.
                        </Box>
                        <Box component="span" sx={{ color: "#0A6CFF", display: "block" }}>
                            Real Conversations.
                        </Box>
                    </Typography>

                    {/* Sub-headline */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: "#5B6475",
                            fontSize: { xs: "0.90rem", sm: "0.98rem", md: "1.05rem" },
                            lineHeight: 1.55,
                            fontWeight: 500,
                            maxWidth: 540,
                            mx: "auto",
                            mb: 3.5,
                            px: { xs: 1, sm: 0 },
                        }}
                    >
                        Engaze is built for authentic romantic chemistry. Discover compatible singles, chat with mutual likes only, and connect through secure 1-on-1 video dates — before exchanging numbers.
                    </Typography>

                    {/* Call to Action Buttons */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.8}
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Button
                            component={Link}
                            to="/auth"
                            className="engaze-btn-primary"
                            variant="contained"
                            sx={{
                                background: "#0A6CFF !important",
                                backgroundColor: "#0A6CFF !important",
                                color: "#FFFFFF !important",
                                px: { xs: 3.2, sm: 3.8 },
                                py: { xs: 1.15, sm: 1.3 },
                                fontSize: { xs: "0.95rem", sm: "1.0rem" },
                                fontWeight: 800,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1.2,
                                textTransform: "none",
                                width: { xs: "100%", sm: "auto" },
                                maxWidth: { xs: 300, sm: "none" },
                                borderRadius: "9999px",
                                boxShadow: "0 8px 24px rgba(10, 108, 255, 0.32)",
                                "&:hover": {
                                    backgroundColor: "#0857D0 !important",
                                    transform: "translateY(-2px)",
                                },
                            }}
                        >
                            <span>Start Discovering Free</span>
                            <Box
                                component="span"
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    color: "#0A6CFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.85rem",
                                    fontWeight: 900,
                                }}
                            >
                                →
                            </Box>
                        </Button>

                        <Button
                            component="a"
                            href="#video-dating"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection("video-dating");
                            }}
                            className="engaze-btn-secondary"
                            variant="outlined"
                            sx={{
                                backgroundColor: "#FFFFFF",
                                color: "#0A1A4A",
                                borderColor: "rgba(10, 26, 74, 0.16)",
                                px: { xs: 2.8, sm: 3.4 },
                                py: { xs: 1.05, sm: 1.2 },
                                fontSize: { xs: "0.90rem", sm: "0.95rem" },
                                fontWeight: 700,
                                textTransform: "none",
                                width: { xs: "100%", sm: "auto" },
                                maxWidth: { xs: 300, sm: "none" },
                                borderRadius: "9999px",
                                boxShadow: "0 4px 12px rgba(10, 26, 74, 0.05)",
                                "&:hover": {
                                    backgroundColor: "#F7FAFE",
                                    borderColor: "#0A1A4A",
                                    transform: "translateY(-2px)",
                                },
                            }}
                        >
                            How Video Dating Works ↗
                        </Button>
                    </Stack>

                    {/* Trust Indicators Row */}
                    <Stack
                        direction="row"
                        spacing={{ xs: 1.5, sm: 2.5 }}
                        justifyContent="center"
                        alignItems="center"
                        sx={{
                            mt: 3.5,
                            flexWrap: "wrap",
                            gap: { xs: 1, sm: 0 },
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(10, 108, 255, 0.14)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#0A6CFF",
                                }}
                            >
                                <ShieldOutlinedIcon sx={{ fontSize: 15 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.85rem" }, color: "#0A1A4A" }}>
                                100% Verified Profiles
                            </Typography>
                        </Stack>

                        <Box sx={{ width: "1.5px", height: 16, backgroundColor: "rgba(10, 26, 74, 0.16)", display: { xs: "none", sm: "block" } }} />

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(184, 167, 255, 0.28)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#7C5CFC",
                                }}
                            >
                                <FavoriteRoundedIcon sx={{ fontSize: 13 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.85rem" }, color: "#0A1A4A" }}>
                                Mutual Matches Only
                            </Typography>
                        </Stack>

                        <Box sx={{ width: "1.5px", height: 16, backgroundColor: "rgba(10, 26, 74, 0.16)", display: { xs: "none", sm: "block" } }} />

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(255, 143, 156, 0.26)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#E63956",
                                }}
                            >
                                <VideocamRoundedIcon sx={{ fontSize: 15 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.85rem" }, color: "#0A1A4A" }}>
                                Secure 1-on-1 Video
                            </Typography>
                        </Stack>
                    </Stack>

                    {/* Mobile-Only Social Proof Card (Visible on xs only) */}
                    <Box
                        sx={{
                            display: { xs: "inline-flex", sm: "none" },
                            alignItems: "center",
                            gap: 1.2,
                            mt: 3,
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(10, 108, 255, 0.16)",
                            borderRadius: "9999px",
                            px: 2,
                            py: 0.6,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {[1, 2, 3, 4].map((n) => (
                                <Box
                                    key={n}
                                    component="img"
                                    src={process.env.PUBLIC_URL + `/images/hero-${n}.png`}
                                    alt="Engaze member"
                                    sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: "50%",
                                        border: "2px solid #FFFFFF",
                                        ml: n === 1 ? 0 : -0.8,
                                        objectFit: "cover",
                                    }}
                                />
                            ))}
                        </Box>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#0A1A4A" }}>
                            10,000+ singles connected
                        </Typography>
                    </Box>
                </Container>
            </Box>
                         

            {/* ============================================================
                3. SECTION: "A REAL CONNECTION. NOT AN ENDLESS SWIPE TRAP."
                Warm Cream background, asymmetric fanned/stacked feature cards
                with thick 2.5px dark borders and vibrant pop palettes.
                ============================================================ */}
            <Box
                id="features"
                component="section"
                sx={{
                    py: { xs: 6, md: 8.5 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                    backgroundColor: "#FFFDF9",
                    borderBottom: "3px solid #0D0E15",
                }}
            >
                <Container maxWidth="xl">
                    {/* Header Row with Tilted Pill & Editorial Description */}
                    <Grid container spacing={{ xs: 4, md: 8 }} alignItems="flex-end" sx={{ mb: { xs: 3.5, md: 5 } }}>
                        <Grid item xs={12} md={7}>
                            <Box
                                sx={{
                                    display: "inline-block",
                                    backgroundColor: "#FD2E7A",
                                    color: "#FFFFFF",
                                    px: 2,
                                    py: 0.6,
                                    borderRadius: "9999px",
                                    fontSize: "0.78rem",
                                    fontWeight: 900,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    mb: 2.5,
                                }}
                            >
                                WHAT IS ENGAZE
                            </Box>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.8rem" },
                                    fontWeight: 900,
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.035em",
                                    color: "#0D0E15",
                                }}
                            >
                                A real connection.{" "}
                                <Box component="span" sx={{ color: "#FD2E7A", display: "inline" }}>
                                    Not an endless swipe trap.
                                </Box>
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                                <Box
                                    className="sticker-tag"
                                    sx={{
                                        alignSelf: "flex-start",
                                        backgroundColor: "#FFD233",
                                        color: "#0D0E15",
                                        transform: "rotate(-2deg)",
                                    }}
                                >
                                    <span>✨ no paywalled chats or fake bots</span>
                                </Box>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontSize: { xs: "1.05rem", md: "1.15rem" },
                                        color: "#4B4E63",
                                        lineHeight: 1.6,
                                        fontWeight: 600,
                                    }}
                                >
                                    Engaze brings people together for authentic human connection through live face-to-face video, mutual match safety, and seamless real-time conversations.
                                </Typography>
                                <Box>
                                    <Button
                                        component={Link}
                                        to="/auth"
                                        className="pop-pill"
                                        sx={{
                                            backgroundColor: "#0D0E15",
                                            color: "#FFFFFF",
                                            px: 3,
                                            py: 1.1,
                                            fontSize: "0.92rem",
                                            textTransform: "none",
                                            "&:hover": { backgroundColor: "#1C1D2B" },
                                        }}
                                    >
                                        Explore Features →
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Mobile Modern Auto-Advancing Feature Slider (< 900px) */}
                    <Box sx={{ display: { xs: "block", md: "none" }, px: 0.5, py: 1 }}>
                        <MobileAutoFeatureCarousel />
                    </Box>

                    {/* Asymmetric Neo-Pop Feature Cards Grid (Desktop >= 900px) */}
                    <Grid container spacing={3.5} sx={{ display: { xs: "none", md: "flex" } }}>
                        {/* Card 1: Cyan (Live Video) */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Paper
                                elevation={0}
                                className="neo-card"
                                sx={{
                                    backgroundColor: "#24C5F7",
                                    color: "#0D0E15",
                                    p: { xs: 2.5, md: 3 },
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: { xs: "auto", sm: 260, md: 280 },
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", opacity: 0.65 }}>01</Typography>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                backgroundColor: "#FFFFFF",
                                                border: "2px solid #0D0E15",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "2px 2px 0px #0D0E15",
                                            }}
                                        >
                                            <VideocamRoundedIcon sx={{ fontSize: 24, color: "#FD2E7A" }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.2, mb: 1.8 }}>
                                        Live 1-on-1 Video Dates
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.55, color: "#111422" }}>
                                        Instant WebRTC video calls right in your browser. Test real-world vibes and authentic face-to-face chemistry before ever giving out your phone number or socials.
                                    </Typography>
                                </Box>
                                <Box sx={{ pt: 3 }}>
                                    <Box className="sticker-tag" sx={{ backgroundColor: "#FFFFFF", fontSize: "0.82rem", py: 0.5, px: 1.5 }}>
                                        Peer-to-Peer Encrypted
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Card 2: Butter Yellow (Mutual Matches) */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Paper
                                elevation={0}
                                className="neo-card"
                                sx={{
                                    backgroundColor: "#FFD233",
                                    color: "#0D0E15",
                                    p: { xs: 2.5, md: 3 },
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: { xs: "auto", sm: 260, md: 280 },
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", opacity: 0.65 }}>02</Typography>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                backgroundColor: "#FFFFFF",
                                                border: "2px solid #0D0E15",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "2px 2px 0px #0D0E15",
                                            }}
                                        >
                                            <FavoriteRoundedIcon sx={{ fontSize: 24, color: "#FD2E7A" }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.2, mb: 1.8 }}>
                                        Mutual Match Shield
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.55, color: "#111422" }}>
                                        Zero unsolicited cold messages, zero spam. Conversations and video calls only unlock when both singles mutually like each other. Total control over who enters your inbox.
                                    </Typography>
                                </Box>
                                <Box sx={{ pt: 3 }}>
                                    <Box className="sticker-tag" sx={{ backgroundColor: "#FFFFFF", fontSize: "0.82rem", py: 0.5, px: 1.5 }}>
                                        100% Consent-Driven
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Card 3: Tangerine Orange (Real-Time Chat) */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Paper
                                elevation={0}
                                className="neo-card"
                                sx={{
                                    backgroundColor: "#FF7A29",
                                    color: "#FFFFFF",
                                    p: { xs: 2.5, md: 3 },
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: { xs: "auto", sm: 260, md: 280 },
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", opacity: 0.75 }}>03</Typography>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                backgroundColor: "#FFFFFF",
                                                border: "2px solid #0D0E15",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "2px 2px 0px #0D0E15",
                                            }}
                                        >
                                            <ChatBubbleRoundedIcon sx={{ fontSize: 22, color: "#FF7A29" }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.2, mb: 1.8 }}>
                                        High-Speed Live Chat
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.55, color: "#FFFFFF" }}>
                                        High-speed WebSocket messaging with instant typing indicators, read receipts, and photo previews. Say goodbye to laggy messaging that feels like sending emails.
                                    </Typography>
                                </Box>
                                <Box sx={{ pt: 3 }}>
                                    <Box className="sticker-tag" sx={{ backgroundColor: "#0D0E15", color: "#FFFFFF", fontSize: "0.82rem", py: 0.5, px: 1.5 }}>
                                        Live WebSockets
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Card 4: Clean White (Portrait Discovery) */}
                        <Grid item xs={12} sm={6} lg={6}>
                            <Paper
                                elevation={0}
                                className="neo-card"
                                sx={{
                                    backgroundColor: "#FFFFFF",
                                    color: "#0D0E15",
                                    p: { xs: 2.5, md: 3 },
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: { xs: "auto", sm: 240, md: 260 },
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", opacity: 0.5 }}>04</Typography>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                backgroundColor: "#FD2E7A",
                                                border: "2px solid #0D0E15",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "2px 2px 0px #0D0E15",
                                            }}
                                        >
                                            <StarRoundedIcon sx={{ fontSize: 24, color: "#FFD233" }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.2, mb: 1.8 }}>
                                        Rich Portrait Discovery
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.55, color: "#4B4E63" }}>
                                        Edge-to-edge candidate cards with verified bio highlights, interests, and smart age/gender filters. Swipe with full context instead of tiny cropped thumbnails.
                                    </Typography>
                                </Box>
                                <Box sx={{ pt: 3 }}>
                                    <Box className="sticker-tag" sx={{ backgroundColor: "#FCEEF2", color: "#FD2E7A", fontSize: "0.82rem", py: 0.5, px: 1.5 }}>
                                        Full-Screen Cards
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Card 5: Hot Magenta / Pink (Safety & Moderation) */}
                        <Grid item xs={12} sm={12} lg={6}>
                            <Paper
                                elevation={0}
                                className="neo-card"
                                sx={{
                                    backgroundColor: "#FD2E7A",
                                    color: "#FFFFFF",
                                    p: { xs: 2.5, md: 3 },
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: { xs: "auto", sm: 240, md: 260 },
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", opacity: 0.75 }}>05</Typography>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                backgroundColor: "#FFFFFF",
                                                border: "2px solid #0D0E15",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "2px 2px 0px #0D0E15",
                                            }}
                                        >
                                            <ShieldOutlinedIcon sx={{ fontSize: 24, color: "#FD2E7A" }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.2, mb: 1.8 }}>
                                        18+ Adult Safety & Active Moderation
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.55, color: "#FFFFFF" }}>
                                        Strict age verification, automated EXIF/GPS metadata stripping from uploaded photos, one-tap instant reporting, and real-time session termination for bad actors.
                                    </Typography>
                                </Box>
                                <Box sx={{ pt: 3 }}>
                                    <Box className="sticker-tag" sx={{ backgroundColor: "#0D0E15", color: "#FFFFFF", fontSize: "0.82rem", py: 0.5, px: 1.5 }}>
                                        Safe & Moderated
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ============================================================
                4. SECTION: "YOUR AUTHENTIC VIBE IS THE WHOLE POINT"
                Soft Blush Pink background with tactile, playful sticker pills.
                ============================================================ */}
            <Box
                component="section"
                sx={{
                    py: { xs: 6, md: 8.5 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                    backgroundColor: "#FCEEF2",
                    borderBottom: "3px solid #0D0E15",
                    textAlign: "center",
                }}
            >
                <Container maxWidth="md">
                    <Box
                        sx={{
                            display: "inline-block",
                            backgroundColor: "#FD2E7A",
                            color: "#FFFFFF",
                            px: 2,
                            py: 0.6,
                            borderRadius: "9999px",
                            fontSize: "0.78rem",
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            mb: 2.5,
                        }}
                    >
                        GENUINE VIBES
                    </Box>

                    <Typography
                        variant="h2"
                        sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.8rem" },
                            fontWeight: 900,
                            lineHeight: 1.05,
                            letterSpacing: "-0.035em",
                            color: "#0D0E15",
                            mb: 3,
                        }}
                    >
                        Your{" "}
                        <Box component="span" sx={{ color: "#FD2E7A" }}>
                            authentic vibe
                        </Box>{" "}
                        is the whole point.
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            fontSize: { xs: "1.05rem", md: "1.2rem" },
                            color: "#4B4E63",
                            lineHeight: 1.6,
                            fontWeight: 600,
                            maxWidth: 620,
                            mx: "auto",
                            mb: 6,
                        }}
                    >
                        Dating isn't a job interview or a corporate checklist. Whether you're here for deep 2 AM talks, coffee banter, or testing instant face-to-face chemistry — Engaze brings people together who actually click.
                    </Typography>

                    {/* Mobile Continuous Auto-Scrolling Marquee Vibes (< 600px, FRND-style) */}
                    <Box sx={{ display: { xs: "flex", sm: "none" }, flexDirection: "column", gap: 1.5, mx: -2.5, overflow: "hidden" }}>
                        <Box className="engaze-marquee-container">
                            <Box className="engaze-marquee-track" sx={{ gap: 1.2, py: 0.5, pr: 1.2 }}>
                                {[
                                    { label: "1-on-1 Video Dating 📹", bg: "#FFFFFF", color: "#0D0E15", rotate: "-2deg" },
                                    { label: "Coffee & Banter ☕", bg: "#FFD233", color: "#0D0E15", rotate: "2deg" },
                                    { label: "Mutual Likes Only 🔒", bg: "#24C5F7", color: "#0D0E15", rotate: "-1deg" },
                                    { label: "Late Night Talks 🌙", bg: "#FD2E7A", color: "#FFFFFF", rotate: "2deg" },
                                    { label: "Concerts & Gigs 🎸", bg: "#7C5CFC", color: "#FFFFFF", rotate: "-2deg" },
                                    { label: "Foodie Adventures 🍕", bg: "#FF7A29", color: "#FFFFFF", rotate: "1deg" },
                                    { label: "1-on-1 Video Dating 📹", bg: "#FFFFFF", color: "#0D0E15", rotate: "-2deg" },
                                    { label: "Coffee & Banter ☕", bg: "#FFD233", color: "#0D0E15", rotate: "2deg" },
                                    { label: "Mutual Likes Only 🔒", bg: "#24C5F7", color: "#0D0E15", rotate: "-1deg" },
                                    { label: "Late Night Talks 🌙", bg: "#FD2E7A", color: "#FFFFFF", rotate: "2deg" },
                                    { label: "Concerts & Gigs 🎸", bg: "#7C5CFC", color: "#FFFFFF", rotate: "-2deg" },
                                    { label: "Foodie Adventures 🍕", bg: "#FF7A29", color: "#FFFFFF", rotate: "1deg" },
                                ].map((item, idx) => (
                                    <Box
                                        key={idx}
                                        className="sticker-tag"
                                        sx={{
                                            backgroundColor: item.bg,
                                            color: item.color,
                                            transform: `rotate(${item.rotate})`,
                                            fontSize: "0.85rem",
                                            py: 0.7,
                                            px: 1.8,
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.label}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box className="engaze-marquee-container">
                            <Box className="engaze-marquee-track-reverse" sx={{ gap: 1.2, py: 0.5, pr: 1.2 }}>
                                {[
                                    { label: "Weekend Getaways ✈️", bg: "#FFFFFF", color: "#0D0E15", rotate: "-2deg" },
                                    { label: "Zero Ghosting 🚫", bg: "#10B981", color: "#FFFFFF", rotate: "2deg" },
                                    { label: "Film & Cinema 🎬", bg: "#FFD233", color: "#0D0E15", rotate: "-1deg" },
                                    { label: "Dog Lovers 🐕", bg: "#0D0E15", color: "#FFFFFF", rotate: "2deg" },
                                    { label: "+ your unique spark ✨", bg: "#FD2E7A", color: "#FFFFFF", rotate: "-2deg", big: true },
                                    { label: "Weekend Getaways ✈️", bg: "#FFFFFF", color: "#0D0E15", rotate: "-2deg" },
                                    { label: "Zero Ghosting 🚫", bg: "#10B981", color: "#FFFFFF", rotate: "2deg" },
                                    { label: "Film & Cinema 🎬", bg: "#FFD233", color: "#0D0E15", rotate: "-1deg" },
                                    { label: "Dog Lovers 🐕", bg: "#0D0E15", color: "#FFFFFF", rotate: "2deg" },
                                    { label: "+ your unique spark ✨", bg: "#FD2E7A", color: "#FFFFFF", rotate: "-2deg", big: true },
                                ].map((item, idx) => (
                                    <Box
                                        key={idx}
                                        className="sticker-tag"
                                        sx={{
                                            backgroundColor: item.bg,
                                            color: item.color,
                                            transform: `rotate(${item.rotate})`,
                                            fontSize: item.big ? "0.90rem" : "0.85rem",
                                            py: item.big ? 0.8 : 0.7,
                                            px: item.big ? 2.2 : 1.8,
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.label}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {/* Desktop/Tablet Playful Sticker Pills Cluster (>= 600px) */}
                    <Box
                        sx={{
                            display: { xs: "none", sm: "flex" },
                            flexWrap: "wrap",
                            gap: 2,
                            justifyContent: "center",
                            alignItems: "center",
                            maxWidth: 780,
                            mx: "auto",
                        }}
                    >
                        {[
                            { label: "1-on-1 Video Dating 📹", bg: "#FFFFFF", color: "#0D0E15", rotate: "-2deg" },
                            { label: "Coffee & Banter ☕", bg: "#FFD233", color: "#0D0E15", rotate: "3deg" },
                            { label: "Mutual Likes Only 🔒", bg: "#24C5F7", color: "#0D0E15", rotate: "-1deg" },
                            { label: "Late Night Talks 🌙", bg: "#FD2E7A", color: "#FFFFFF", rotate: "2deg" },
                            { label: "Concerts & Gigs 🎸", bg: "#7C5CFC", color: "#FFFFFF", rotate: "-3deg" },
                            { label: "Foodie Adventures 🍕", bg: "#FF7A29", color: "#FFFFFF", rotate: "1deg" },
                            { label: "Weekend Getaways ✈️", bg: "#FFFFFF", color: "#0D0E15", rotate: "-2deg" },
                            { label: "Zero Ghosting 🚫", bg: "#10B981", color: "#FFFFFF", rotate: "2deg" },
                            { label: "Film & Cinema 🎬", bg: "#FFD233", color: "#0D0E15", rotate: "-1deg" },
                            { label: "Dog Lovers 🐕", bg: "#0D0E15", color: "#FFFFFF", rotate: "2deg" },
                            { label: "+ your unique spark ✨", bg: "#FD2E7A", color: "#FFFFFF", rotate: "-2deg", big: true },
                        ].map((item, idx) => (
                            <Box
                                key={idx}
                                className="sticker-tag"
                                sx={{
                                    backgroundColor: item.bg,
                                    color: item.color,
                                    transform: `rotate(${item.rotate})`,
                                    fontSize: item.big ? "1.05rem" : "0.95rem",
                                    py: item.big ? 1.2 : 0.9,
                                    px: item.big ? 3 : 2.2,
                                    cursor: "pointer",
                                }}
                            >
                                {item.label}
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* ============================================================
                5. SECTION: "WHY ENGAZE HITS DIFFERENT"
                Comparison of traditional text-only dating vs Engaze video-first.
                ============================================================ */}
            <Box
                id="difference"
                component="section"
                sx={{
                    py: { xs: 6, md: 8.5 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                    backgroundColor: "#FFFDF9",
                    borderBottom: "3px solid #0D0E15",
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: "center", mb: { xs: 3.5, md: 5 } }}>
                        <Box
                            sx={{
                                display: "inline-block",
                                backgroundColor: "#FFD233",
                                color: "#0D0E15",
                                px: 2,
                                py: 0.6,
                                borderRadius: "9999px",
                                fontSize: "0.78rem",
                                fontWeight: 900,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                mb: 2.5,
                                border: "2px solid #0D0E15",
                                boxShadow: "2px 2px 0px #0D0E15",
                            }}
                        >
                            THE DIFFERENCE
                        </Box>
                        <Typography
                            variant="h2"
                            sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.8rem" },
                                fontWeight: 900,
                                lineHeight: 1.05,
                                letterSpacing: "-0.035em",
                                color: "#0D0E15",
                            }}
                        >
                            Dating platforms evolved.{" "}
                            <Box component="span" sx={{ color: "#FD2E7A" }}>
                                See how we compare.
                            </Box>
                        </Typography>
                    </Box>

                    {/* Mobile Modern Segmented Comparison Switcher (< 900px) */}
                    <Box sx={{ display: { xs: "block", md: "none" }, px: 0.5, py: 1 }}>
                        <MobileDifferenceSwitch />
                    </Box>

                    {/* Side-by-Side Neo-Brutalist Comparison Cards (Desktop >= 900px) */}
                    <Grid container spacing={4} alignItems="stretch" sx={{ display: { xs: "none", md: "flex" } }}>
                        {/* Traditional Apps Card */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    border: "2.5px solid #0D0E15",
                                    borderRadius: "28px",
                                    p: { xs: 2.5, sm: 3.2 },
                                    backgroundColor: "#F3F4F6",
                                    color: "#0D0E15",
                                    height: "100%",
                                    boxShadow: "4px 4px 0px #D1D5DB",
                                }}
                            >
                                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: "1.45rem", mb: 3, opacity: 0.85 }}>
                                    Traditional Dating Apps
                                </Typography>
                                <Stack spacing={2.5}>
                                    {[
                                        "Endless superficial swiping that leads nowhere",
                                        "Awkward text chats that drag on for weeks",
                                        "Catfishing & profiles from 5 years ago",
                                        "Unwanted cold DMs and spam requests",
                                        "Having to give out your personal phone number on day one",
                                    ].map((point, i) => (
                                        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                            <CancelRoundedIcon sx={{ color: "#EF4444", fontSize: 22, mt: 0.2 }} />
                                            <Typography sx={{ fontWeight: 600, color: "#4B4E63", fontSize: "0.98rem" }}>
                                                {point}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* The Engaze Way Card */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                className="neo-card"
                                sx={{
                                    border: "3px solid #0D0E15 !important",
                                    borderRadius: "28px",
                                    p: { xs: 2.5, sm: 3.2 },
                                    backgroundColor: "#FFFFFF",
                                    color: "#0D0E15",
                                    height: "100%",
                                    boxShadow: "6px 6px 0px #0D0E15 !important",
                                }}
                            >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 900, fontSize: "1.5rem", color: "#FD2E7A" }}>
                                        The Engaze Experience
                                    </Typography>
                                    <Box className="sticker-tag" sx={{ backgroundColor: "#FFD233", fontSize: "0.78rem", py: 0.4, px: 1.4 }}>
                                        Next-Gen
                                    </Box>
                                </Box>
                                <Stack spacing={2.5}>
                                    {[
                                        "Immediate 1-on-1 video dates right from your browser",
                                        "Mutual likes only — zero unsolicited messages",
                                        "Encrypted peer-to-peer WebRTC video that is never recorded",
                                        "Complete privacy: test the vibe before giving out your number",
                                        "Strict 18+ adult community with active moderation",
                                    ].map((point, i) => (
                                        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                            <CheckCircleRoundedIcon sx={{ color: "#10B981", fontSize: 22, mt: 0.2 }} />
                                            <Typography sx={{ fontWeight: 700, color: "#0D0E15", fontSize: "0.98rem" }}>
                                                {point}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ============================================================
                6. SECTION: LIVE 1-ON-1 VIDEO DATING DEEP DIVE
                Highlighting browser-based WebRTC dating mechanics.
                ============================================================ */}
            <Box
                id="video-dating"
                component="section"
                sx={{
                    py: { xs: 6, md: 8.5 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                    backgroundColor: "#0D0E15",
                    color: "#FFFFFF",
                    borderBottom: "3px solid #0D0E15",
                }}
            >
                <Container maxWidth="xl">
                    <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    display: "inline-block",
                                    backgroundColor: "#7C5CFC",
                                    color: "#FFFFFF",
                                    px: 2,
                                    py: 0.6,
                                    borderRadius: "9999px",
                                    fontSize: "0.78rem",
                                    fontWeight: 900,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    mb: 2.5,
                                }}
                            >
                                REAL-TIME DATING
                            </Box>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.8rem" },
                                    fontWeight: 900,
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.035em",
                                    color: "#FFFFFF",
                                    mb: 3,
                                }}
                            >
                                Test the chemistry.{" "}
                                <Box component="span" sx={{ color: "#FD2E7A" }}>
                                    Skip the bad dates.
                                </Box>
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontSize: { xs: "1.05rem", md: "1.18rem" },
                                    color: "#A1A4B8",
                                    lineHeight: 1.65,
                                    fontWeight: 500,
                                    mb: 4.5,
                                }}
                            >
                                A five-minute video date reveals what five hundred text messages never could: their laugh, their real smile, and your natural conversational flow. All without ever leaving your web browser.
                            </Typography>

                            <Stack spacing={2.5} sx={{ mb: 5 }}>
                                {[
                                    { title: "No Phone Number Needed", desc: "Initiate direct video calls with mutual matches right inside the Engaze app." },
                                    { title: "Encrypted & Private", desc: "Peer-to-peer WebRTC connections are direct between browsers and are never recorded." },
                                    { title: "One-Tap Call Controls", desc: "Easily toggle camera, mute microphone, or end the session with a single tap." },
                                ].map((feature, i) => (
                                    <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: "50%",
                                                backgroundColor: "#FD2E7A",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#FFFFFF",
                                                flexShrink: 0,
                                                fontWeight: 900,
                                                fontSize: "0.85rem",
                                            }}
                                        >
                                            ✓
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#FFFFFF" }}>
                                                {feature.title}
                                            </Typography>
                                            <Typography sx={{ fontWeight: 500, fontSize: "0.92rem", color: "#9CA3AF" }}>
                                                {feature.desc}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>

                            <Button
                                component={Link}
                                to="/auth"
                                className="pop-pill"
                                variant="contained"
                                sx={{
                                    backgroundColor: "#FD2E7A",
                                    color: "#FFFFFF",
                                    px: 4,
                                    py: 1.6,
                                    fontSize: "1.05rem",
                                    textTransform: "none",
                                    "&:hover": { backgroundColor: "#E61C68" },
                                }}
                            >
                                Try Video Dating Free →
                            </Button>
                        </Grid>

                        {/* Interactive UI Mockup Card */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ position: "relative", p: 2 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        border: "3px solid #2B2D3D",
                                        borderRadius: "32px",
                                        backgroundColor: "#161822",
                                        p: { xs: 3, sm: 4 },
                                        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* Video Stream Preview Frame */}
                                    <Box
                                        sx={{
                                            position: "relative",
                                            width: "100%",
                                            height: { xs: 210, sm: 320 },
                                            borderRadius: "20px",
                                            overflow: "hidden",
                                            border: "2px solid rgba(255, 255, 255, 0.12)",
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                                            alt="Live 1-on-1 Video Call Date"
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />

                                        {/* Status Tag Overlay */}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 14,
                                                left: 14,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 0.8,
                                                backgroundColor: "rgba(13, 14, 21, 0.75)",
                                                backdropFilter: "blur(10px)",
                                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                                borderRadius: "9999px",
                                                px: 1.5,
                                                py: 0.5,
                                                color: "#FFFFFF",
                                                fontSize: "0.78rem",
                                                fontWeight: 800,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#10B981",
                                                    animation: "radarPulse 2s infinite",
                                                }}
                                            />
                                            <span>LIVE VIBE CHECK • 04:18</span>
                                        </Box>

                                        {/* Floating Call Reaction Bubble */}
                                        <Box
                                            className="pop-bubble"
                                            sx={{
                                                position: "absolute",
                                                bottom: 20,
                                                left: 20,
                                                backgroundColor: "#FFD233",
                                                color: "#0D0E15",
                                            }}
                                        >
                                            <span>"You have the best laugh! 😂"</span>
                                        </Box>
                                    </Box>

                                    {/* Action Bar Beneath Stream */}
                                    <Box
                                        sx={{
                                            mt: 3,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#FFFFFF" }}>
                                                Ananya, 24
                                            </Typography>
                                            <Typography sx={{ fontWeight: 500, fontSize: "0.85rem", color: "#9CA3AF" }}>
                                                Mutual Match • Active Now
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1.5}>
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#2B2D3D",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#FFFFFF",
                                                }}
                                            >
                                                <VideocamRoundedIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#EF4444",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#FFFFFF",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ✕
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ============================================================
                7. SECTION: TRUST, SAFETY & COMMUNITY GUIDELINES
                Clear safety pillars, EXIF privacy, and reporting transparency.
                ============================================================ */}
            <Box
                id="safety"
                component="section"
                sx={{
                    py: { xs: 6, md: 8.5 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                    backgroundColor: "#FFFDF9",
                    borderBottom: "3px solid #0D0E15",
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: "center", mb: { xs: 3.5, md: 5 } }}>
                        <Box
                            sx={{
                                display: "inline-block",
                                backgroundColor: "#10B981",
                                color: "#FFFFFF",
                                px: 2,
                                py: 0.6,
                                borderRadius: "9999px",
                                fontSize: "0.78rem",
                                fontWeight: 900,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                mb: 2.5,
                                border: "2px solid #0D0E15",
                                boxShadow: "2px 2px 0px #0D0E15",
                            }}
                        >
                            TRUST & SAFETY
                        </Box>
                        <Typography
                            variant="h2"
                            sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.8rem" },
                                fontWeight: 900,
                                lineHeight: 1.05,
                                letterSpacing: "-0.035em",
                                color: "#0D0E15",
                            }}
                        >
                            Dating should feel exciting.{" "}
                            <Box component="span" sx={{ color: "#FD2E7A" }}>
                                Never unsafe.
                            </Box>
                        </Typography>
                    </Box>

                    {/* Mobile Modern 2x2 Compact Safety Grid (< 600px) */}
                    <Grid container spacing={1.5} sx={{ display: { xs: "flex", sm: "none" }, mb: 1 }}>
                        {[
                            {
                                icon: <VerifiedUserRoundedIcon sx={{ fontSize: 22, color: "#FD2E7A" }} />,
                                title: "18+ Adult Policy",
                                desc: "Strictly for adults aged 18+. Age verification required during onboarding.",
                            },
                            {
                                icon: <LockOutlinedIcon sx={{ fontSize: 22, color: "#7C5CFC" }} />,
                                title: "GPS EXIF Stripped",
                                desc: "Photo GPS metadata automatically stripped to safeguard your location.",
                            },
                            {
                                icon: <ShieldOutlinedIcon sx={{ fontSize: 22, color: "#10B981" }} />,
                                title: "One-Tap Reporting",
                                desc: "Instant reporting and blocking on profiles and in live video calls.",
                            },
                            {
                                icon: <VideocamRoundedIcon sx={{ fontSize: 22, color: "#24C5F7" }} />,
                                title: "Private Video Dates",
                                desc: "Secure browser video streams without giving out your phone number.",
                            },
                        ].map((card, i) => (
                            <Grid item xs={6} key={i}>
                                <Paper
                                    elevation={0}
                                    className="neo-card"
                                    sx={{
                                        p: 1.8,
                                        backgroundColor: "#FFFFFF",
                                        color: "#0D0E15",
                                        borderRadius: "18px",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        boxShadow: "3px 3px 0px #0D0E15",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: "12px",
                                            backgroundColor: "#FCEEF2",
                                            border: "2px solid #0D0E15",
                                            boxShadow: "2px 2px 0px #0D0E15",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 1.2,
                                        }}
                                    >
                                        {card.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "0.88rem", mb: 0.6, lineHeight: 1.25 }}>
                                        {card.title}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.74rem", color: "#4B4E63", lineHeight: 1.4 }}>
                                        {card.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Tablet/Desktop Grid Layout (>= 600px) */}
                    <Grid container spacing={3.5} sx={{ display: { xs: "none", sm: "flex" } }}>
                        {[
                            {
                                icon: <VerifiedUserRoundedIcon sx={{ fontSize: 28, color: "#FD2E7A" }} />,
                                title: "Strict 18+ Adult Policy",
                                desc: "Engaze is exclusively for adults aged 18 and older. Age confirmation is required during onboarding to maintain an authentic, mature dating environment.",
                            },
                            {
                                icon: <LockOutlinedIcon sx={{ fontSize: 28, color: "#7C5CFC" }} />,
                                title: "GPS EXIF Data Stripped",
                                desc: "Every profile photo uploaded to Engaze has its location metadata (GPS coordinates) automatically sanitized to safeguard your real-world whereabouts.",
                            },
                            {
                                icon: <ShieldOutlinedIcon sx={{ fontSize: 28, color: "#10B981" }} />,
                                title: "One-Tap Reporting & Blocking",
                                desc: "If someone makes you uncomfortable, reporting and blocking is available directly on member profiles and in live video calls. Moderation acts immediately.",
                            },
                            {
                                icon: <VideocamRoundedIcon sx={{ fontSize: 28, color: "#24C5F7" }} />,
                                title: "No Phone Number Sharing",
                                desc: "Video dates occur over secure peer-to-peer browser streams. You never have to surrender your personal phone number, home address, or social handles.",
                            },
                        ].map((card, i) => (
                            <Grid item xs={12} sm={6} key={i}>
                                <Paper
                                    elevation={0}
                                    className="neo-card"
                                    sx={{
                                        p: { xs: 2.5, sm: 3.2 },
                                        backgroundColor: "#FFFFFF",
                                        color: "#0D0E15",
                                        height: "100%",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: "16px",
                                            backgroundColor: "#FCEEF2",
                                            border: "2px solid #0D0E15",
                                            boxShadow: "2px 2px 0px #0D0E15",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 2.5,
                                        }}
                                    >
                                        {card.icon}
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 900, fontSize: "1.35rem", mb: 1.5 }}>
                                        {card.title}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#4B4E63", lineHeight: 1.6 }}>
                                        {card.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ============================================================
                8. SECTION: INTERACTIVE FAQ ACCORDION
                Matching Schema.org FAQPage structured data accurately.
                ============================================================ */}
            <Box
                id="faq"
                component="section"
                sx={{
                    py: { xs: 6, md: 8.5 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                    backgroundColor: "#FFFDF9",
                    borderBottom: "3px solid #0D0E15",
                }}
            >
                <Container maxWidth="md">
                    <Box sx={{ textAlign: "center", mb: { xs: 3.5, md: 5 } }}>
                        <Box
                            sx={{
                                display: "inline-block",
                                backgroundColor: "#FD2E7A",
                                color: "#FFFFFF",
                                px: 2,
                                py: 0.6,
                                borderRadius: "9999px",
                                fontSize: "0.78rem",
                                fontWeight: 900,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                mb: 2.5,
                            }}
                        >
                            FREQUENTLY ASKED
                        </Box>
                        <Typography
                            variant="h2"
                            sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.8rem" },
                                fontWeight: 900,
                                lineHeight: 1.05,
                                letterSpacing: "-0.035em",
                                color: "#0D0E15",
                            }}
                        >
                            Everything you need to know.{" "}
                            <Box component="span" sx={{ color: "#FD2E7A" }}>
                                No surprises.
                            </Box>
                        </Typography>
                    </Box>

                    <Stack spacing={2.5}>
                        {[
                            {
                                q: "What is Engaze?",
                                a: "Engaze is an online dating platform designed for genuine singles. It combines portrait card discovery, real-time mutual chat, and browser-based 1-on-1 video dates to help you discover authentic chemistry without having to exchange phone numbers.",
                            },
                            {
                                q: "How does matching work on Engaze?",
                                a: "Matching is strictly based on mutual opt-in. Both you and another member must like each other before either person can start a conversation or request a video call. This prevents cold messages and unsolicited spam.",
                            },
                            {
                                q: "Does Engaze support live video dating?",
                                a: "Yes. Engaze provides encrypted 1-on-1 WebRTC video dating right in your web browser. You can test real-world chemistry and vibe before deciding whether to exchange phone numbers or social media handles. Video and audio streams are peer-to-peer and are never recorded.",
                            },
                            {
                                q: "Is Engaze free to use?",
                                a: "Yes. Account creation, profile discovery, mutual matching, real-time chat, and 1-on-1 video calls on Engaze are completely free.",
                            },
                            {
                                q: "Who is eligible to join Engaze?",
                                a: "Engaze is strictly reserved for adults aged 18 and older. Age confirmation is required during the onboarding and profile creation process.",
                            },
                            {
                                q: "How do I contact customer support or report an issue?",
                                a: "You can reach customer support at support@engaze.date or send general enquiries to contact@engaze.date. In-app reporting and blocking features are also accessible directly on member profiles and during live calls.",
                            },
                        ].map((faq, i) => (
                            <Accordion
                                key={i}
                                elevation={0}
                                sx={{
                                    border: "2.5px solid #0D0E15 !important",
                                    borderRadius: "20px !important",
                                    boxShadow: "3.5px 3.5px 0px #0D0E15 !important",
                                    backgroundColor: "#FFFFFF",
                                    "&:before": { display: "none" },
                                    overflow: "hidden",
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#0D0E15", fontSize: 26 }} />}
                                    sx={{ px: 3, py: 1.5 }}
                                >
                                    <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.05rem", md: "1.15rem" }, color: "#0D0E15" }}>
                                        {faq.q}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                                    <Typography sx={{ fontWeight: 500, fontSize: "0.98rem", color: "#4B4E63", lineHeight: 1.65 }}>
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* ============================================================
                9. HIGH-IMPACT CTA BANNER
                Bold, electric call to action before the footer.
                ============================================================ */}
            <Box
                component="section"
                sx={{
                    py: { xs: 6, md: 8.5 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                    backgroundColor: "#FFFDF9",
                }}
            >
                <Container maxWidth="lg">
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: "#FD2E7A",
                            color: "#FFFFFF",
                            border: "3.5px solid #0D0E15",
                            borderRadius: { xs: "32px", md: "40px" },
                            boxShadow: "7px 7px 0px #0D0E15",
                            p: { xs: 3.5, sm: 5, md: 6 },
                            textAlign: "center",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                display: "inline-block",
                                backgroundColor: "#0D0E15",
                                color: "#FFFFFF",
                                px: 2.2,
                                py: 0.7,
                                borderRadius: "9999px",
                                fontSize: "0.82rem",
                                fontWeight: 900,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                mb: 3,
                            }}
                        >
                            START TODAY
                        </Box>

                        <Typography
                            variant="h2"
                            sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: { xs: "1.85rem", sm: "2.4rem", md: "2.9rem" },
                                fontWeight: 900,
                                lineHeight: 1.05,
                                letterSpacing: "-0.04em",
                                mb: 3,
                            }}
                        >
                            Ready to feel the spark?
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                                fontWeight: 600,
                                maxWidth: 580,
                                mx: "auto",
                                mb: 5,
                                lineHeight: 1.5,
                            }}
                        >
                            Join thousands of genuine singles on Engaze. Mutual likes only, instant browser video vibe checks, and zero paywalls.
                        </Typography>

                        <Button
                            component={Link}
                            to="/auth"
                            className="pop-pill"
                            variant="contained"
                            sx={{
                                backgroundColor: "#FFFFFF",
                                color: "#FD2E7A",
                                px: { xs: 4, sm: 5.5 },
                                py: { xs: 1.8, sm: 2.2 },
                                fontSize: { xs: "1.1rem", sm: "1.22rem" },
                                textTransform: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1.5,
                                "&:hover": { backgroundColor: "#FFF8F0" },
                            }}
                        >
                            <span>Create Free Account</span>
                            <Box
                                component="span"
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    backgroundColor: "#FFD233",
                                    color: "#0D0E15",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1rem",
                                    fontWeight: 900,
                                }}
                            >
                                →
                            </Box>
                        </Button>
                    </Paper>
                </Container>
            </Box>

            {/* ============================================================
                10. FOOTER
                Clean neo-pop footer with legal links, contact, and copyright.
                ============================================================ */}
            <Box
                component="footer"
                sx={{
                    backgroundColor: "#0D0E15",
                    color: "#FFFFFF",
                    borderTop: "3.5px solid #0D0E15",
                    pt: { xs: 8, md: 10 },
                    pb: { xs: 6, md: 8 },
                    px: { xs: 2.5, sm: 4, md: 6 },
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="space-between" alignItems="flex-start" sx={{ mb: 6 }}>
                        <Grid item xs={12} md={5}>
                            <Box sx={{ mb: 2 }}>
                                <EngazeLogo size={36} fontSize="1.5rem" textColor="#FFFFFF" />
                            </Box>
                            <Typography sx={{ color: "#9CA3AF", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 380, mb: 3 }}>
                                Engaze is an online dating and live video connections platform connecting genuine singles through mutual match discovery and encrypted 1-on-1 browser video dates.
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <Box
                                    component="a"
                                    href="mailto:support@engaze.date"
                                    sx={{
                                        color: "#FD2E7A",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.8,
                                        "&:hover": { textDecoration: "underline" },
                                    }}
                                >
                                    <SupportAgentRoundedIcon sx={{ fontSize: 18 }} />
                                    support@engaze.date
                                </Box>
                                <Box
                                    component="a"
                                    href="mailto:contact@engaze.date"
                                    sx={{
                                        color: "#FFFFFF",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.8,
                                        "&:hover": { textDecoration: "underline" },
                                    }}
                                >
                                    <EmailRoundedIcon sx={{ fontSize: 18 }} />
                                    contact@engaze.date
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid item xs={6} sm={4} md={2}>
                            <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", color: "#FFFFFF", mb: 2 }}>
                                PRODUCT
                            </Typography>
                            <Stack spacing={1.4}>
                                <Box component="a" href="#features" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }} sx={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "#FFFFFF" } }}>Features</Box>
                                <Box component="a" href="#video-dating" onClick={(e) => { e.preventDefault(); scrollToSection("video-dating"); }} sx={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "#FFFFFF" } }}>Live Video</Box>
                                <Box component="a" href="#difference" onClick={(e) => { e.preventDefault(); scrollToSection("difference"); }} sx={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "#FFFFFF" } }}>Why Engaze</Box>
                                <Box component="a" href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection("faq"); }} sx={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "#FFFFFF" } }}>FAQ</Box>
                            </Stack>
                        </Grid>

                        <Grid item xs={6} sm={4} md={2}>
                            <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", color: "#FFFFFF", mb: 2 }}>
                                TRUST & SAFETY
                            </Typography>
                            <Stack spacing={1.4}>
                                <Box component={Link} to="/safety" sx={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "#FFFFFF" } }}>Safety Tips</Box>
                                <Box component={Link} to="/terms" sx={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "#FFFFFF" } }}>Terms of Service</Box>
                                <Box component={Link} to="/privacy" sx={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "#FFFFFF" } }}>Privacy Policy</Box>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={4} md={3}>
                            <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", color: "#FFFFFF", mb: 2 }}>
                                JOIN THE COMMUNITY
                            </Typography>
                            <Typography sx={{ color: "#9CA3AF", fontSize: "0.88rem", mb: 2.5, lineHeight: 1.5 }}>
                                Free account setup. Zero credit card required. Connect authentically today.
                            </Typography>
                            <Button
                                component={Link}
                                to="/auth"
                                className="pop-pill"
                                variant="contained"
                                sx={{
                                    backgroundColor: "#FD2E7A",
                                    color: "#FFFFFF",
                                    px: 2.8,
                                    py: 1,
                                    fontSize: "0.9rem",
                                    textTransform: "none",
                                    "&:hover": { backgroundColor: "#E61C68" },
                                }}
                            >
                                Get Started Free →
                            </Button>
                        </Grid>
                    </Grid>

                    <Box
                        sx={{
                            pt: 4,
                            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                            color: "#6B7280",
                            fontSize: "0.85rem",
                        }}
                    >
                        <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.85rem" }}>
                            © {new Date().getFullYear()} Engaze. All rights reserved. Strictly 18+ adult dating service.
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Box component={Link} to="/privacy" sx={{ color: "#6B7280", textDecoration: "none", "&:hover": { color: "#FFFFFF" } }}>Privacy</Box>
                            <Box component={Link} to="/terms" sx={{ color: "#6B7280", textDecoration: "none", "&:hover": { color: "#FFFFFF" } }}>Terms</Box>
                            <Box component={Link} to="/safety" sx={{ color: "#6B7280", textDecoration: "none", "&:hover": { color: "#FFFFFF" } }}>Safety</Box>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}