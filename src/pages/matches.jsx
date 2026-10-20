import React, { useContext, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Avatar,
    Box,
    Button,
    Chip,
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
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import SafetyActionModal from "../components/SafetyActionModal";

function MatchesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        userData,
        getMatches,
        getLikesYou,
        sendSwipe,
        getIncomingMatchRequests,
        acceptMatchRequest,
        declineMatchRequest,
        getConversations,
        blockUser,
        reportUser,
        unmatchUser,
    } = useContext(AuthContext);

    // Active tab: 'matches', 'requests', or 'likes'
    const queryTab = new URLSearchParams(location.search).get("tab");
    const [activeTab, setActiveTab] = useState(
        queryTab === "likes" ? "likes" : queryTab === "requests" ? "requests" : "matches"
    );

    const [matches, setMatches] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [error, setError] = useState("");

    // Match Requests state
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [requestsError, setRequestsError] = useState("");
    const [requestActionLoading, setRequestActionLoading] = useState({});

    // Likes You state
    const [likesYouProfiles, setLikesYouProfiles] = useState([]);
    const [loadingLikes, setLoadingLikes] = useState(false);
    const [likesError, setLikesError] = useState("");

    // Match celebration modal state
    const [matchModalOpen, setMatchModalOpen] = useState(false);
    const [matchedUserData, setMatchedUserData] = useState(null);
    const [matchedMatchData, setMatchedMatchData] = useState(null);

    // Sync tab with URL search parameter
    useEffect(() => {
        const tabParam = new URLSearchParams(location.search).get("tab");
        if (tabParam === "likes") {
            setActiveTab("likes");
        } else if (tabParam === "requests") {
            setActiveTab("requests");
        } else if (tabParam === "matches") {
            setActiveTab("matches");
        }
    }, [location.search]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        navigate(`/matches?tab=${newTab}`, { replace: true });
    };

    // Options menu
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    // Safety action modal state
    const [safetyModalOpen, setSafetyModalOpen] = useState(false);
    const [safetyActionType, setSafetyActionType] = useState("unmatch");
    const [safetyTargetUser, setSafetyTargetUser] = useState(null);
    const [safetyMatchId, setSafetyMatchId] = useState(null);
    const [safetyConvId, setSafetyConvId] = useState(null);
    const [itemMenuAnchorEl, setItemMenuAnchorEl] = useState(null);
    const [selectedItemForMenu, setSelectedItemForMenu] = useState(null);

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

    const fetchLikes = useCallback(async () => {
        setLoadingLikes(true);
        setLikesError("");
        try {
            if (getLikesYou) {
                const res = await getLikesYou(1, 30);
                if (res?.profiles) {
                    setLikesYouProfiles(res.profiles);
                }
            }
        } catch (err) {
            console.error("Fetch likes you error:", err);
            setLikesError(err.message || "Failed to load incoming likes");
        } finally {
            setLoadingLikes(false);
        }
    }, [getLikesYou]);

    const fetchRequests = useCallback(async () => {
        setLoadingRequests(true);
        setRequestsError("");
        try {
            if (getIncomingMatchRequests) {
                const res = await getIncomingMatchRequests();
                if (res?.requests) {
                    setIncomingRequests(res.requests);
                }
            }
        } catch (err) {
            console.error("Fetch requests error:", err);
            setRequestsError(err.message || "Failed to load match requests");
        } finally {
            setLoadingRequests(false);
        }
    }, [getIncomingMatchRequests]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === "requests") {
            fetchRequests();
        } else if (activeTab === "likes") {
            fetchLikes();
        }
    }, [activeTab, fetchRequests, fetchLikes]);

    const handleAcceptRequest = async (requestId) => {
        setRequestActionLoading((prev) => ({ ...prev, [requestId]: "accepting" }));
        try {
            if (!acceptMatchRequest) return;
            const res = await acceptMatchRequest(requestId);
            setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
            if (res && res.match) {
                setMatchedUserData(res.match.matchedUser);
                setMatchedMatchData(res.match);
                setMatchModalOpen(true);
                fetchData();
            }
        } catch (err) {
            console.error("Error accepting request:", err);
        } finally {
            setRequestActionLoading((prev) => ({ ...prev, [requestId]: null }));
        }
    };

    const handleDeclineRequest = async (requestId) => {
        setRequestActionLoading((prev) => ({ ...prev, [requestId]: "declining" }));
        try {
            if (!declineMatchRequest) return;
            await declineMatchRequest(requestId);
            setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
        } catch (err) {
            console.error("Error declining request:", err);
        } finally {
            setRequestActionLoading((prev) => ({ ...prev, [requestId]: null }));
        }
    };

    const handleLikeBack = async (profile) => {
        try {
            if (!sendSwipe) return;
            const res = await sendSwipe(profile._id, "like");
            setLikesYouProfiles((prev) => prev.filter((p) => p._id !== profile._id));
            if (res && res.isMatch && res.match) {
                setMatchedUserData(res.match.matchedUser || profile);
                setMatchedMatchData(res.match);
                setMatchModalOpen(true);
                fetchData();
            }
        } catch (err) {
            console.error("Error liking profile:", err);
        }
    };

    const handlePassProfile = async (profile) => {
        try {
            if (!sendSwipe) return;
            await sendSwipe(profile._id, "pass");
            setLikesYouProfiles((prev) => prev.filter((p) => p._id !== profile._id));
        } catch (err) {
            console.error("Error passing profile:", err);
        }
    };

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

                {/* Segmented Tab Control: Matches vs Requests vs Likes You */}
                <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
                    <Button
                        fullWidth
                        onClick={() => handleTabChange("matches")}
                        startIcon={<FavoriteRoundedIcon fontSize="small" />}
                        sx={{
                            py: 1.1,
                            borderRadius: "9999px",
                            fontWeight: activeTab === "matches" ? 800 : 600,
                            fontSize: "0.85rem",
                            textTransform: "none",
                            bgcolor: activeTab === "matches" ? BRAND_COLORS.primaryGradient : "rgba(255, 255, 255, 0.05)",
                            border: `1px solid ${activeTab === "matches" ? "transparent" : BRAND_COLORS.surfaceDarkBorder}`,
                            color: activeTab === "matches" ? "#fff" : BRAND_COLORS.textSecondary,
                            boxShadow: activeTab === "matches" ? "0 4px 16px rgba(253, 58, 115, 0.35)" : "none",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: activeTab === "matches" ? BRAND_COLORS.primaryGradientHover : "rgba(255, 255, 255, 0.08)",
                                color: "#fff",
                            },
                        }}
                    >
                        Matches ({matches.length})
                    </Button>
                    <Button
                        fullWidth
                        onClick={() => handleTabChange("requests")}
                        startIcon={<NotificationsRoundedIcon fontSize="small" />}
                        sx={{
                            py: 1.1,
                            borderRadius: "9999px",
                            fontWeight: activeTab === "requests" ? 800 : 600,
                            fontSize: "0.85rem",
                            textTransform: "none",
                            bgcolor: activeTab === "requests" ? BRAND_COLORS.primaryGradient : "rgba(255, 255, 255, 0.05)",
                            border: `1px solid ${activeTab === "requests" ? "transparent" : BRAND_COLORS.surfaceDarkBorder}`,
                            color: activeTab === "requests" ? "#fff" : BRAND_COLORS.textSecondary,
                            boxShadow: activeTab === "requests" ? "0 4px 16px rgba(253, 58, 115, 0.35)" : "none",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: activeTab === "requests" ? BRAND_COLORS.primaryGradientHover : "rgba(255, 255, 255, 0.08)",
                                color: "#fff",
                            },
                        }}
                    >
                        Requests ({incomingRequests.length})
                    </Button>
                    <Button
                        fullWidth
                        onClick={() => handleTabChange("likes")}
                        startIcon={<WhatshotRoundedIcon fontSize="small" />}
                        sx={{
                            py: 1.1,
                            borderRadius: "9999px",
                            fontWeight: activeTab === "likes" ? 800 : 600,
                            fontSize: "0.85rem",
                            textTransform: "none",
                            bgcolor: activeTab === "likes" ? BRAND_COLORS.primaryGradient : "rgba(255, 255, 255, 0.05)",
                            border: `1px solid ${activeTab === "likes" ? "transparent" : BRAND_COLORS.surfaceDarkBorder}`,
                            color: activeTab === "likes" ? "#fff" : BRAND_COLORS.textSecondary,
                            boxShadow: activeTab === "likes" ? "0 4px 16px rgba(253, 58, 115, 0.35)" : "none",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: activeTab === "likes" ? BRAND_COLORS.primaryGradientHover : "rgba(255, 255, 255, 0.08)",
                                color: "#fff",
                            },
                        }}
                    >
                        Likes You ({likesYouProfiles.length})
                    </Button>
                </Stack>

                {activeTab === "matches" && (
                    <>
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
                        {matches.length}
                    </Box>
                </Box>

                {/* 2. HORIZONTAL RECENT MATCHES RAIL */}
                {(loading || matches.length > 0) && (
                    <Box sx={{ mb: 2.5 }}>
                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
                            Recent Matches
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                overflowX: "auto",
                                pb: 1,
                                "::-webkit-scrollbar": { height: 4 },
                                "::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: "9999px" },
                            }}
                        >
                            {loading && (
                                <>
                                    {[1, 2, 3, 4].map((i) => (
                                        <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
                                            <Skeleton variant="circular" width={58} height={58} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.8 }} />
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
                                            <Box sx={{ mb: 0.8 }}>
                                                <Avatar
                                                    src={u.photos?.[0]}
                                                    alt={u.name}
                                                    sx={{
                                                        width: 58,
                                                        height: 58,
                                                        border: `2px solid ${BRAND_COLORS.coralPink}`,
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
                    </Box>
                )}

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

                                        {/* Timestamp, Unread Badge & Safety Options */}
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 1 }}>
                                            <Stack alignItems="flex-end" spacing={0.8}>
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

                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setItemMenuAnchorEl(e.currentTarget);
                                                    setSelectedItemForMenu({
                                                        user: other,
                                                        matchId: conv.matchId || null,
                                                        conversationId: conv._id,
                                                    });
                                                }}
                                                sx={{
                                                    color: BRAND_COLORS.textMuted,
                                                    p: 0.5,
                                                    "&:hover": {
                                                        color: "#FFFFFF",
                                                        bgcolor: "rgba(255, 255, 255, 0.08)",
                                                    },
                                                }}
                                                aria-label="Safety options"
                                            >
                                                <MoreVertRoundedIcon sx={{ fontSize: 19 }} />
                                            </IconButton>
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
                    </>
                )}

                {/* 2. MATCH REQUESTS TAB CONTENT */}
                {activeTab === "requests" && (
                    <Box>
                        {requestsError && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: "16px", bgcolor: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "0.85rem" }}>
                                {requestsError}
                            </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                                Match Requests
                            </Typography>
                            {incomingRequests.length > 0 && (
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
                                    {incomingRequests.length}
                                </Box>
                            )}
                        </Box>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 2.5 }}>
                            Members who want to connect with you. Accept to establish a connection, start chatting and video calling!
                        </Typography>

                        {loadingRequests && (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} variant="rounded" height={260} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)", borderRadius: "20px" }} />
                                ))}
                            </Box>
                        )}

                        {!loadingRequests && incomingRequests.length === 0 && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 5,
                                    textAlign: "center",
                                    borderRadius: "24px",
                                    bgcolor: "rgba(255, 255, 255, 0.02)",
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    my: 4,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(253, 58, 115, 0.12)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 16px",
                                    }}
                                >
                                    <NotificationsRoundedIcon sx={{ fontSize: 36, color: BRAND_COLORS.coralPink }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 1 }}>
                                    No Pending Match Requests
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, maxWidth: 360, margin: "0 auto", mb: 3 }}>
                                    When another member sends you a match request, it will appear here for your consent before any chat or calling can begin.
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/discovery")}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        borderRadius: "9999px",
                                        px: 3,
                                        py: 1.2,
                                        fontWeight: 700,
                                        textTransform: "none",
                                    }}
                                >
                                    Explore Discovery
                                </Button>
                            </Paper>
                        )}

                        {!loadingRequests && incomingRequests.length > 0 && (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
                                {incomingRequests.map((reqItem) => {
                                    const sender = reqItem.sender;
                                    if (!sender) return null;
                                    const isAccepting = requestActionLoading[reqItem._id] === "accepting";
                                    const isDeclining = requestActionLoading[reqItem._id] === "declining";

                                    return (
                                        <Paper
                                            key={reqItem._id}
                                            elevation={0}
                                            sx={{
                                                borderRadius: "20px",
                                                overflow: "hidden",
                                                bgcolor: "rgba(255, 255, 255, 0.03)",
                                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                                display: "flex",
                                                flexDirection: "column",
                                                transition: "all 0.25s ease",
                                                "&:hover": {
                                                    borderColor: "rgba(253, 58, 115, 0.4)",
                                                    transform: "translateY(-3px)",
                                                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                                                },
                                            }}
                                        >
                                            <Box sx={{ position: "relative", height: 220, bgcolor: "#111" }}>
                                                <img
                                                    src={sender.photos?.[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"}
                                                    alt={sender.name}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        bottom: 0,
                                                        left: 0,
                                                        right: 0,
                                                        background: "linear-gradient(to top, rgba(9, 10, 16, 0.95), transparent)",
                                                        p: 1.5,
                                                    }}
                                                >
                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                                                        {sender.name}{sender.age ? `, ${sender.age}` : ""}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ p: 2, display: "flex", flexDirection: "column", flexGrow: 1, gap: 1.5 }}>
                                                {reqItem.message && (
                                                    <Box sx={{ p: 1.2, borderRadius: "12px", bgcolor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                                        <Typography variant="caption" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 700, display: "block" }}>
                                                            Personal Note
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: "#eee", fontStyle: "italic", fontSize: "0.85rem" }}>
                                                            "{reqItem.message}"
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {sender.bio && (
                                                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.82rem", lineClamp: 2, overflow: "hidden" }}>
                                                        {sender.bio}
                                                    </Typography>
                                                )}

                                                <Stack direction="row" spacing={1.5} sx={{ mt: "auto", pt: 1 }}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        disabled={isAccepting || isDeclining}
                                                        onClick={() => handleAcceptRequest(reqItem._id)}
                                                        sx={{
                                                            background: BRAND_COLORS.primaryGradient,
                                                            borderRadius: "12px",
                                                            py: 1,
                                                            fontWeight: 700,
                                                            textTransform: "none",
                                                            fontSize: "0.85rem",
                                                        }}
                                                    >
                                                        {isAccepting ? "Connecting..." : "Accept"}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        disabled={isAccepting || isDeclining}
                                                        onClick={() => handleDeclineRequest(reqItem._id)}
                                                        sx={{
                                                            borderRadius: "12px",
                                                            borderColor: "rgba(255, 255, 255, 0.15)",
                                                            color: BRAND_COLORS.textSecondary,
                                                            py: 1,
                                                            fontWeight: 600,
                                                            textTransform: "none",
                                                            fontSize: "0.85rem",
                                                            "&:hover": {
                                                                borderColor: "rgba(239, 68, 68, 0.4)",
                                                                color: "#EF4444",
                                                            },
                                                        }}
                                                    >
                                                        {isDeclining ? "Declining..." : "Decline"}
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                )}

                {/* 3. LIKES YOU TAB CONTENT */}
                {activeTab === "likes" && (
                    <Box>
                        {likesError && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: "16px", bgcolor: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "0.85rem" }}>
                                {likesError}
                            </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                                    Interested in You
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
                                    {likesYouProfiles.length}
                                </Box>
                            </Box>
                            {likesYouProfiles.length > 0 && (
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Match back to chat
                                </Typography>
                            )}
                        </Box>

                        {loadingLikes && (
                            <Stack spacing={2}>
                                {[1, 2, 3].map((i) => (
                                    <Box key={i} sx={{ p: 2, borderRadius: "24px", bgcolor: BRAND_COLORS.surfaceDark, border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                                        <Skeleton variant="rounded" width="100%" height={200} sx={{ borderRadius: "16px", bgcolor: "rgba(255,255,255,0.05)", mb: 1.5 }} />
                                        <Skeleton variant="text" width="50%" height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                                        <Skeleton variant="text" width="80%" height={18} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
                                    </Box>
                                ))}
                            </Stack>
                        )}

                        {!loadingLikes && likesYouProfiles.length === 0 && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    textAlign: "center",
                                    borderRadius: "28px",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    mt: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(253, 58, 115, 0.12)",
                                        color: BRAND_COLORS.coralPink,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                    }}
                                >
                                    <WhatshotRoundedIcon sx={{ fontSize: 32 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>
                                    No Pending Likes Yet
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, maxWidth: 360, mx: "auto", mb: 3 }}>
                                    When other members like your profile from discovery, they'll appear here. Keep your profile active to get noticed!
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/discovery")}
                                    startIcon={<WhatshotRoundedIcon />}
                                    sx={{
                                        borderRadius: "9999px",
                                        px: 3,
                                        py: 1.2,
                                        background: BRAND_COLORS.primaryGradient,
                                        fontWeight: 800,
                                        textTransform: "none",
                                        boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                                    }}
                                >
                                    Explore Discover
                                </Button>
                            </Paper>
                        )}

                        {!loadingLikes && likesYouProfiles.length > 0 && (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                {likesYouProfiles.map((profile) => (
                                    <Box
                                        key={profile._id}
                                        sx={{
                                            borderRadius: "24px",
                                            bgcolor: BRAND_COLORS.surfaceDark,
                                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            overflow: "hidden",
                                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                                            display: "flex",
                                            flexDirection: "column",
                                            transition: "all 0.25s ease",
                                            "&:hover": {
                                                transform: "translateY(-3px)",
                                                borderColor: BRAND_COLORS.coralPink,
                                                boxShadow: "0 12px 32px rgba(253, 58, 115, 0.25)",
                                            },
                                        }}
                                    >
                                        {/* Profile Photo with Overlay */}
                                        <Box sx={{ position: "relative", height: 240, width: "100%", bgcolor: "#111" }}>
                                            {profile.photos?.[0] ? (
                                                <Box
                                                    component="img"
                                                    src={profile.photos[0]}
                                                    alt={profile.name}
                                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Avatar sx={{ width: 64, height: 64, bgcolor: "rgba(253, 58, 115, 0.2)", color: BRAND_COLORS.coralPink, fontSize: "1.5rem", fontWeight: 800 }}>
                                                        {profile.name?.charAt(0) || "U"}
                                                    </Avatar>
                                                </Box>
                                            )}
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(9, 10, 16, 0.95) 100%)",
                                                }}
                                            />
                                            {/* Liked Timestamp Pill */}
                                            {profile.likedAt && (
                                                <Chip
                                                    label={`Liked you ${formatTimeShort(profile.likedAt)}`}
                                                    size="small"
                                                    sx={{
                                                        position: "absolute",
                                                        top: 12,
                                                        left: 12,
                                                        bgcolor: "rgba(9, 10, 16, 0.75)",
                                                        backdropFilter: "blur(10px)",
                                                        color: "#fff",
                                                        fontWeight: 700,
                                                        fontSize: "0.68rem",
                                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                                    }}
                                                />
                                            )}
                                            {/* Profile Name & Age */}
                                            <Box sx={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
                                                    {profile.name}{profile.age ? `, ${profile.age}` : ""}
                                                </Typography>
                                                {profile.gender && (
                                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", textTransform: "capitalize" }}>
                                                        {profile.gender}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Profile Info & Bio */}
                                        <Box sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                            {profile.bio && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: BRAND_COLORS.textSecondary,
                                                        fontSize: "0.82rem",
                                                        mb: 1.5,
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {profile.bio}
                                                </Typography>
                                            )}

                                            {Array.isArray(profile.interests) && profile.interests.length > 0 && (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 2 }}>
                                                    {profile.interests.slice(0, 3).map((tag, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={tag}
                                                            size="small"
                                                            sx={{
                                                                height: 22,
                                                                fontSize: "0.68rem",
                                                                bgcolor: "rgba(255, 255, 255, 0.05)",
                                                                color: "#fff",
                                                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}

                                            {/* Action Buttons: Pass & Match */}
                                            <Stack direction="row" spacing={1.2} sx={{ mt: "auto", pt: 1 }}>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    onClick={() => handlePassProfile(profile)}
                                                    startIcon={<CloseRoundedIcon />}
                                                    sx={{
                                                        py: 0.9,
                                                        borderRadius: "9999px",
                                                        borderColor: BRAND_COLORS.surfaceDarkBorder,
                                                        color: BRAND_COLORS.textSecondary,
                                                        fontSize: "0.82rem",
                                                        fontWeight: 700,
                                                        textTransform: "none",
                                                        "&:hover": {
                                                            borderColor: "#EF4444",
                                                            bgcolor: "rgba(239, 68, 68, 0.1)",
                                                            color: "#EF4444",
                                                        },
                                                    }}
                                                >
                                                    Pass
                                                </Button>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    onClick={() => handleLikeBack(profile)}
                                                    startIcon={<FavoriteRoundedIcon />}
                                                    sx={{
                                                        py: 0.9,
                                                        borderRadius: "9999px",
                                                        background: BRAND_COLORS.primaryGradient,
                                                        color: "#fff",
                                                        fontSize: "0.82rem",
                                                        fontWeight: 800,
                                                        textTransform: "none",
                                                        boxShadow: "0 4px 14px rgba(253, 58, 115, 0.35)",
                                                        "&:hover": {
                                                            background: BRAND_COLORS.primaryGradientHover,
                                                        },
                                                    }}
                                                >
                                                    Match
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
            </Container>



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

            {/* ITEM SAFETY MENU */}
            <Menu
                anchorEl={itemMenuAnchorEl}
                open={Boolean(itemMenuAnchorEl)}
                onClose={() => setItemMenuAnchorEl(null)}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                    sx: {
                        mt: 0.5,
                        minWidth: 170,
                        borderRadius: "16px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
                        p: 0.5,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        const item = selectedItemForMenu;
                        setItemMenuAnchorEl(null);
                        setSafetyActionType("unmatch");
                        setSafetyTargetUser(item?.user);
                        setSafetyMatchId(item?.matchId);
                        setSafetyConvId(item?.conversationId);
                        setSafetyModalOpen(true);
                    }}
                    sx={{ borderRadius: "10px", gap: 1.2, py: 1, color: "#FFFFFF" }}
                >
                    <PersonRemoveRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.textSecondary }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Unmatch
                    </Typography>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        const item = selectedItemForMenu;
                        setItemMenuAnchorEl(null);
                        setSafetyActionType("report");
                        setSafetyTargetUser(item?.user);
                        setSafetyMatchId(item?.matchId);
                        setSafetyConvId(item?.conversationId);
                        setSafetyModalOpen(true);
                    }}
                    sx={{ borderRadius: "10px", gap: 1.2, py: 1, color: "#F59E0B" }}
                >
                    <ReportProblemRoundedIcon fontSize="small" sx={{ color: "#F59E0B" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Report User
                    </Typography>
                </MenuItem>
                <Divider sx={{ my: 0.5, borderColor: "rgba(255,255,255,0.08)" }} />
                <MenuItem
                    onClick={() => {
                        const item = selectedItemForMenu;
                        setItemMenuAnchorEl(null);
                        setSafetyActionType("block");
                        setSafetyTargetUser(item?.user);
                        setSafetyMatchId(item?.matchId);
                        setSafetyConvId(item?.conversationId);
                        setSafetyModalOpen(true);
                    }}
                    sx={{ borderRadius: "10px", gap: 1.2, py: 1, color: "#EF4444" }}
                >
                    <BlockRoundedIcon fontSize="small" sx={{ color: "#EF4444" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Block User
                    </Typography>
                </MenuItem>
            </Menu>

            {/* SAFETY ACTION MODAL */}
            <SafetyActionModal
                isOpen={safetyModalOpen}
                onClose={() => {
                    setSafetyModalOpen(false);
                    setSafetyTargetUser(null);
                    setSafetyMatchId(null);
                    setSafetyConvId(null);
                }}
                actionType={safetyActionType}
                targetUser={safetyTargetUser}
                matchId={safetyMatchId}
                conversationId={safetyConvId}
                context="chat"
                onBlockUser={blockUser}
                onReportUser={reportUser}
                onUnmatchUser={unmatchUser}
                onSuccess={() => {
                    fetchData();
                }}
            />

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
                        <AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: BRAND_COLORS.coralPink }} />
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
                        Start a conversation now and send your first message.
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
                                borderRadius: "9999px",
                                py: 1.4,
                                background: BRAND_COLORS.primaryGradient,
                                boxShadow: "0 8px 25px rgba(253, 58, 115, 0.5)",
                                fontWeight: 800,
                                fontSize: "0.95rem",
                                "&:hover": {
                                    background: BRAND_COLORS.primaryGradientHover,
                                },
                            }}
                        >
                            Send a Message
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<VideocamRoundedIcon />}
                            onClick={() => {
                                setMatchModalOpen(false);
                                navigate("/random-video");
                            }}
                            sx={{
                                borderRadius: "9999px",
                                py: 1.3,
                                color: "#C4B5FD",
                                borderColor: "rgba(139, 92, 246, 0.4)",
                                fontWeight: 700,
                                "&:hover": {
                                    borderColor: BRAND_COLORS.violet,
                                    bgcolor: "rgba(139, 92, 246, 0.1)",
                                    color: "#fff",
                                },
                            }}
                        >
                            Start Video Call
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
                                "&:hover": {
                                    borderColor: BRAND_COLORS.coralPink,
                                    color: "#fff",
                                },
                            }}
                        >
                            Keep Browsing
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default withAuth(MatchesPage);
