import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
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
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatIcon from "@mui/icons-material/Chat";
import VideocamIcon from "@mui/icons-material/Videocam";
import SearchIcon from "@mui/icons-material/Search";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import VerifiedIcon from "@mui/icons-material/Verified";
import RefreshIcon from "@mui/icons-material/Refresh";

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

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, pb: { xs: 10, md: 6 } }}>
            {/* Unified Brand Navigation */}
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 4 } }}>
                {/* Header & Search Bar */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        mb: 4,
                    }}
                >
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: BRAND_COLORS.primaryGradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                                <FavoriteIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
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
                                        <SearchIcon sx={{ color: BRAND_COLORS.textSecondary }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: { xs: "100%", sm: 260 } }}
                        />
                    )}
                </Box>

                {/* 1. LOADING SKELETON GRID */}
                {loading && (
                    <Grid container spacing={3}>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                                <Skeleton
                                    variant="rounded"
                                    width="100%"
                                    height={360}
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
                            borderRadius: "24px",
                            backgroundColor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        }}
                    >
                        <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700 }}>
                            Failed to Load Matches
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={() => fetchMatchesList(1)}
                            sx={{ background: BRAND_COLORS.primaryGradient, borderRadius: 9999, px: 3.5 }}
                        >
                            Retry
                        </Button>
                    </Paper>
                )}

                {/* 3. EMPTY STATE */}
                {!loading && !error && matches.length === 0 && (
                    <Paper
                        elevation={4}
                        sx={{
                            p: { xs: 5, sm: 8 },
                            textAlign: "center",
                            borderRadius: "28px",
                            backgroundColor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            maxWidth: 500,
                            mx: "auto",
                        }}
                    >
                        <Box
                            sx={{
                                width: 84,
                                height: 84,
                                borderRadius: "50%",
                                bgcolor: "rgba(253, 58, 115, 0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 3,
                            }}
                        >
                            <FavoriteIcon sx={{ fontSize: 44, color: BRAND_COLORS.coralPink }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 1.5 }}>
                            No Matches Yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 4, lineHeight: 1.6 }}>
                            When both you and someone else swipe right on each other, they will appear here. Head over to Discovery to find your spark!
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<WhatshotIcon />}
                            onClick={() => navigate("/discovery")}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: 9999,
                                px: 4,
                                py: 1.5,
                                fontWeight: 800,
                                boxShadow: "0 6px 25px rgba(253, 58, 115, 0.4)",
                            }}
                        >
                            Start Discovering
                        </Button>
                    </Paper>
                )}

                {/* 4. MATCHES CARD GRID */}
                {!loading && !error && filteredMatches.length > 0 && (
                    <Grid container spacing={3}>
                        {filteredMatches.map((item) => {
                            const u = item.matchedUser;
                            if (!u) return null;
                            const photo = u.photos?.[0] || "/logo192.png";

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                                    <Card
                                        sx={{
                                            borderRadius: "24px",
                                            overflow: "hidden",
                                            position: "relative",
                                            backgroundColor: BRAND_COLORS.surfaceDark,
                                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            transition: "all 0.3s ease",
                                            "&:hover": {
                                                transform: "translateY(-6px)",
                                                borderColor: "rgba(253, 58, 115, 0.4)",
                                                boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                                            },
                                        }}
                                    >
                                        {/* Portrait Photo Container */}
                                        <Box sx={{ position: "relative", height: 320, width: "100%", overflow: "hidden" }}>
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
                                                    transition: "transform 0.4s ease",
                                                    "&:hover": { transform: "scale(1.05)" },
                                                }}
                                            />

                                            {/* Gradient Overlay with Profile Info */}
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    p: 2.5,
                                                    background: BRAND_COLORS.cardOverlay,
                                                    color: "#fff",
                                                }}
                                            >
                                                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.3 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.2rem" }}>
                                                        {u.name}
                                                        {u.age ? `, ${u.age}` : ""}
                                                    </Typography>
                                                    {u.isProfileComplete && (
                                                        <VerifiedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 18 }} />
                                                    )}
                                                </Stack>
                                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", display: "block", mb: 0.5 }}>
                                                    {formatMatchDate(item.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Action Buttons Bar */}
                                        <Box sx={{ p: 2, bgcolor: BRAND_COLORS.surfaceDarkElevated, display: "flex", gap: 1 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="small"
                                                startIcon={<ChatIcon fontSize="small" />}
                                                onClick={() => navigate(`/chat?matchId=${item._id}`)}
                                                sx={{
                                                    background: BRAND_COLORS.primaryGradient,
                                                    borderRadius: 9999,
                                                    fontSize: "0.82rem",
                                                    fontWeight: 700,
                                                    py: 1,
                                                }}
                                            >
                                                Message
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => navigate("/random-video")}
                                                sx={{
                                                    borderColor: "rgba(255,255,255,0.15)",
                                                    color: BRAND_COLORS.violet,
                                                    borderRadius: 9999,
                                                    px: 1.8,
                                                    "&:hover": { borderColor: BRAND_COLORS.violet, bgcolor: "rgba(139, 92, 246, 0.1)" },
                                                }}
                                            >
                                                <VideocamIcon fontSize="small" />
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
                            sx={{ borderRadius: "12px", color: BRAND_COLORS.coralPink, borderColor: BRAND_COLORS.surfaceDarkBorder }}
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
                            sx={{ borderRadius: "12px", color: BRAND_COLORS.coralPink, borderColor: BRAND_COLORS.surfaceDarkBorder }}
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
