import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import "../App.css";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonIcon from "@mui/icons-material/Person";
import ChatIcon from "@mui/icons-material/Chat";
import VideocamIcon from "@mui/icons-material/Videocam";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";
import WhatshotIcon from "@mui/icons-material/Whatshot";

function MatchesPage() {
    const navigate = useNavigate();
    const { getMatches, handleLogout } = useContext(AuthContext);

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState("");

    const fetchMatchesList = useCallback(async (pageNum = 1) => {
        setLoading(true);
        setError("");
        try {
            const data = await getMatches(pageNum, 20);
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

    const formatDate = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", pb: 6 }}>
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
                        startIcon={<WhatshotIcon />}
                        onClick={() => navigate("/discovery")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Discovery
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<FavoriteIcon />}
                        sx={{
                            backgroundColor: "#FF9839",
                            "&:hover": { backgroundColor: "#e68933" },
                            textTransform: "none",
                            borderRadius: 4,
                            px: 2,
                        }}
                    >
                        Matches
                    </Button>
                    <Button
                        startIcon={<ChatIcon />}
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

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
                            Your Matches
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            People you have mutually connected with.
                        </Typography>
                    </Box>
                    <IconButton
                        title="Refresh Matches"
                        onClick={() => fetchMatchesList(page)}
                        disabled={loading}
                        sx={{ bgcolor: "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>

                {/* 1. LOADING SKELETON */}
                {loading && (
                    <Grid container spacing={3}>
                        {[1, 2, 3, 4].map((n) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                                <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
                                    <Skeleton variant="rectangular" height={220} />
                                    <CardContent>
                                        <Skeleton variant="text" width="70%" height={30} />
                                        <Skeleton variant="text" width="90%" height={20} />
                                        <Skeleton variant="text" width="40%" height={20} />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* 2. ERROR STATE */}
                {!loading && error && (
                    <Paper elevation={2} sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                        <Typography variant="h6" color="error" gutterBottom>
                            Could not load matches
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => fetchMatchesList(1)}
                            sx={{ backgroundColor: "#FF9839", "&:hover": { backgroundColor: "#e68933" } }}
                        >
                            Retry
                        </Button>
                    </Paper>
                )}

                {/* 3. MATCHES GRID */}
                {!loading && !error && matches.length > 0 && (
                    <>
                        <Grid container spacing={3}>
                        {matches.map((item) => {
                            const user = item.matchedUser;
                            if (!user) return null;

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            overflow: "hidden",
                                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                            "&:hover": {
                                                transform: "translateY(-4px)",
                                                boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                                            },
                                            display: "flex",
                                            flexDirection: "column",
                                            height: "100%",
                                        }}
                                    >
                                        <Box sx={{ position: "relative", width: "100%", height: 240, bgcolor: "#222" }}>
                                            <Box
                                                component="img"
                                                src={user.photos?.[0] || "/logo192.png"}
                                                alt={user.name}
                                                onError={(e) => {
                                                    e.target.src = "/logo192.png";
                                                }}
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
                                                    p: 2,
                                                    background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                                                    color: "white",
                                                }}
                                            >
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {user.name}
                                                    {user.age ? `, ${user.age}` : ""}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.9, textTransform: "capitalize" }}>
                                                    {user.gender || "Gender not specified"} • @{user.username}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <CardContent sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 1.5,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    minHeight: 40,
                                                }}
                                            >
                                                {user.bio || "No bio added yet."}
                                            </Typography>

                                            {user.interests && user.interests.length > 0 && (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 1.5 }}>
                                                    {user.interests.slice(0, 3).map((tag) => (
                                                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                                                    ))}
                                                    {user.interests.length > 3 && (
                                                        <Chip label={`+${user.interests.length - 3}`} size="small" />
                                                    )}
                                                </Box>
                                            )}

                                            <Box sx={{ mt: "auto", pt: 1, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Matched {formatDate(item.createdAt)}
                                                </Typography>

                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<ChatIcon />}
                                                    onClick={() => navigate(`/chat?matchId=${item._id}`)}
                                                    sx={{
                                                        backgroundColor: "#FF9839",
                                                        "&:hover": { backgroundColor: "#e68933" },
                                                        textTransform: "none",
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    Chat
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 4, gap: 2 }}>
                            <Button
                                variant="outlined"
                                disabled={page <= 1}
                                onClick={() => fetchMatchesList(page - 1)}
                            >
                                Previous
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                                Page {page} of {totalPages}
                            </Typography>
                            <Button
                                variant="outlined"
                                disabled={page >= totalPages}
                                onClick={() => fetchMatchesList(page + 1)}
                            >
                                Next
                            </Button>
                        </Box>
                    )}
                    </>
                )}

                {/* 4. EMPTY MATCHES STATE */}
                {!loading && !error && matches.length === 0 && (
                    <Paper
                        elevation={1}
                        sx={{
                            p: { xs: 4, sm: 6 },
                            textAlign: "center",
                            borderRadius: 4,
                            mt: 3,
                            bgcolor: "#ffffff",
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                bgcolor: "#fce4ec",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 2,
                            }}
                        >
                            <FavoriteIcon sx={{ fontSize: 44, color: "#e91e63" }} />
                        </Box>

                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            No matches yet!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
                            When you and another member like each other in Discovery, they will appear here. Start swiping to find someone special!
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<WhatshotIcon />}
                            onClick={() => navigate("/discovery")}
                            sx={{
                                backgroundColor: "#FF9839",
                                "&:hover": { backgroundColor: "#e68933" },
                                px: 4,
                                py: 1.2,
                                borderRadius: 3,
                                fontWeight: 600,
                            }}
                        >
                            Explore Discovery
                        </Button>
                    </Paper>
                )}
            </Container>
        </Box>
    );
}

export default withAuth(MatchesPage);
