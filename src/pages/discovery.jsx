import React, { useContext, useEffect, useState, useCallback } from "react";
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
    Container,
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
import FavoriteIcon from "@mui/icons-material/Favorite";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RefreshIcon from "@mui/icons-material/Refresh";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ChatIcon from "@mui/icons-material/Chat";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import TuneIcon from "@mui/icons-material/Tune";

function DiscoveryPage() {
    const navigate = useNavigate();
    const { userData, getDiscovery, sendSwipe } = useContext(AuthContext);

    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [swiping, setSwiping] = useState(false);
    const [swipeAnimation, setSwipeAnimation] = useState(""); // 'swipe-left-exit' | 'swipe-right-exit'
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState("");
    const [showFullBio, setShowFullBio] = useState(false);

    // Match celebration modal state
    const [matchModalOpen, setMatchModalOpen] = useState(false);
    const [matchedUserData, setMatchedUserData] = useState(null);

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

    useEffect(() => {
        fetchProfiles(1);
    }, [fetchProfiles]);

    const currentProfile = profiles[currentIndex] || null;
    const photos = currentProfile?.photos && currentProfile.photos.length > 0
        ? currentProfile.photos
        : ["/logo192.png"];

    // Reset photo index and bio toggle when active profile changes
    useEffect(() => {
        setCurrentPhotoIndex(0);
        setShowFullBio(false);
        setSwipeAnimation("");
    }, [currentIndex]);

    // Check if next page of profiles should be preloaded
    useEffect(() => {
        if (profiles.length > 0 && currentIndex >= profiles.length - 3 && hasMore && !loading) {
            fetchProfiles(page + 1);
        }
    }, [currentIndex, profiles.length, hasMore, loading, page, fetchProfiles]);

    // Handle Swipe (Like or Pass)
    const handleSwipeAction = useCallback(async (action) => {
        if (!currentProfile || swiping) return;

        setSwiping(true);
        setSwipeAnimation(action === "like" ? "swipe-right-exit" : "swipe-left-exit");

        try {
            const targetId = currentProfile._id;
            const res = await sendSwipe(targetId, action);

            // Check if mutual match occurred
            if (res && res.isMatch && res.match) {
                setMatchedUserData(res.match.matchedUser || currentProfile);
                setMatchModalOpen(true);
            }

            // Advance card after exit animation finishes
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
                setSwipeAnimation("");
                setSwiping(false);
            }, 300);
        } catch (err) {
            console.error("Swipe submission error:", err);
            setToastMessage(err.message || "Failed to submit swipe. Please retry.");
            setToastSeverity("error");
            setOpenToast(true);
            setSwipeAnimation("");
            setSwiping(false);
        }
    }, [currentProfile, swiping, sendSwipe]);

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

    // Keyboard navigation (Tinder standard: ArrowLeft = Pass, ArrowRight = Like, Space/Up = Next Photo)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (matchModalOpen || loading || !currentProfile || swiping) return;
            if (e.key === "ArrowLeft") {
                handleSwipeAction("pass");
            } else if (e.key === "ArrowRight") {
                handleSwipeAction("like");
            } else if (e.key === " " || e.key === "ArrowUp") {
                e.preventDefault();
                handleNextPhoto();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [matchModalOpen, loading, currentProfile, swiping, handleSwipeAction, handleNextPhoto]);

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, pb: { xs: 10, md: 6 } }}>
            {/* Unified Brand Navigation */}
            <Navbar />

            <Container maxWidth="sm" sx={{ mt: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 3 } }}>
                {/* 1. LOADING SKELETON */}
                {loading && profiles.length === 0 && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Skeleton
                            variant="rounded"
                            width="100%"
                            height={580}
                            sx={{ borderRadius: "28px", backgroundColor: "rgba(255,255,255,0.05)" }}
                        />
                        <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
                            <Skeleton variant="circular" width={68} height={68} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                            <Skeleton variant="circular" width={52} height={52} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                            <Skeleton variant="circular" width={76} height={76} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
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
                            borderRadius: "24px",
                            mt: 4,
                            backgroundColor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        }}
                    >
                        <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700 }}>
                            Unable to Load Profiles
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={() => fetchProfiles(1)}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: 9999,
                                px: 4,
                            }}
                        >
                            Retry
                        </Button>
                    </Paper>
                )}

                {/* 3. DATING DISCOVERY PROFILE CARD */}
                {!loading && !error && currentProfile && currentIndex < profiles.length && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                        <Card
                            className={swipeAnimation}
                            sx={{
                                width: "100%",
                                height: { xs: 540, sm: 600 },
                                borderRadius: "28px",
                                overflow: "hidden",
                                position: "relative",
                                bgcolor: BRAND_COLORS.surfaceDark,
                                border: `1px solid rgba(255, 255, 255, 0.1)`,
                                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                                userSelect: "none",
                                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                            }}
                        >
                            {/* Main Portrait Photo */}
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
                                }}
                            />

                            {/* Top Segmented Story-Style Photo Progress Bars */}
                            {photos.length > 1 && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 14,
                                        left: 14,
                                        right: 14,
                                        display: "flex",
                                        gap: 0.8,
                                        zIndex: 3,
                                    }}
                                >
                                    {photos.map((_, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                flex: 1,
                                                height: 4,
                                                borderRadius: 2,
                                                bgcolor: idx === currentPhotoIndex ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                                                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                                                transition: "background-color 0.2s ease",
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Left / Right Interactive Tap Zones for Photo Navigation */}
                            <Box
                                onClick={handlePrevPhoto}
                                sx={{
                                    position: "absolute",
                                    top: 30,
                                    left: 0,
                                    width: "40%",
                                    height: "65%",
                                    zIndex: 2,
                                    cursor: photos.length > 1 ? "pointer" : "default",
                                }}
                            />
                            <Box
                                onClick={handleNextPhoto}
                                sx={{
                                    position: "absolute",
                                    top: 30,
                                    right: 0,
                                    width: "40%",
                                    height: "65%",
                                    zIndex: 2,
                                    cursor: photos.length > 1 ? "pointer" : "default",
                                }}
                            />

                            {/* Arrow Buttons for Precise Navigation */}
                            {photos.length > 1 && (
                                <>
                                    <IconButton
                                        onClick={handlePrevPhoto}
                                        size="small"
                                        sx={{
                                            position: "absolute",
                                            left: 12,
                                            top: "40%",
                                            transform: "translateY(-50%)",
                                            bgcolor: "rgba(11, 13, 23, 0.6)",
                                            color: "#fff",
                                            backdropFilter: "blur(8px)",
                                            zIndex: 4,
                                            "&:hover": { bgcolor: "rgba(11, 13, 23, 0.9)" },
                                        }}
                                    >
                                        <ArrowBackIosNewIcon fontSize="small" sx={{ ml: 0.5 }} />
                                    </IconButton>
                                    <IconButton
                                        onClick={handleNextPhoto}
                                        size="small"
                                        sx={{
                                            position: "absolute",
                                            right: 12,
                                            top: "40%",
                                            transform: "translateY(-50%)",
                                            bgcolor: "rgba(11, 13, 23, 0.6)",
                                            color: "#fff",
                                            backdropFilter: "blur(8px)",
                                            zIndex: 4,
                                            "&:hover": { bgcolor: "rgba(11, 13, 23, 0.9)" },
                                        }}
                                    >
                                        <ArrowForwardIosIcon fontSize="small" />
                                    </IconButton>
                                </>
                            )}

                            {/* Profile Info Overlay with Dark Gradient */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    p: { xs: 2.5, sm: 3 },
                                    pt: 6,
                                    background: BRAND_COLORS.cardOverlay,
                                    color: "#FFFFFF",
                                    zIndex: 3,
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: { xs: "1.75rem", sm: "2.1rem" },
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        {currentProfile.name}
                                        {currentProfile.age ? `, ${currentProfile.age}` : ""}
                                    </Typography>
                                    {currentProfile.isProfileComplete && (
                                        <VerifiedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 24 }} />
                                    )}
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", textTransform: "capitalize", fontWeight: 500 }}>
                                        {currentProfile.gender || "Member"} • @{currentProfile.username}
                                    </Typography>
                                </Stack>

                                {/* Bio */}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: "rgba(255,255,255,0.9)",
                                        lineHeight: 1.45,
                                        mb: 1.5,
                                        display: "-webkit-box",
                                        WebkitLineClamp: showFullBio ? "unset" : 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {currentProfile.bio || "Looking for meaningful connections on Engaze."}
                                </Typography>

                                {/* Interest Badges */}
                                {currentProfile.interests && currentProfile.interests.length > 0 && (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                        {currentProfile.interests.slice(0, showFullBio ? undefined : 4).map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                                sx={{
                                                    bgcolor: "rgba(253, 58, 115, 0.15)",
                                                    color: "#fff",
                                                    border: "1px solid rgba(253, 58, 115, 0.4)",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                }}
                                            />
                                        ))}
                                        {currentProfile.interests.length > 4 && !showFullBio && (
                                            <Chip
                                                label={`+${currentProfile.interests.length - 4}`}
                                                size="small"
                                                onClick={() => setShowFullBio(true)}
                                                sx={{
                                                    bgcolor: "rgba(255,255,255,0.1)",
                                                    color: "rgba(255,255,255,0.8)",
                                                    fontSize: "0.75rem",
                                                }}
                                            />
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Card>

                        {/* TACTILE LIKE & PASS ACTION BAR */}
                        <Stack
                            direction="row"
                            spacing={3}
                            alignItems="center"
                            justifyContent="center"
                            sx={{ mt: 3, mb: 1 }}
                        >
                            {/* Pass Button */}
                            <Tooltip title="Pass (Left Arrow)">
                                <IconButton
                                    aria-label="Pass profile (Arrow Left)"
                                    onClick={() => handleSwipeAction("pass")}
                                    disabled={swiping}
                                    sx={{
                                        width: 68,
                                        height: 68,
                                        bgcolor: BRAND_COLORS.surfaceDarkElevated,
                                        border: `2px solid rgba(239, 68, 68, 0.4)`,
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                        color: BRAND_COLORS.crimson,
                                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                        "&:hover": {
                                            bgcolor: "rgba(239, 68, 68, 0.15)",
                                            borderColor: BRAND_COLORS.crimson,
                                            transform: "scale(1.12) rotate(-8deg)",
                                            boxShadow: "0 10px 28px rgba(239, 68, 68, 0.3)",
                                        },
                                        "&:active": {
                                            transform: "scale(0.95)",
                                        },
                                    }}
                                >
                                    <CloseIcon sx={{ fontSize: 34, strokeWidth: 2 }} />
                                </IconButton>
                            </Tooltip>

                            {/* Info Toggle Button */}
                            <Tooltip title={showFullBio ? "Collapse Bio" : "Expand Bio"}>
                                <IconButton
                                    onClick={() => setShowFullBio((prev) => !prev)}
                                    size="small"
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                        color: showFullBio ? BRAND_COLORS.coralPink : BRAND_COLORS.textSecondary,
                                        "&:hover": {
                                            bgcolor: BRAND_COLORS.surfaceDarkElevated,
                                            color: "#fff",
                                            transform: "scale(1.08)",
                                        },
                                    }}
                                >
                                    <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            {/* Like Button */}
                            <Tooltip title="Like (Right Arrow)">
                                <IconButton
                                    aria-label="Like profile (Arrow Right)"
                                    onClick={() => handleSwipeAction("like")}
                                    disabled={swiping}
                                    sx={{
                                        width: 76,
                                        height: 76,
                                        background: BRAND_COLORS.primaryGradient,
                                        color: "#FFFFFF",
                                        boxShadow: "0 10px 30px rgba(253, 58, 115, 0.5)",
                                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                        "&:hover": {
                                            background: BRAND_COLORS.primaryGradientHover,
                                            transform: "scale(1.14) rotate(8deg)",
                                            boxShadow: "0 14px 38px rgba(253, 58, 115, 0.7)",
                                        },
                                        "&:active": {
                                            transform: "scale(0.95)",
                                        },
                                    }}
                                >
                                    <FavoriteIcon sx={{ fontSize: 38 }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        {/* Keyboard Navigation Tip */}
                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textMuted, mt: 0.5 }}>
                            <strong>← Left</strong> Pass &bull; <strong>Right →</strong> Like &bull; <strong>Space</strong> Photo
                        </Typography>
                    </Box>
                )}

                {/* 4. EMPTY FEED STATE */}
                {!loading && !error && (!currentProfile || currentIndex >= profiles.length) && (
                    <Fade in timeout={500}>
                        <Paper
                            elevation={4}
                            sx={{
                                p: { xs: 4, sm: 6 },
                                textAlign: "center",
                                borderRadius: "28px",
                                mt: 3,
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            }}
                        >
                            <Box
                                className="radar-pulse"
                                sx={{
                                    width: 100,
                                    height: 100,
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
                                <WhatshotIcon sx={{ fontSize: 50, color: BRAND_COLORS.coralPink }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#fff" }}>
                                You're All Caught Up!
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 4, maxWidth: 400, mx: "auto", lineHeight: 1.6 }}>
                                There are no more profiles matching your preferences right now. Try expanding your age range or check back soon as new members join!
                            </Typography>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                                <Button
                                    variant="contained"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => fetchProfiles(1)}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        borderRadius: 9999,
                                        py: 1.3,
                                        px: 3.5,
                                    }}
                                >
                                    Refresh Deck
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<TuneIcon />}
                                    onClick={() => navigate("/profile")}
                                    sx={{
                                        borderColor: "rgba(255,255,255,0.2)",
                                        color: "#fff",
                                        borderRadius: 9999,
                                        py: 1.3,
                                        "&:hover": { borderColor: BRAND_COLORS.coralPink, bgcolor: "rgba(253, 58, 115, 0.1)" },
                                    }}
                                >
                                    Adjust Preferences
                                </Button>
                            </Stack>
                        </Paper>
                    </Fade>
                )}
            </Container>

            {/* 5. MUTUAL MATCH CELEBRATION MODAL */}
            <Dialog
                open={matchModalOpen}
                onClose={() => setMatchModalOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "32px",
                        textAlign: "center",
                        p: { xs: 3, sm: 4 },
                        backgroundColor: "#120E1C",
                        border: "2px solid rgba(253, 58, 115, 0.4)",
                        boxShadow: "0 25px 60px rgba(253, 58, 115, 0.35)",
                        backgroundImage: "radial-gradient(circle at 50% 30%, rgba(253, 58, 115, 0.2) 0%, transparent 70%)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Typography
                        variant="h3"
                        className="gradient-text"
                        sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.03em" }}
                    >
                        It's a Match!
                    </Typography>
                    <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 4 }}>
                        You and <strong>{matchedUserData?.name}</strong> liked each other!
                    </Typography>

                    {/* Dual Interlocking Avatars with Glow */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            my: 3,
                        }}
                    >
                        <Avatar
                            src={userData?.photos?.[0]}
                            alt={userData?.name}
                            sx={{
                                width: 104,
                                height: 104,
                                border: "4px solid #FD3A73",
                                boxShadow: "0 8px 30px rgba(253, 58, 115, 0.5)",
                                mr: -2,
                                zIndex: 1,
                            }}
                        />
                        <Box
                            className="match-glow"
                            sx={{
                                position: "absolute",
                                zIndex: 3,
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                bgcolor: "#FD3A73",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                            }}
                        >
                            <FavoriteIcon sx={{ color: "#fff", fontSize: 24 }} />
                        </Box>
                        <Avatar
                            src={matchedUserData?.photos?.[0]}
                            alt={matchedUserData?.name}
                            sx={{
                                width: 104,
                                height: 104,
                                border: "4px solid #FF7A00",
                                boxShadow: "0 8px 30px rgba(255, 122, 0, 0.5)",
                                ml: -2,
                                zIndex: 2,
                            }}
                        />
                    </Box>

                    {/* Action Buttons */}
                    <Stack spacing={1.5} sx={{ mt: 4 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<ChatIcon />}
                            onClick={() => {
                                setMatchModalOpen(false);
                                navigate("/chat");
                            }}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: 9999,
                                py: 1.5,
                                fontSize: "1.05rem",
                                fontWeight: 800,
                                boxShadow: "0 6px 25px rgba(253, 58, 115, 0.4)",
                            }}
                        >
                            Send a Message
                        </Button>

                        <Button
                            variant="text"
                            onClick={() => setMatchModalOpen(false)}
                            sx={{
                                color: BRAND_COLORS.textSecondary,
                                borderRadius: 9999,
                                py: 1.2,
                                "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
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
                autoHideDuration={4000}
                onClose={() => setOpenToast(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={toastSeverity} onClose={() => setOpenToast(false)} sx={{ width: "100%", borderRadius: "16px" }}>
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default withAuth(DiscoveryPage);
