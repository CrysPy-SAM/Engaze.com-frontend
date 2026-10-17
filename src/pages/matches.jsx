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
    Container,
    Grid,
    InputAdornment,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

function MatchesPage() {
    const navigate = useNavigate();
    const { getMatches } = useContext(AuthContext);

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState("");

    const fetchMatchesList = useCallback(async (pageNum = 1) => {
        setLoading(true);
        setError("");
        try {
            const data = await getMatches(pageNum, 24);
            if (data && data.matches) {
                setMatches(data.matches);
                setTotalPages(data.totalPages || 1);
                setPage(pageNum);
            }
        } catch (err) {
            console.error("Fetch matches error:", err);
            setError(err.message || "Failed to load matches");
        } finally {
            setLoading(false);
        }
    }, [getMatches]);

    useEffect(() => {
        fetchMatchesList(1);
    }, [fetchMatchesList]);

    // Format relative match time
    const formatMatchDate = (dateStr) => {
        if (!dateStr) return "Recently matched";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "Recently matched";
        const now = new Date();
        const diffMs = now - d;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) return "Just matched";
        if (diffHours < 24) return `Matched ${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `Matched ${diffDays}d ago`;
    };

    const filteredMatches = matches.filter((item) => {
        const u = item.matchedUser;
        if (!u) return false;
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            u.name?.toLowerCase().includes(query) ||
            u.username?.toLowerCase().includes(query)
        );
    });

    const openChat = (item) => {
        if (item.conversationId) {
            navigate(`/chat?conversationId=${item.conversationId}`);
        } else {
            navigate(`/chat?matchId=${item._id}`);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, pb: { xs: 12, md: 6 } }}>
            {/* Unified Brand Navigation */}
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: { xs: 2.5, md: 3.5 }, px: { xs: 2, sm: 3 } }}>
                {/* Header & Search Bar */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        mb: 3,
                    }}
                >
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "12px",
                                    background: BRAND_COLORS.primaryGradient,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    boxShadow: "0 4px 15px rgba(253, 58, 115, 0.4)",
                                }}
                            >
                                <FavoriteRoundedIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: "-0.025em" }}>
                                Mutual Matches
                            </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mt: 0.5 }}>
                            People who liked you back &bull; {matches.length} connection{matches.length !== 1 ? "s" : ""}
                        </Typography>
                    </Box>

                    {matches.length > 0 && (
                        <TextField
                            size="small"
                            placeholder="Search matches..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon sx={{ color: BRAND_COLORS.textSecondary }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                width: { xs: "100%", sm: 260 },
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "9999px",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                },
                            }}
                        />
                    )}
                </Box>

                {/* TINDER-STYLE HORIZONTAL NEW MATCHES STORY RAIL */}
                {!loading && matches.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: BRAND_COLORS.coralPink,
                                fontWeight: 800,
                                letterSpacing: "0.8px",
                                display: "block",
                                mb: 1.5,
                            }}
                        >
                            RECENT CONNECTIONS
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                overflowX: "auto",
                                pb: 1.5,
                                "::-webkit-scrollbar": { height: 4 },
                            }}
                        >
                            {matches.slice(0, 10).map((item) => {
                                const u = item.matchedUser;
                                if (!u) return null;
                                return (
                                    <Box
                                        key={item._id}
                                        onClick={() => openChat(item)}
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            minWidth: 74,
                                            transition: "transform 0.2s ease",
                                            "&:hover": { transform: "scale(1.05)" },
                                            "&:active": { transform: "scale(0.95)" },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 68,
                                                height: 68,
                                                borderRadius: "50%",
                                                p: "2.5px",
                                                background: BRAND_COLORS.primaryGradient,
                                                boxShadow: "0 4px 15px rgba(253, 58, 115, 0.4)",
                                                mb: 0.8,
                                            }}
                                        >
                                            <Avatar
                                                src={u.photos?.[0]}
                                                alt={u.name}
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    border: `2px solid ${BRAND_COLORS.bgDark}`,
                                                }}
                                            >
                                                {u.name?.charAt(0) || "U"}
                                            </Avatar>
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            noWrap
                                            sx={{
                                                fontWeight: 700,
                                                color: "#FFFFFF",
                                                maxWidth: 72,
                                                textAlign: "center",
                                            }}
                                        >
                                            {u.name?.split(" ")[0]}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {/* 1. LOADING SKELETON GRID */}
                {loading && (
                    <Grid container spacing={2.5}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <Grid item xs={6} sm={4} md={3} key={n}>
                                <Skeleton
                                    variant="rounded"
                                    width="100%"
                                    height={300}
                                    sx={{ borderRadius: "24px", bgcolor: "rgba(255,255,255,0.04)" }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* 2. ERROR STATE */}
                {!loading && error && (
                    <Paper
                        elevation={4}
                        sx={{
                            p: 5,
                            textAlign: "center",
                            borderRadius: "28px",
                            backgroundColor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            maxWidth: 420,
                            mx: "auto",
                        }}
                    >
                        <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 800 }}>
                            Failed to Load Matches
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<RefreshRoundedIcon />}
                            onClick={() => fetchMatchesList(1)}
                            sx={{ background: BRAND_COLORS.primaryGradient, borderRadius: "9999px", px: 4, py: 1.2, fontWeight: 700 }}
                        >
                            Retry
                        </Button>
                    </Paper>
                )}

                {/* 3. EMPTY STATE */}
                {!loading && !error && matches.length === 0 && (
                    <Paper
                        elevation={6}
                        sx={{
                            p: { xs: 4, sm: 6 },
                            textAlign: "center",
                            borderRadius: "32px",
                            backgroundColor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            maxWidth: 460,
                            mx: "auto",
                            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                        }}
                    >
                        <Box
                            className="radar-pulse"
                            sx={{
                                width: 88,
                                height: 88,
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
                            <FavoriteRoundedIcon sx={{ fontSize: 44, color: BRAND_COLORS.coralPink }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: "#fff", mb: 1.2, letterSpacing: "-0.02em" }}>
                            No Matches Yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3.5, lineHeight: 1.6 }}>
                            When you and another member like each other on Discovery, your match card will appear here!
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<WhatshotRoundedIcon />}
                            onClick={() => navigate("/discovery")}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: "9999px",
                                px: 4,
                                py: 1.4,
                                fontWeight: 800,
                                fontSize: "1rem",
                                boxShadow: "0 6px 25px rgba(253, 58, 115, 0.45)",
                            }}
                        >
                            Start Discovering
                        </Button>
                    </Paper>
                )}

                {/* 4. MATCHES CARD GRID */}
                {!loading && !error && filteredMatches.length > 0 && (
                    <Grid container spacing={2.5}>
                        {filteredMatches.map((item) => {
                            const u = item.matchedUser;
                            if (!u) return null;
                            const photo = u.photos?.[0] || "/logo192.png";

                            return (
                                <Grid item xs={6} sm={4} md={3} key={item._id}>
                                    <Card
                                        sx={{
                                            borderRadius: "24px",
                                            overflow: "hidden",
                                            position: "relative",
                                            backgroundColor: BRAND_COLORS.surfaceDark,
                                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            transition: "all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                            "&:hover": {
                                                transform: "translateY(-6px)",
                                                borderColor: BRAND_COLORS.coralPink,
                                                boxShadow: "0 16px 40px rgba(253, 58, 115, 0.25)",
                                            },
                                        }}
                                    >
                                        {/* Portrait Photo Container */}
                                        <Box sx={{ position: "relative", height: { xs: 240, sm: 300 }, width: "100%", overflow: "hidden" }}>
                                            <Box
                                                component="img"
                                                src={photo}
                                                alt={u.name}
                                                onError={(e) => {
                                                    e.target.src = "/logo192.png";
                                                }}
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                    transition: "transform 0.4s ease",
                                                    "&:hover": { transform: "scale(1.04)" },
                                                }}
                                            />

                                            {/* Gradient Overlay with Profile Info */}
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    p: { xs: 1.6, sm: 2 },
                                                    background: BRAND_COLORS.cardOverlay,
                                                    color: "#fff",
                                                }}
                                            >
                                                <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 0.2 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        noWrap
                                                        sx={{ fontWeight: 800, fontSize: { xs: "0.98rem", sm: "1.1rem" } }}
                                                    >
                                                        {u.name}
                                                        {u.age ? `, ${u.age}` : ""}
                                                    </Typography>
                                                    {u.isProfileComplete && (
                                                        <VerifiedRoundedIcon
                                                            sx={{ color: BRAND_COLORS.coralPink, fontSize: 16 }}
                                                        />
                                                    )}
                                                </Stack>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: "rgba(255,255,255,0.75)", display: "block" }}
                                                >
                                                    {formatMatchDate(item.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Action Buttons Bar */}
                                        <Box sx={{ p: 1.5, bgcolor: BRAND_COLORS.surfaceDarkElevated, display: "flex", gap: 1 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="small"
                                                startIcon={<ChatBubbleRoundedIcon sx={{ fontSize: 16 }} />}
                                                onClick={() => openChat(item)}
                                                sx={{
                                                    background: BRAND_COLORS.primaryGradient,
                                                    borderRadius: "9999px",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 800,
                                                    py: 0.8,
                                                }}
                                            >
                                                Chat
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => navigate("/random-video")}
                                                sx={{
                                                    borderColor: "rgba(255,255,255,0.15)",
                                                    color: BRAND_COLORS.violet,
                                                    borderRadius: "9999px",
                                                    px: 1.5,
                                                    minWidth: 0,
                                                    "&:hover": {
                                                        borderColor: BRAND_COLORS.violet,
                                                        bgcolor: "rgba(139, 92, 246, 0.12)",
                                                    },
                                                }}
                                            >
                                                <VideocamRoundedIcon fontSize="small" />
                                            </Button>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}>
                        <Button
                            variant="outlined"
                            disabled={page <= 1}
                            onClick={() => fetchMatchesList(page - 1)}
                            sx={{ borderRadius: "9999px", color: BRAND_COLORS.coralPink, borderColor: BRAND_COLORS.surfaceDarkBorder }}
                        >
                            Previous
                        </Button>
                        <Typography variant="body2" sx={{ alignSelf: "center", color: BRAND_COLORS.textSecondary }}>
                            Page {page} of {totalPages}
                        </Typography>
                        <Button
                            variant="outlined"
                            disabled={page >= totalPages}
                            onClick={() => fetchMatchesList(page + 1)}
                            sx={{ borderRadius: "9999px", color: BRAND_COLORS.coralPink, borderColor: BRAND_COLORS.surfaceDarkBorder }}
                        >
                            Next
                        </Button>
                    </Box>
                )}
            </Container>
        </Box>
    );
}

export default withAuth(MatchesPage);
