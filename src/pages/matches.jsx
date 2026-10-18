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
    Container,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";

function MatchesPage() {
    const navigate = useNavigate();
    const { userData, getMatches, getConversations } = useContext(AuthContext);

    const [matches, setMatches] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [error, setError] = useState("");

    // Story dialog
    const [storyDialogOpen, setStoryDialogOpen] = useState(false);
    const [newStoryPhoto, setNewStoryPhoto] = useState("");

    // Options menu
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [matchesRes, convsRes] = await Promise.allSettled([
                getMatches(1, 30),
                getConversations(),
            ]);

            if (matchesRes.status === "fulfilled" && matchesRes.value?.matches) {
                setMatches(matchesRes.value.matches);
            }
            if (convsRes.status === "fulfilled" && convsRes.value?.conversations) {
                setConversations(convsRes.value.conversations);
            }
        } catch (err) {
            console.error("Fetch matches error:", err);
            setError(err.message || "Failed to load matches and messages");
        } finally {
            setLoading(false);
        }
    }, [getMatches, getConversations]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Format relative time concisely (2m, 14m, 1h, 1d)
    const formatTimeShort = (dateStr) => {
        if (!dateStr) return "Just now";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "Just now";
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return "Now";
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d`;
    };

    // Filter conversations & matches based on search query
    const filteredConversations = conversations.filter((conv) => {
        const other = conv.otherParticipant;
        if (!other) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
            other.name?.toLowerCase().includes(q) ||
            conv.lastMessage?.content?.toLowerCase().includes(q)
        );
    });

    const openChatByConversation = (conv) => {
        navigate(`/chat?conversationId=${conv._id}`);
    };

    const openChatByMatch = (item) => {
        if (item.conversationId) {
            navigate(`/chat?conversationId=${item.conversationId}`);
        } else {
            navigate(`/chat?matchId=${item._id}`);
        }
    };

    const matchesRightActions = (
        <Stack direction="row" spacing={0.8} alignItems="center">
            {/* Search Toggle Button */}
            <IconButton
                onClick={() => setSearchOpen((prev) => !prev)}
                sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    bgcolor: searchOpen ? "rgba(253, 58, 115, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: searchOpen ? BRAND_COLORS.coralPink : "#FFFFFF",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                }}
            >
                <SearchRoundedIcon sx={{ fontSize: 22 }} />
            </IconButton>

            {/* More Options Button */}
            <IconButton
                onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    color: "#FFFFFF",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                }}
            >
                <MoreVertRoundedIcon sx={{ fontSize: 22 }} />
            </IconButton>
        </Stack>
    );

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, pb: { xs: 12, md: 6 } }}>
            {/* Unified Brand Navigation with Search & More Options */}
            <Navbar rightActions={matchesRightActions} />

            <Container maxWidth="sm" sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
                {error && (
                    <Box sx={{ mb: 2, p: 1.5, borderRadius: "16px", bgcolor: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "0.85rem" }}>
                        {error}
                    </Box>
                )}
                {/* Search Bar (Toggleable / Expandable) */}
                {searchOpen && (
                    <Box sx={{ mb: 2.5 }}>
                        <TextField
                            autoFocus
                            fullWidth
                            size="small"
                            placeholder="Search matches or messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon sx={{ color: BRAND_COLORS.coralPink }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ color: BRAND_COLORS.textSecondary }}>
                                            <CloseRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "9999px",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    color: "#FFFFFF",
                                },
                            }}
                        />
                    </Box>
                )}

                {/* 1. MATCHES SECTION HEADER (Matches 5) */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                        Matches
                    </Typography>
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: BRAND_COLORS.coralPink,
                            color: "#FFFFFF",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(253, 58, 115, 0.5)",
                        }}
                    >
                        {matches.length || "5"}
                    </Box>
                </Box>

                {/* 2. HORIZONTAL STORY AVATAR RAIL (Your Story + Match Circles) */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        overflowX: "auto",
                        pb: 2,
                        mb: 2,
                        "::-webkit-scrollbar": { height: 4 },
                        "::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: "9999px" },
                    }}
                >
                    {/* Item 1: Your Story */}
                    <Box
                        onClick={() => setStoryDialogOpen(true)}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            minWidth: 70,
                            transition: "transform 0.2s ease",
                            "&:hover": { transform: "scale(1.05)" },
                        }}
                    >
                        <Box sx={{ position: "relative", mb: 0.8 }}>
                            <Avatar
                                src={userData?.photos?.[0]}
                                alt={userData?.name}
                                sx={{
                                    width: 62,
                                    height: 62,
                                    border: "2px solid rgba(255, 255, 255, 0.15)",
                                }}
                            >
                                {userData?.name?.charAt(0) || "U"}
                            </Avatar>
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    bgcolor: BRAND_COLORS.coralPink,
                                    border: `2px solid ${BRAND_COLORS.bgDark}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#FFFFFF",
                                    boxShadow: "0 2px 6px rgba(253, 58, 115, 0.6)",
                                }}
                            >
                                <AddRoundedIcon sx={{ fontSize: 16 }} />
                            </Box>
                        </Box>
                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 600, fontSize: "0.76rem" }}>
                            Your Story
                        </Typography>
                    </Box>

                    {/* Matched Stories */}
                    {loading && (
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
                                    <Skeleton variant="circular" width={62} height={62} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.8 }} />
                                    <Skeleton variant="text" width={48} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                                </Box>
                            ))}
                        </>
                    )}

                    {!loading &&
                        matches.map((item) => {
                            const u = item.matchedUser;
                            if (!u) return null;
                            return (
                                <Box
                                    key={item._id}
                                    onClick={() => openChatByMatch(item)}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        minWidth: 70,
                                        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                        "&:hover": { transform: "scale(1.06)" },
                                        "&:active": { transform: "scale(0.96)" },
                                    }}
                                >
                                    <Box className="story-avatar-ring" sx={{ mb: 0.8 }}>
                                        <Avatar
                                            src={u.photos?.[0]}
                                            alt={u.name}
                                            sx={{
                                                width: 58,
                                                height: 58,
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
                                            maxWidth: 68,
                                            textAlign: "center",
                                            fontSize: "0.78rem",
                                        }}
                                    >
                                        {u.name?.split(" ")[0]}
                                    </Typography>
                                </Box>
                            );
                        })}
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)", mb: 2 }} />

                {/* 3. VERTICAL CONVERSATIONS LIST (Direct Chat Snippets) */}
                {loading && (
                    <Stack spacing={2}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1 }}>
                                <Skeleton variant="circular" width={56} height={56} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="40%" height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                                    <Skeleton variant="text" width="70%" height={18} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                )}

                {!loading && filteredConversations.length > 0 && (
                    <List disablePadding>
                        {filteredConversations.map((conv) => {
                            const other = conv.otherParticipant;
                            if (!other) return null;
                            const lastMsg = conv.lastMessage;
                            const isPhoto = lastMsg?.content?.startsWith("[image:") || lastMsg?.content?.match(/^https?:\/\/.*\.(jpeg|jpg|png|gif|webp)$/i);
                            const unread = conv.unreadCount > 0;

                            return (
                                <ListItem key={conv._id} disablePadding sx={{ mb: 0.8 }}>
                                    <ListItemButton
                                        onClick={() => openChatByConversation(conv)}
                                        sx={{
                                            py: 1.4,
                                            px: { xs: 1.5, sm: 2 },
                                            borderRadius: "20px",
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                bgcolor: "rgba(255, 255, 255, 0.04)",
                                            },
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 68 }}>
                                            <Box sx={{ position: "relative", display: "inline-block" }}>
                                                <Box className="story-avatar-ring" sx={{ p: "2px" }}>
                                                    <Avatar
                                                        src={other.photos?.[0]}
                                                        alt={other.name}
                                                        sx={{
                                                            width: 52,
                                                            height: 52,
                                                            border: `2px solid ${BRAND_COLORS.bgDark}`,
                                                        }}
                                                    >
                                                        {other.name?.charAt(0) || "U"}
                                                    </Avatar>
                                                </Box>
                                                {/* Online Status Dot */}
                                                <Box className="online-indicator-dot" />
                                            </Box>
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 0.4 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: unread ? 800 : 700,
                                                            color: "#FFFFFF",
                                                            fontSize: "0.98rem",
                                                        }}
                                                    >
                                                        {other.name}
                                                    </Typography>
                                                    <VerifiedRoundedIcon
                                                        sx={{
                                                            color: BRAND_COLORS.verifiedBlue,
                                                            fontSize: 18,
                                                            filter: "drop-shadow(0 2px 4px rgba(56, 189, 248, 0.5))",
                                                        }}
                                                    />
                                                </Stack>
                                            }
                                            secondary={
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                    sx={{
                                                        color: unread ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                                        fontWeight: unread ? 700 : 400,
                                                        fontSize: "0.85rem",
                                                        maxWidth: { xs: 200, sm: 280 },
                                                    }}
                                                >
                                                    {isPhoto ? (
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                            📷 Sent a photo
                                                        </span>
                                                    ) : lastMsg?.content ? (
                                                        lastMsg.content
                                                    ) : (
                                                        "New match! Say hello 👋"
                                                    )}
                                                </Typography>
                                            }
                                        />

                                        {/* Timestamp & Unread Badge Column */}
                                        <Stack alignItems="flex-end" spacing={0.8} sx={{ pl: 1 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: unread ? BRAND_COLORS.coralPink : BRAND_COLORS.textMuted,
                                                    fontWeight: unread ? 700 : 500,
                                                    fontSize: "0.75rem",
                                                }}
                                            >
                                                {formatTimeShort(conv.lastMessageAt || lastMsg?.createdAt)}
                                            </Typography>

                                            {unread && (
                                                <Box
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: "50%",
                                                        bgcolor: BRAND_COLORS.coralPink,
                                                        color: "#FFFFFF",
                                                        fontSize: "0.72rem",
                                                        fontWeight: 900,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        boxShadow: "0 2px 8px rgba(253, 58, 115, 0.6)",
                                                    }}
                                                >
                                                    {conv.unreadCount}
                                                </Box>
                                            )}
                                        </Stack>
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                )}

                {/* Empty State */}
                {!loading && filteredConversations.length === 0 && matches.length === 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            textAlign: "center",
                            borderRadius: "24px",
                            bgcolor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            mt: 3,
                        }}
                    >
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                bgcolor: "rgba(253, 58, 115, 0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 2,
                            }}
                        >
                            <FavoriteRoundedIcon sx={{ fontSize: 36, color: BRAND_COLORS.coralPink }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 1 }}>
                            No Matches Yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                            Start swiping in Discovery to find your mutual sparks and start chatting!
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate("/discovery")}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: "9999px",
                                px: 4,
                                py: 1.2,
                                fontWeight: 800,
                            }}
                        >
                            Go to Discovery
                        </Button>
                    </Paper>
                )}
            </Container>

            {/* ADD TO STORY DIALOG */}
            <Dialog
                open={storyDialogOpen}
                onClose={() => setStoryDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        maxWidth: 400,
                        width: "100%",
                        p: { xs: 2.5, sm: 3.5 },
                        textAlign: "center",
                        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#FFFFFF" }}>
                            Add to Your Story
                        </Typography>
                        <IconButton onClick={() => setStoryDialogOpen(false)} size="small" sx={{ color: BRAND_COLORS.textSecondary }}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>

                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                        Share photos with your matches. Stories disappear automatically after 24 hours.
                    </Typography>

                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Paste image URL (e.g. https://...)"
                        value={newStoryPhoto}
                        onChange={(e) => setNewStoryPhoto(e.target.value)}
                        sx={{
                            mb: 2.5,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "16px",
                                bgcolor: "rgba(255, 255, 255, 0.04)",
                                color: "#FFFFFF",
                            },
                        }}
                    />

                    <Stack spacing={1.5}>
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<PhotoCameraRoundedIcon />}
                            onClick={() => {
                                setStoryDialogOpen(false);
                                setNewStoryPhoto("");
                                alert("Story shared successfully with all your matches!");
                            }}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: "9999px",
                                py: 1.3,
                                fontWeight: 800,
                            }}
                        >
                            Post Story
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setStoryDialogOpen(false)}
                            sx={{
                                borderRadius: "9999px",
                                py: 1.2,
                                color: BRAND_COLORS.textSecondary,
                                borderColor: BRAND_COLORS.surfaceDarkBorder,
                                fontWeight: 700,
                            }}
                        >
                            Cancel
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* OPTIONS MENU */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={() => setMenuAnchorEl(null)}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                    sx: {
                        mt: 1.2,
                        minWidth: 200,
                        borderRadius: "20px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
                        p: 1,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        setMenuAnchorEl(null);
                        alert("All conversations marked as read!");
                    }}
                    sx={{ borderRadius: "12px", gap: 1.5, py: 1 }}
                >
                    <DoneAllRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.coralPink }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Mark all as read
                    </Typography>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setMenuAnchorEl(null);
                        navigate("/home");
                    }}
                    sx={{ borderRadius: "12px", gap: 1.5, py: 1 }}
                >
                    <NotificationsRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.violet }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Notification Settings
                    </Typography>
                </MenuItem>
            </Menu>
        </Box>
    );
}

export default withAuth(MatchesPage);
