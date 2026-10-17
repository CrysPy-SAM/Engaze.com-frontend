import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    Fade,
    IconButton,
    Paper,
    Skeleton,
    Snackbar,
    Alert,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import SparklesIcon from "@mui/icons-material/AutoAwesome";

function DiscoveryPage() {
    const navigate = useNavigate();
    const { userData, getDiscovery, sendSwipe, resetDiscoveryFeed } = useContext(AuthContext);

    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [resettingFeed, setResettingFeed] = useState(false);
    const [swiping, setSwiping] = useState(false);
    const [swipeAnimation, setSwipeAnimation] = useState(""); // 'swipe-left-exit' | 'swipe-right-exit' | 'swipe-up-exit'
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState("");

    // Details Modal
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    // Match celebration modal state
    const [matchModalOpen, setMatchModalOpen] = useState(false);
    const [matchedUserData, setMatchedUserData] = useState(null);
    const [matchedMatchData, setMatchedMatchData] = useState(null);

    // Interactive Drag / Swipe Gesture State
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Toast notification state
    const [toastMessage, setToastMessage] = useState("");
    const [toastSeverity, setToastSeverity] = useState("info");
    const [openToast, setOpenToast] = useState(false);

    // Fetch discovery profiles
    const fetchProfiles = useCallback(async (pageNum = 1) => {
        setLoading(true);
        setError("");
        try {
            const data = await getDiscovery(pageNum, 15);
            if (data && data.profiles) {
                if (pageNum === 1) {
                    setProfiles(data.profiles);
                    setCurrentIndex(0);
                } else {
                    setProfiles((prev) => [...prev, ...data.profiles]);
                }
                setHasMore(pageNum < data.totalPages);
                setPage(pageNum);
            }
        } catch (err) {
            console.error("Discovery fetch error:", err);
            setError(err.message || "Failed to load profiles. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [getDiscovery]);

    // Reset passed swipes and reload deck
    const handleResetFeed = useCallback(async () => {
        setResettingFeed(true);
        try {
            const res = await resetDiscoveryFeed();
            setToastMessage(res?.message || "Deck refreshed! You can now explore all profiles again.");
            setToastSeverity("success");
            setOpenToast(true);
            await fetchProfiles(1);
        } catch (err) {
            console.error("Reset feed error:", err);
            setToastMessage(err.message || "Failed to reset discovery feed. Please retry.");
            setToastSeverity("error");
            setOpenToast(true);
        } finally {
            setResettingFeed(false);
        }
    }, [resetDiscoveryFeed, fetchProfiles]);

    useEffect(() => {
        fetchProfiles(1);
    }, [fetchProfiles]);

    const currentProfile = profiles[currentIndex] || null;
    const nextProfile = profiles[currentIndex + 1] || null;

    const photos = currentProfile?.photos && currentProfile.photos.length > 0
        ? currentProfile.photos
        : ["/logo192.png"];

    const nextPhotos = nextProfile?.photos && nextProfile.photos.length > 0
        ? nextProfile.photos
        : ["/logo192.png"];

    // Reset photo index and drag offsets when active profile changes
    useEffect(() => {
        setCurrentPhotoIndex(0);
        setSwipeAnimation("");
        setDragOffset({ x: 0, y: 0 });
        setIsDragging(false);
    }, [currentIndex]);

    // Check if next page of profiles should be preloaded
    useEffect(() => {
        if (profiles.length > 0 && currentIndex >= profiles.length - 3 && hasMore && !loading) {
            fetchProfiles(page + 1);
        }
    }, [currentIndex, profiles.length, hasMore, loading, page, fetchProfiles]);

    // Handle Swipe (Like, Pass, or Super Like)
    const handleSwipeAction = useCallback(async (action) => {
        if (!currentProfile || swiping) return;

        setSwiping(true);
        if (action === "like") {
            setSwipeAnimation("swipe-right-exit");
        } else if (action === "pass") {
            setSwipeAnimation("swipe-left-exit");
        } else if (action === "superlike") {
            setSwipeAnimation("swipe-up-exit");
        }

        try {
            const targetId = currentProfile._id;
            // Map superlike to 'like' on backend API
            const backendAction = action === "superlike" ? "like" : action;
            const res = await sendSwipe(targetId, backendAction);

            // Check if mutual match occurred
            if (res && res.isMatch && res.match) {
                setMatchedUserData(res.match.matchedUser || currentProfile);
                setMatchedMatchData(res.match);
                setMatchModalOpen(true);
            }

            // Advance card after exit animation finishes
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
                setSwipeAnimation("");
                setDragOffset({ x: 0, y: 0 });
                setSwiping(false);
            }, 300);
        } catch (err) {
            console.error("Swipe submission error:", err);
            setToastMessage(err.message || "Failed to submit swipe. Please retry.");
            setToastSeverity("error");
            setOpenToast(true);
            setSwipeAnimation("");
            setDragOffset({ x: 0, y: 0 });
            setSwiping(false);
        }
    }, [currentProfile, swiping, sendSwipe]);

    // Pointer Drag Handlers for True Tinder-Style Swipe Gestures
    const handlePointerDown = useCallback((e) => {
        if (swiping || loading || !currentProfile) return;
        if (e.target.closest("button") || e.target.closest(".photo-nav-zone")) return;
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}
    }, [swiping, loading, currentProfile]);

    const handlePointerMove = useCallback((e) => {
        if (!isDragging || swiping) return;
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        setDragOffset({ x: deltaX, y: deltaY });
    }, [isDragging, swiping]);

    const handlePointerUp = useCallback((e) => {
        if (!isDragging) return;
        setIsDragging(false);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {}

        const thresholdX = 95;
        const thresholdY = -80;

        if (dragOffset.y < thresholdY && Math.abs(dragOffset.x) < 70) {
            // Super Like upward gesture
            setDragOffset({ x: 0, y: 0 });
            handleSwipeAction("superlike");
        } else if (dragOffset.x > thresholdX) {
            // Like rightward gesture
            setDragOffset({ x: 0, y: 0 });
            handleSwipeAction("like");
        } else if (dragOffset.x < -thresholdX) {
            // Pass leftward gesture
            setDragOffset({ x: 0, y: 0 });
            handleSwipeAction("pass");
        } else {
            // Snap back
            setDragOffset({ x: 0, y: 0 });
        }
    }, [isDragging, dragOffset.x, dragOffset.y, handleSwipeAction]);

    // Photo gallery controls
    const handleNextPhoto = useCallback((e) => {
        if (e) e.stopPropagation();
        if (photos.length > 1) {
            setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
        }
    }, [photos.length]);

    const handlePrevPhoto = useCallback((e) => {
        if (e) e.stopPropagation();
        if (photos.length > 1) {
            setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
        }
    }, [photos.length]);

    // Keyboard navigation (Tinder standard: ArrowLeft = Pass, ArrowRight = Like, ArrowUp = Superlike, Space = Photo)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (matchModalOpen || detailsModalOpen || loading || !currentProfile || swiping) return;
            if (e.key === "ArrowLeft") {
                handleSwipeAction("pass");
            } else if (e.key === "ArrowRight") {
                handleSwipeAction("like");
            } else if (e.key === "ArrowUp") {
                handleSwipeAction("superlike");
            } else if (e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                handleNextPhoto();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [matchModalOpen, detailsModalOpen, loading, currentProfile, swiping, handleSwipeAction, handleNextPhoto]);

    // Drag calculations
    const dragDistance = Math.hypot(dragOffset.x, dragOffset.y);
    const dragProgress = Math.min(1, dragDistance / 150);
    const rotateDeg = Math.min(14, Math.max(-14, dragOffset.x * 0.07));

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: BRAND_COLORS.bgDark,
                color: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                overflowX: "hidden",
                userSelect: "none",
            }}
        >
            {/* Unified Brand Navigation */}
            <Navbar />

            {/* Main Discovery Deck Arena */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    px: { xs: 1.5, sm: 2, md: 3 },
                    pt: { xs: 1.5, sm: 2 },
                    pb: { xs: 10, md: 4 },
                    maxWidth: 520,
                    width: "100%",
                    mx: "auto",
                }}
            >
                {/* 1. LOADING SKELETON STATE */}
                {loading && (
                    <Box sx={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Skeleton
                            variant="rounded"
                            width="100%"
                            height="min(560px, calc(100dvh - 200px))"
                            sx={{
                                borderRadius: "28px",
                                bgcolor: "rgba(255, 255, 255, 0.04)",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                            }}
                        />
                        <Stack direction="row" spacing={2.5} sx={{ mt: 3 }}>
                            <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                            <Skeleton variant="circular" width={64} height={64} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                            <Skeleton variant="circular" width={52} height={52} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                            <Skeleton variant="circular" width={64} height={64} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                            <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                        </Stack>
                    </Box>
                )}

                {/* 2. ERROR STATE */}
                {!loading && error && (
                    <Paper
                        elevation={4}
                        sx={{
                            p: 4,
                            textAlign: "center",
                            borderRadius: "28px",
                            backgroundColor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            maxWidth: 400,
                            width: "100%",
                        }}
                    >
                        <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 800 }}>
                            Unable to Load Profiles
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<ReplayRoundedIcon />}
                            onClick={() => fetchProfiles(1)}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: "9999px",
                                px: 4,
                                py: 1.2,
                                fontWeight: 700,
                            }}
                        >
                            Retry
                        </Button>
                    </Paper>
                )}

                {/* 3. TINDER-STYLE DATING DISCOVERY DECK */}
                {!loading && !error && currentProfile && currentIndex < profiles.length && (
                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: 440,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            position: "relative",
                        }}
                    >
                        {/* Interactive Physical 3D Card Container */}
                        <Box
                            sx={{
                                width: "100%",
                                height: { xs: "calc(100dvh - 210px)", sm: 540, md: 580 },
                                minHeight: { xs: 440, sm: 490 },
                                maxHeight: { xs: 580, sm: 620 },
                                position: "relative",
                                perspective: 1000,
                            }}
                        >
                            {/* UNDERLAY CARD (Subtle 3D Stack Effect) */}
                            {nextProfile && (
                                <Card
                                    className="card-stack-underlay"
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        borderRadius: "28px",
                                        overflow: "hidden",
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        border: `1px solid rgba(255, 255, 255, 0.06)`,
                                        zIndex: 1,
                                        transform: isDragging
                                            ? `scale(${0.95 + dragProgress * 0.05}) translateY(${10 - dragProgress * 10}px)`
                                            : "scale(0.95) translateY(10px)",
                                        filter: isDragging
                                            ? `brightness(${0.72 + dragProgress * 0.28})`
                                            : "brightness(0.72)",
                                        transition: isDragging
                                            ? "none"
                                            : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.3s ease",
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={nextPhotos[0]}
                                        alt={nextProfile.name}
                                        onError={(e) => {
                                            e.target.src = "/logo192.png";
                                        }}
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: 0,
                                            background: BRAND_COLORS.cardOverlay,
                                        }}
                                    />
                                </Card>
                            )}

                            {/* ACTIVE TOP PROFILE CARD */}
                            <Card
                                className={swipeAnimation}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "28px",
                                    overflow: "hidden",
                                    position: "relative",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid rgba(255, 255, 255, 0.12)`,
                                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.75)",
                                    touchAction: "pan-y",
                                    cursor: isDragging ? "grabbing" : "grab",
                                    zIndex: 2,
                                    transform: isDragging
                                        ? `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.32}px, 0) rotate(${rotateDeg}deg)`
                                        : undefined,
                                    transition: isDragging
                                        ? "none"
                                        : "transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease",
                                }}
                            >
                                {/* DYNAMIC LIKE STAMP (Emerald) */}
                                {isDragging && dragOffset.x > 25 && (
                                    <Box
                                        className="swipe-stamp-like"
                                        sx={{ opacity: Math.min(1, (dragOffset.x - 25) / 60) }}
                                    >
                                        LIKE
                                    </Box>
                                )}

                                {/* DYNAMIC NOPE STAMP (Crimson) */}
                                {isDragging && dragOffset.x < -25 && (
                                    <Box
                                        className="swipe-stamp-nope"
                                        sx={{ opacity: Math.min(1, (Math.abs(dragOffset.x) - 25) / 60) }}
                                    >
                                        NOPE
                                    </Box>
                                )}

                                {/* DYNAMIC SUPER LIKE STAMP (Cyan) */}
                                {isDragging && dragOffset.y < -35 && Math.abs(dragOffset.x) < 65 && (
                                    <Box
                                        className="swipe-stamp-superlike"
                                        sx={{ opacity: Math.min(1, (Math.abs(dragOffset.y) - 35) / 50) }}
                                    >
                                        SUPER LIKE
                                    </Box>
                                )}

                                {/* Main High-Quality Profile Photo */}
                                <Box
                                    component="img"
                                    src={photos[currentPhotoIndex]}
                                    alt={currentProfile.name}
                                    onError={(e) => {
                                        e.target.src = "/logo192.png";
                                    }}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />

                                {/* Top Segmented Story-Style Photo Progress Bars */}
                                {photos.length > 1 && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 12,
                                            left: 12,
                                            right: 12,
                                            display: "flex",
                                            gap: 0.6,
                                            zIndex: 4,
                                        }}
                                    >
                                        {photos.map((_, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    flex: 1,
                                                    height: 3.5,
                                                    borderRadius: "4px",
                                                    bgcolor:
                                                        idx === currentPhotoIndex
                                                            ? "#FFFFFF"
                                                            : "rgba(255,255,255,0.35)",
                                                    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                                                    transition: "background-color 0.2s ease",
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}

                                {/* Left Interactive Tap Zone (Previous Photo) */}
                                <Box
                                    onClick={handlePrevPhoto}
                                    className="photo-nav-zone"
                                    sx={{
                                        position: "absolute",
                                        top: 25,
                                        left: 0,
                                        width: "45%",
                                        height: "65%",
                                        zIndex: 3,
                                        cursor: photos.length > 1 ? "pointer" : "default",
                                    }}
                                />

                                {/* Right Interactive Tap Zone (Next Photo) */}
                                <Box
                                    onClick={handleNextPhoto}
                                    className="photo-nav-zone"
                                    sx={{
                                        position: "absolute",
                                        top: 25,
                                        right: 0,
                                        width: "45%",
                                        height: "65%",
                                        zIndex: 3,
                                        cursor: photos.length > 1 ? "pointer" : "default",
                                    }}
                                />

                                {/* Arrow Nav Buttons */}
                                {photos.length > 1 && (
                                    <>
                                        <IconButton
                                            onClick={handlePrevPhoto}
                                            size="small"
                                            sx={{
                                                position: "absolute",
                                                left: 10,
                                                top: "42%",
                                                transform: "translateY(-50%)",
                                                bgcolor: "rgba(9, 10, 16, 0.55)",
                                                color: "#fff",
                                                backdropFilter: "blur(10px)",
                                                zIndex: 5,
                                                width: 32,
                                                height: 32,
                                                "&:hover": { bgcolor: "rgba(9, 10, 16, 0.85)" },
                                            }}
                                        >
                                            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16, ml: 0.3 }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={handleNextPhoto}
                                            size="small"
                                            sx={{
                                                position: "absolute",
                                                right: 10,
                                                top: "42%",
                                                transform: "translateY(-50%)",
                                                bgcolor: "rgba(9, 10, 16, 0.55)",
                                                color: "#fff",
                                                backdropFilter: "blur(10px)",
                                                zIndex: 5,
                                                width: 32,
                                                height: 32,
                                                "&:hover": { bgcolor: "rgba(9, 10, 16, 0.85)" },
                                            }}
                                        >
                                            <ArrowForwardIosRoundedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </>
                                )}

                                {/* Profile Bottom Overlay Gradient */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: { xs: 2.2, sm: 2.8 },
                                        pt: 7,
                                        background: BRAND_COLORS.cardOverlay,
                                        color: "#FFFFFF",
                                        zIndex: 4,
                                        pointerEvents: "auto",
                                    }}
                                >
                                    {/* Primary Info Header */}
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 0.8 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography
                                                variant="h4"
                                                noWrap
                                                sx={{
                                                    fontWeight: 900,
                                                    fontSize: { xs: "1.75rem", sm: "2rem" },
                                                    letterSpacing: "-0.025em",
                                                    textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                                                }}
                                            >
                                                {currentProfile.name}
                                                {currentProfile.age ? `, ${currentProfile.age}` : ""}
                                            </Typography>
                                            {currentProfile.isProfileComplete && (
                                                <VerifiedRoundedIcon
                                                    sx={{
                                                        color: BRAND_COLORS.coralPink,
                                                        fontSize: 22,
                                                        filter: "drop-shadow(0 2px 6px rgba(253, 58, 115, 0.5))",
                                                    }}
                                                />
                                            )}
                                        </Stack>

                                        {/* Info Sheet Trigger Button */}
                                        <IconButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDetailsModalOpen(true);
                                            }}
                                            size="small"
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(255, 255, 255, 0.15)",
                                                backdropFilter: "blur(12px)",
                                                color: "#FFFFFF",
                                                border: "1px solid rgba(255, 255, 255, 0.25)",
                                                transition: "all 0.2s ease",
                                                "&:hover": {
                                                    bgcolor: "rgba(255, 255, 255, 0.25)",
                                                    transform: "scale(1.1)",
                                                },
                                            }}
                                        >
                                            <InfoRoundedIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Box>

                                    {/* Location / Meta Tag */}
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <LocationOnRoundedIcon sx={{ fontSize: 16, color: BRAND_COLORS.coralPink }} />
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                                                {currentProfile.city || "Nearby"} • @{currentProfile.username}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    {/* Bio Snippet */}
                                    {currentProfile.bio && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "rgba(255,255,255,0.92)",
                                                lineHeight: 1.4,
                                                mb: 1.2,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                fontSize: "0.88rem",
                                                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                                            }}
                                        >
                                            {currentProfile.bio}
                                        </Typography>
                                    )}

                                    {/* Lifestyle & Interest Badges */}
                                    {currentProfile.interests && currentProfile.interests.length > 0 && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                                            {currentProfile.interests.slice(0, 3).map((tag) => (
                                                <Chip
                                                    key={tag}
                                                    label={tag}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        fontSize: "0.72rem",
                                                        fontWeight: 700,
                                                        bgcolor: "rgba(255, 255, 255, 0.12)",
                                                        backdropFilter: "blur(12px)",
                                                        color: "#FFFFFF",
                                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                                    }}
                                                />
                                            ))}
                                            {currentProfile.interests.length > 3 && (
                                                <Chip
                                                    label={`+${currentProfile.interests.length - 3}`}
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailsModalOpen(true);
                                                    }}
                                                    sx={{
                                                        height: 24,
                                                        fontSize: "0.72rem",
                                                        fontWeight: 700,
                                                        bgcolor: "rgba(253, 58, 115, 0.2)",
                                                        color: "#FF8AA5",
                                                        border: "1px solid rgba(253, 58, 115, 0.4)",
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        </Box>

                        {/* TACTILE 5-BUTTON TINDER ACTION DOCK */}
                        <Stack
                            direction="row"
                            spacing={{ xs: 1.5, sm: 2.2 }}
                            alignItems="center"
                            justifyContent="center"
                            sx={{ mt: { xs: 2, sm: 2.5 } }}
                        >
                            {/* 1. Rewind / Reset Button (Amber) */}
                            <Tooltip title="Rewind / Refresh Deck">
                                <IconButton
                                    aria-label="Refresh deck"
                                    onClick={handleResetFeed}
                                    disabled={resettingFeed || swiping}
                                    className="btn-tactile-action"
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        border: `1.5px solid rgba(245, 158, 11, 0.35)`,
                                        color: BRAND_COLORS.gold,
                                        boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
                                        "&:hover": {
                                            bgcolor: "rgba(245, 158, 11, 0.15)",
                                            borderColor: BRAND_COLORS.gold,
                                            boxShadow: "0 8px 24px rgba(245, 158, 11, 0.3)",
                                        },
                                    }}
                                >
                                    {resettingFeed ? (
                                        <CircularProgress size={20} sx={{ color: BRAND_COLORS.gold }} />
                                    ) : (
                                        <ReplayRoundedIcon sx={{ fontSize: 22 }} />
                                    )}
                                </IconButton>
                            </Tooltip>

                            {/* 2. Pass / Nope Button (Crimson) */}
                            <Tooltip title="Pass (Left Arrow)">
                                <IconButton
                                    aria-label="Pass profile (Arrow Left)"
                                    onClick={() => handleSwipeAction("pass")}
                                    disabled={swiping}
                                    className="btn-tactile-action"
                                    sx={{
                                        width: { xs: 58, sm: 64 },
                                        height: { xs: 58, sm: 64 },
                                        borderRadius: "50%",
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        border: `2px solid rgba(239, 68, 68, 0.45)`,
                                        color: BRAND_COLORS.crimson,
                                        boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
                                        "&:hover": {
                                            bgcolor: "rgba(239, 68, 68, 0.18)",
                                            borderColor: BRAND_COLORS.crimson,
                                            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.35)",
                                        },
                                    }}
                                >
                                    <CloseRoundedIcon sx={{ fontSize: { xs: 30, sm: 34 } }} />
                                </IconButton>
                            </Tooltip>

                            {/* 3. Super Like Button (Cyan / Blue) */}
                            <Tooltip title="Super Like (Up Arrow)">
                                <IconButton
                                    aria-label="Super Like profile (Arrow Up)"
                                    onClick={() => handleSwipeAction("superlike")}
                                    disabled={swiping}
                                    className="btn-tactile-action"
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        border: `1.5px solid rgba(0, 210, 255, 0.4)`,
                                        color: BRAND_COLORS.superLike,
                                        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                                        "&:hover": {
                                            bgcolor: "rgba(0, 210, 255, 0.16)",
                                            borderColor: BRAND_COLORS.superLike,
                                            boxShadow: "0 8px 24px rgba(0, 210, 255, 0.35)",
                                        },
                                    }}
                                >
                                    <StarRoundedIcon sx={{ fontSize: 26 }} />
                                </IconButton>
                            </Tooltip>

                            {/* 4. Like Button (Coral / Pink Vibrant Gradient) */}
                            <Tooltip title="Like (Right Arrow)">
                                <IconButton
                                    aria-label="Like profile (Arrow Right)"
                                    onClick={() => handleSwipeAction("like")}
                                    disabled={swiping}
                                    className="btn-tactile-action"
                                    sx={{
                                        width: { xs: 64, sm: 70 },
                                        height: { xs: 64, sm: 70 },
                                        borderRadius: "50%",
                                        background: BRAND_COLORS.primaryGradient,
                                        color: "#FFFFFF",
                                        boxShadow: "0 10px 32px rgba(253, 58, 115, 0.55)",
                                        "&:hover": {
                                            background: BRAND_COLORS.primaryGradientHover,
                                            boxShadow: "0 14px 40px rgba(253, 58, 115, 0.75)",
                                        },
                                    }}
                                >
                                    <FavoriteRoundedIcon sx={{ fontSize: { xs: 32, sm: 36 } }} />
                                </IconButton>
                            </Tooltip>

                            {/* 5. Instant Video Match Button (Violet) */}
                            <Tooltip title="Instant Random Video Dating">
                                <IconButton
                                    aria-label="Instant Video Call"
                                    onClick={() => navigate("/random-video")}
                                    className="btn-tactile-action"
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        border: `1.5px solid rgba(139, 92, 246, 0.4)`,
                                        color: BRAND_COLORS.violet,
                                        boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
                                        "&:hover": {
                                            bgcolor: "rgba(139, 92, 246, 0.18)",
                                            borderColor: BRAND_COLORS.violet,
                                            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.35)",
                                        },
                                    }}
                                >
                                    <VideocamRoundedIcon sx={{ fontSize: 22 }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        {/* Keyboard shortcut hint */}
                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textMuted, mt: 1.2, fontSize: "0.74rem" }}>
                            <strong>←</strong> Pass &bull; <strong>↑</strong> Super Like &bull; <strong>→</strong> Like &bull; <strong>Space</strong> Next Photo
                        </Typography>
                    </Box>
                )}

                {/* 4. EMPTY FEED STATE */}
                {!loading && !error && (!currentProfile || currentIndex >= profiles.length) && (
                    <Fade in timeout={500}>
                        <Paper
                            elevation={6}
                            sx={{
                                p: { xs: 4, sm: 6 },
                                textAlign: "center",
                                borderRadius: "32px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                maxWidth: 440,
                                width: "100%",
                                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                            }}
                        >
                            <Box
                                className="radar-pulse"
                                sx={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(253, 58, 115, 0.15)",
                                    border: `2px solid ${BRAND_COLORS.coralPink}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mx: "auto",
                                    mb: 3,
                                }}
                            >
                                <WhatshotRoundedIcon sx={{ fontSize: 48, color: BRAND_COLORS.coralPink }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1.2, color: "#fff", letterSpacing: "-0.02em" }}>
                                You're All Caught Up!
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3.5, lineHeight: 1.6 }}>
                                You've reviewed all available profiles for your current preferences. Check back later or refresh your deck to review again!
                            </Typography>
                            <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 300, mx: "auto" }}>
                                <Button
                                    variant="contained"
                                    onClick={handleResetFeed}
                                    disabled={resettingFeed}
                                    startIcon={resettingFeed ? <CircularProgress size={18} color="inherit" /> : <ReplayRoundedIcon />}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        borderRadius: "9999px",
                                        py: 1.3,
                                        fontWeight: 800,
                                        fontSize: "0.95rem",
                                        boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                                    }}
                                >
                                    {resettingFeed ? "Resetting..." : "Refresh Discovery Deck"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate("/random-video")}
                                    startIcon={<VideocamRoundedIcon />}
                                    sx={{
                                        borderRadius: "9999px",
                                        py: 1.2,
                                        color: "#FFFFFF",
                                        borderColor: BRAND_COLORS.surfaceDarkBorder,
                                        "&:hover": {
                                            borderColor: BRAND_COLORS.violet,
                                            bgcolor: "rgba(139, 92, 246, 0.1)",
                                        },
                                    }}
                                >
                                    Try Live Video Match
                                </Button>
                            </Stack>
                        </Paper>
                    </Fade>
                )}
            </Box>

            {/* EXPANDED PROFILE DETAILS MODAL */}
            {currentProfile && (
                <Dialog
                    open={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    fullWidth
                    maxWidth="xs"
                    PaperProps={{
                        sx: {
                            borderRadius: "28px",
                            bgcolor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
                            overflow: "hidden",
                            m: 2,
                        },
                    }}
                >
                    <Box sx={{ position: "relative", height: 380 }}>
                        <Box
                            component="img"
                            src={photos[currentPhotoIndex]}
                            alt={currentProfile.name}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(19, 22, 37, 0.95) 100%)",
                            }}
                        />
                        <IconButton
                            onClick={() => setDetailsModalOpen(false)}
                            sx={{
                                position: "absolute",
                                top: 14,
                                right: 14,
                                bgcolor: "rgba(9, 10, 16, 0.65)",
                                color: "#fff",
                                backdropFilter: "blur(10px)",
                                "&:hover": { bgcolor: "rgba(9, 10, 16, 0.9)" },
                            }}
                        >
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>

                    <DialogContent sx={{ p: 3, pt: 1, bgcolor: BRAND_COLORS.surfaceDark }}>
                        <Box sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="h5" sx={{ fontWeight: 900, color: "#fff" }}>
                                    {currentProfile.name}
                                    {currentProfile.age ? `, ${currentProfile.age}` : ""}
                                </Typography>
                                {currentProfile.isProfileComplete && (
                                    <VerifiedRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 20 }} />
                                )}
                            </Stack>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                {currentProfile.gender ? `${currentProfile.gender} • ` : ""}@{currentProfile.username}
                            </Typography>
                        </Box>

                        {currentProfile.bio && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 800, letterSpacing: "0.5px" }}>
                                    ABOUT ME
                                </Typography>
                                <Typography variant="body1" sx={{ color: "#FFFFFF", mt: 0.5, lineHeight: 1.6 }}>
                                    {currentProfile.bio}
                                </Typography>
                            </Box>
                        )}

                        {currentProfile.interests && currentProfile.interests.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 800, letterSpacing: "0.5px" }}>
                                    PASSIONS & INTERESTS
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                    {currentProfile.interests.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            sx={{
                                                bgcolor: "rgba(253, 58, 115, 0.15)",
                                                border: "1px solid rgba(253, 58, 115, 0.35)",
                                                color: "#fff",
                                                fontWeight: 600,
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    handleSwipeAction("pass");
                                }}
                                sx={{
                                    borderRadius: "9999px",
                                    py: 1.2,
                                    borderColor: "rgba(239, 68, 68, 0.4)",
                                    color: "#EF4444",
                                    fontWeight: 800,
                                    "&:hover": {
                                        borderColor: "#EF4444",
                                        bgcolor: "rgba(239, 68, 68, 0.1)",
                                    },
                                }}
                            >
                                Pass
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    handleSwipeAction("like");
                                }}
                                sx={{
                                    borderRadius: "9999px",
                                    py: 1.2,
                                    background: BRAND_COLORS.primaryGradient,
                                    fontWeight: 800,
                                }}
                            >
                                Like
                            </Button>
                        </Stack>
                    </DialogContent>
                </Dialog>
            )}

            {/* MUTUAL MATCH CELEBRATION MODAL */}
            <Dialog
                open={matchModalOpen}
                onClose={() => setMatchModalOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "32px",
                        background: "linear-gradient(180deg, #1A1226 0%, #0B0D17 100%)",
                        border: `2px solid ${BRAND_COLORS.coralPink}`,
                        boxShadow: "0 25px 70px rgba(253, 58, 115, 0.45)",
                        p: { xs: 2.5, sm: 4 },
                        maxWidth: 420,
                        width: "100%",
                        textAlign: "center",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    {/* Animated Glow Badge */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.8,
                            px: 2,
                            py: 0.6,
                            borderRadius: "9999px",
                            bgcolor: "rgba(253, 58, 115, 0.18)",
                            border: `1px solid ${BRAND_COLORS.coralPink}`,
                            mb: 2.5,
                        }}
                    >
                        <SparklesIcon sx={{ fontSize: 16, color: BRAND_COLORS.coralPink }} />
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: 800, letterSpacing: "1px" }}>
                            IT'S A MUTUAL MATCH!
                        </Typography>
                    </Box>

                    {/* Overlapping Dual Avatars */}
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", my: 2.5 }}>
                        <Avatar
                            src={userData?.photos?.[0]}
                            sx={{
                                width: 92,
                                height: 92,
                                border: `3px solid ${BRAND_COLORS.coralPink}`,
                                boxShadow: "0 10px 25px rgba(253, 58, 115, 0.5)",
                                zIndex: 2,
                                transform: "translateX(12px)",
                            }}
                        >
                            {userData?.name?.charAt(0) || "U"}
                        </Avatar>
                        <Avatar
                            src={matchedUserData?.photos?.[0]}
                            sx={{
                                width: 92,
                                height: 92,
                                border: `3px solid ${BRAND_COLORS.sunsetOrange}`,
                                boxShadow: "0 10px 25px rgba(255, 122, 0, 0.5)",
                                zIndex: 1,
                                transform: "translateX(-12px)",
                            }}
                        >
                            {matchedUserData?.name?.charAt(0) || "M"}
                        </Avatar>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: "#fff", letterSpacing: "-0.02em" }}>
                        You and {matchedUserData?.name || "your match"} liked each other!
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3.5 }}>
                        Start a conversation now or dive into random video meet.
                    </Typography>

                    <Stack spacing={1.5}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<ChatBubbleRoundedIcon />}
                            onClick={() => {
                                setMatchModalOpen(false);
                                if (matchedMatchData?.conversationId) {
                                    navigate(`/chat?conversationId=${matchedMatchData.conversationId}`);
                                } else if (matchedMatchData?._id) {
                                    navigate(`/chat?matchId=${matchedMatchData._id}`);
                                } else {
                                    navigate("/chat");
                                }
                            }}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: "9999px",
                                py: 1.5,
                                fontWeight: 800,
                                fontSize: "1rem",
                                boxShadow: "0 8px 25px rgba(253, 58, 115, 0.5)",
                            }}
                        >
                            Send a Message
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setMatchModalOpen(false)}
                            sx={{
                                borderRadius: "9999px",
                                py: 1.2,
                                color: BRAND_COLORS.textSecondary,
                                borderColor: BRAND_COLORS.surfaceDarkBorder,
                                fontWeight: 700,
                                "&:hover": {
                                    borderColor: "#FFFFFF",
                                    color: "#FFFFFF",
                                },
                            }}
                        >
                            Keep Swiping
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Notification Toast */}
            <Snackbar
                open={openToast}
                autoHideDuration={3500}
                onClose={() => setOpenToast(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                sx={{ bottom: { xs: 80, md: 24 } }}
            >
                <Alert
                    onClose={() => setOpenToast(false)}
                    severity={toastSeverity}
                    variant="filled"
                    sx={{
                        borderRadius: "16px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                        fontWeight: 600,
                    }}
                >
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default withAuth(DiscoveryPage);
