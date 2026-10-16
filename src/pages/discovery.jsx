import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import "../App.css";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Skeleton,
    Snackbar,
    Alert,
    Stack,
    Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RefreshIcon from "@mui/icons-material/Refresh";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import PersonIcon from "@mui/icons-material/Person";
import ForumIcon from "@mui/icons-material/Forum";
import VideocamIcon from "@mui/icons-material/Videocam";
import HomeIcon from "@mui/icons-material/Home";
import CelebrationIcon from "@mui/icons-material/Celebration";

function DiscoveryPage() {
    const navigate = useNavigate();
    const { userData, getDiscovery, sendSwipe, handleLogout } = useContext(AuthContext);

    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [swiping, setSwiping] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState("");

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
            const data = await getDiscovery(pageNum, 10);
            if (data && data.profiles) {
                setProfiles(data.profiles);
                setCurrentIndex(0);
                setCurrentPhotoIndex(0);
                setHasMore(pageNum < data.totalPages);
                setPage(pageNum);
            }
        } catch (err) {
            console.error("Discovery fetch error:", err);
            setError(err.message || "Failed to load discovery profiles.");
        } finally {
            setLoading(false);
        }
    }, [getDiscovery]);

    useEffect(() => {
        fetchProfiles(1);
    }, [fetchProfiles]);

    const currentProfile = profiles[currentIndex];

    // Handle Swiping action (like or pass)
    const handleSwipeAction = useCallback(async (action) => {
        if (!currentProfile || swiping) return;

        setSwiping(true);
        try {
            const targetId = currentProfile._id;
            const res = await sendSwipe(targetId, action);

            if (res.isMatch) {
                // Mutual match found! Open celebration modal
                setMatchedUserData(res.match?.matchedUser || currentProfile);
                setMatchModalOpen(true);
            } else if (action === "like") {
                setToastMessage(`Liked ${currentProfile.name}!`);
                setToastSeverity("success");
                setOpenToast(true);
            }

            // Move to next profile
            if (currentIndex + 1 < profiles.length) {
                setCurrentIndex((prev) => prev + 1);
                setCurrentPhotoIndex(0);
            } else if (hasMore) {
                // Fetch next page
                await fetchProfiles(page + 1);
            } else {
                // Reached end of current deck
                setCurrentIndex(profiles.length);
            }
        } catch (err) {
            console.error("Swipe error:", err);
            setToastMessage(err.message || "Failed to record swipe.");
            setToastSeverity("error");
            setOpenToast(true);
        } finally {
            setSwiping(false);
        }
    }, [currentProfile, swiping, sendSwipe, currentIndex, profiles.length, hasMore, fetchProfiles, page]);

    // Keyboard navigation (ArrowLeft = Pass, ArrowRight = Like)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (matchModalOpen || loading || !currentProfile) return;
            if (e.key === "ArrowLeft") {
                handleSwipeAction("pass");
            } else if (e.key === "ArrowRight") {
                handleSwipeAction("like");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentProfile, loading, matchModalOpen, handleSwipeAction]);

    // Handle multiple photos pagination
    const photos = currentProfile?.photos || [];
    const handleNextPhoto = (e) => {
        e.stopPropagation();
        if (photos.length > 1) {
            setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
        }
    };

    const handlePrevPhoto = (e) => {
        e.stopPropagation();
        if (photos.length > 1) {
            setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8", pb: 6 }}>
            {/* Navigation Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: { xs: 2, md: 4 },
                    py: 2,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                        variant="contained"
                        size="small"
                        sx={{
                            backgroundColor: "#FF9839",
                            "&:hover": { backgroundColor: "#e68933" },
                            textTransform: "none",
                            borderRadius: 4,
                            px: 2,
                        }}
                    >
                        Discovery
                    </Button>
                    <Button
                        startIcon={<FavoriteIcon />}
                        onClick={() => navigate("/matches")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Matches
                    </Button>
                    <Button
                        startIcon={<ForumIcon />}
                        onClick={() => navigate("/chat")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Chat
                    </Button>
                    <Button
                        startIcon={<VideocamIcon />}
                        onClick={() => navigate("/random-video")}
                        sx={{ color: "#FF9839", fontWeight: 700, textTransform: "none" }}
                    >
                        Video Match
                    </Button>
                    <IconButton
                        title="My Profile"
                        onClick={() => navigate("/profile")}
                        sx={{ color: "#555" }}
                    >
                        <PersonIcon />
                    </IconButton>
                    <IconButton
                        title="Home"
                        onClick={() => navigate("/home")}
                        sx={{ color: "#555" }}
                    >
                        <HomeIcon />
                    </IconButton>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleLogout}
                        sx={{ textTransform: "none" }}
                    >
                        Logout
                    </Button>
                </Stack>
            </Box>

            <Container maxWidth="sm" sx={{ mt: 4 }}>
                {/* 1. LOADING STATE */}
                {loading && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 4 }}>
                        <Skeleton variant="rounded" width="100%" height={450} sx={{ borderRadius: 4, mb: 2 }} />
                        <Skeleton variant="text" width="60%" height={40} />
                        <Skeleton variant="text" width="90%" height={60} />
                    </Box>
                )}

                {/* 2. ERROR STATE */}
                {!loading && error && (
                    <Paper elevation={2} sx={{ p: 4, textAlign: "center", borderRadius: 4, mt: 4 }}>
                        <Typography variant="h6" color="error" gutterBottom>
                            Oops! Something went wrong
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={() => fetchProfiles(1)}
                            sx={{ backgroundColor: "#FF9839", "&:hover": { backgroundColor: "#e68933" } }}
                        >
                            Retry Loading
                        </Button>
                    </Paper>
                )}

                {/* 3. ACTIVE PROFILE CARD */}
                {!loading && !error && currentProfile && currentIndex < profiles.length && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Card
                            sx={{
                                width: "100%",
                                borderRadius: 4,
                                overflow: "hidden",
                                boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                                position: "relative",
                                bgcolor: "#ffffff",
                            }}
                        >
                            {/* Photo Container */}
                            <Box
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    height: { xs: 380, sm: 460 },
                                    backgroundColor: "#1a1a1a",
                                    userSelect: "none",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={photos[currentPhotoIndex] || "/logo192.png"}
                                    alt={currentProfile.name}
                                    onError={(e) => {
                                        e.target.src = "/logo192.png";
                                    }}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />

                                {/* Multiple Photos Indicators */}
                                {photos.length > 1 && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 12,
                                            left: 12,
                                            right: 12,
                                            display: "flex",
                                            gap: 0.8,
                                            zIndex: 2,
                                        }}
                                    >
                                        {photos.map((_, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    flex: 1,
                                                    height: 4,
                                                    borderRadius: 2,
                                                    bgcolor: idx === currentPhotoIndex ? "#ffffff" : "rgba(255,255,255,0.4)",
                                                    transition: "background-color 0.2s ease",
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}

                                {/* Prev / Next Photo Arrow Buttons */}
                                {photos.length > 1 && (
                                    <>
                                        <IconButton
                                            onClick={handlePrevPhoto}
                                            sx={{
                                                position: "absolute",
                                                left: 8,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                bgcolor: "rgba(0,0,0,0.35)",
                                                color: "white",
                                                "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                                            }}
                                        >
                                            <ArrowBackIosNewIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            onClick={handleNextPhoto}
                                            sx={{
                                                position: "absolute",
                                                right: 8,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                bgcolor: "rgba(0,0,0,0.35)",
                                                color: "white",
                                                "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                                            }}
                                        >
                                            <ArrowForwardIosIcon fontSize="small" />
                                        </IconButton>
                                    </>
                                )}

                                {/* Gradient Bottom Banner with Name, Age & Gender */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 3,
                                        background: "linear-gradient(transparent, rgba(0,0,0,0.85) 75%)",
                                        color: "white",
                                    }}
                                >
                                    <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
                                        {currentProfile.name}
                                        {currentProfile.age ? `, ${currentProfile.age}` : ""}
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ opacity: 0.9, textTransform: "capitalize" }}>
                                        {currentProfile.gender || "Not specified"} • @{currentProfile.username}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Bio & Interests Section */}
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="body1" sx={{ mb: 2, color: "#333", fontSize: "1.05rem", lineHeight: 1.5 }}>
                                    {currentProfile.bio || "No bio written yet."}
                                </Typography>

                                {currentProfile.interests && currentProfile.interests.length > 0 && (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                        {currentProfile.interests.map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* Swipe Action Controls Bar */}
                        <Stack
                            direction="row"
                            spacing={4}
                            alignItems="center"
                            justifyContent="center"
                            sx={{ mt: 3, mb: 1 }}
                        >
                            {/* Pass Button */}
                            <IconButton
                                aria-label="Pass profile (Arrow Left)"
                                onClick={() => handleSwipeAction("pass")}
                                disabled={swiping}
                                sx={{
                                    width: 68,
                                    height: 68,
                                    bgcolor: "#ffffff",
                                    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                                    border: "2px solid #e0e0e0",
                                    color: "#d32f2f",
                                    "&:hover": {
                                        bgcolor: "#ffebee",
                                        borderColor: "#d32f2f",
                                        transform: "scale(1.08)",
                                    },
                                    transition: "all 0.2s ease-in-out",
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 36 }} />
                            </IconButton>

                            {/* Like Button */}
                            <IconButton
                                aria-label="Like profile (Arrow Right)"
                                onClick={() => handleSwipeAction("like")}
                                disabled={swiping}
                                sx={{
                                    width: 76,
                                    height: 76,
                                    bgcolor: "#FF9839",
                                    boxShadow: "0 8px 20px rgba(255,152,57,0.4)",
                                    color: "#ffffff",
                                    "&:hover": {
                                        bgcolor: "#e68933",
                                        transform: "scale(1.08)",
                                    },
                                    transition: "all 0.2s ease-in-out",
                                }}
                            >
                                <FavoriteIcon sx={{ fontSize: 40 }} />
                            </IconButton>
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            Press <strong>← Left Arrow</strong> to Pass &bull; <strong>Right Arrow →</strong> to Like
                        </Typography>
                    </Box>
                )}

                {/* 4. EMPTY DECK STATE */}
                {!loading && !error && (!currentProfile || currentIndex >= profiles.length) && (
                    <Paper
                        elevation={2}
                        sx={{
                            p: { xs: 3, sm: 5 },
                            textAlign: "center",
                            borderRadius: 4,
                            mt: 4,
                        }}
                    >
                        <Box
                            sx={{
                                width: 90,
                                height: 90,
                                borderRadius: "50%",
                                bgcolor: "#fff3e0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 2,
                            }}
                        >
                            <WhatshotIcon sx={{ fontSize: 50, color: "#FF9839" }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            You're all caught up!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 380, mx: "auto" }}>
                            There are no more new profiles matching your current preferences right now. Check back soon or update your dating preferences in your profile.
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={() => fetchProfiles(1)}
                                sx={{ backgroundColor: "#FF9839", "&:hover": { backgroundColor: "#e68933" } }}
                            >
                                Refresh Feed
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PersonIcon />}
                                onClick={() => navigate("/profile")}
                            >
                                Edit Preferences
                            </Button>
                            <Button
                                variant="text"
                                startIcon={<FavoriteIcon />}
                                onClick={() => navigate("/matches")}
                            >
                                View My Matches
                            </Button>
                        </Stack>
                    </Paper>
                )}
            </Container>

            {/* MUTUAL MATCH CELEBRATION MODAL */}
            <Dialog
                open={matchModalOpen}
                onClose={() => setMatchModalOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        textAlign: "center",
                        p: 2,
                        background: "linear-gradient(135deg, #ffffff 60%, #fff8f0 100%)",
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <CelebrationIcon sx={{ fontSize: 50, color: "#FF9839", mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#FF9839" }}>
                        It's a Match!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        You and {matchedUserData?.name} liked each other!
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 2,
                            my: 3,
                        }}
                    >
                        {/* Current User Avatar */}
                        <Avatar
                            src={userData?.photos?.[0]}
                            alt={userData?.name}
                            sx={{
                                width: 90,
                                height: 90,
                                border: "4px solid #FF9839",
                                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                            }}
                        />
                        <FavoriteIcon sx={{ color: "#d32f2f", fontSize: 32 }} />
                        {/* Matched User Avatar */}
                        <Avatar
                            src={matchedUserData?.photos?.[0]}
                            alt={matchedUserData?.name}
                            sx={{
                                width: 90,
                                height: 90,
                                border: "4px solid #FF9839",
                                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                            }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ flexDirection: "column", gap: 1, px: 3, pb: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ForumIcon />}
                        onClick={() => {
                            setMatchModalOpen(false);
                            navigate("/matches");
                        }}
                        sx={{
                            backgroundColor: "#FF9839",
                            "&:hover": { backgroundColor: "#e68933" },
                            py: 1.2,
                            borderRadius: 3,
                            fontWeight: 600,
                        }}
                    >
                        View Matches
                    </Button>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={() => setMatchModalOpen(false)}
                        sx={{ color: "#555" }}
                    >
                        Keep Swiping
                    </Button>
                </DialogActions>
            </Dialog>

            {/* TOAST SNACKBAR */}
            <Snackbar
                open={openToast}
                autoHideDuration={3000}
                onClose={() => setOpenToast(false)}
            >
                <Alert
                    onClose={() => setOpenToast(false)}
                    severity={toastSeverity}
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default withAuth(DiscoveryPage);
