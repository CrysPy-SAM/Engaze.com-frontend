import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useDirectCall } from "../contexts/DirectCallContext";
import withAuth from "../utils/withAuth";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogContent,
    IconButton,
    InputAdornment,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

const RECENT_SEARCHES_KEY = "engaze_recent_searches";
const MAX_RECENT_SEARCHES = 8;

function SearchPage() {
    const navigate = useNavigate();

    const {
        userData,
        searchUsers,
        sendMatchRequest,
        acceptMatchRequest,
        declineMatchRequest,
    } = useContext(AuthContext);

    const { initiateDirectCall } = useDirectCall();

    // Search state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Recent searches state
    const [recentSearches, setRecentSearches] = useState([]);

    // Profile detail dialog
    const [selectedProfile, setSelectedProfile] = useState(null);

    // Match celebration dialog
    const [celebrationUser, setCelebrationUser] = useState(null);

    // Action loading states by userId
    const [actionLoading, setActionLoading] = useState({});

    // Ref for debounce timer
    const debounceTimerRef = useRef(null);

    // Load recent searches from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
                }
            }
        } catch {
            // Ignore storage read error
        }
    }, []);

    // Save recent search term
    const saveRecentSearch = useCallback((term) => {
        const cleaned = term.trim();
        if (!cleaned) return;

        setRecentSearches((prev) => {
            const updated = [cleaned, ...prev.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch {
                // Ignore storage write error
            }
            return updated;
        });
    }, []);

    // Remove single recent search
    const removeRecentSearch = (termToRemove, e) => {
        e.stopPropagation();
        setRecentSearches((prev) => {
            const updated = prev.filter((item) => item !== termToRemove);
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch {
                // Ignore storage write error
            }
            return updated;
        });
    };

    // Clear all recent searches
    const clearAllRecentSearches = () => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch {
            // Ignore storage write error
        }
    };

    // Perform actual API search
    const executeSearch = useCallback(async (searchTerm, pageNum = 1, append = false) => {
        const trimmed = searchTerm.trim();
        if (!trimmed) {
            setResults([]);
            setHasMore(false);
            setLoading(false);
            return;
        }

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setError("");
        }

        try {
            if (searchUsers) {
                const res = await searchUsers(trimmed, pageNum, 20);
                if (res?.users) {
                    setResults((prev) => (append ? [...prev, ...res.users] : res.users));
                    setHasMore(Boolean(res.pagination?.hasMore));
                    setPage(pageNum);

                    if (!append && res.users.length > 0) {
                        saveRecentSearch(trimmed);
                    }
                }
            }
        } catch (err) {
            console.error("Search users error:", err);
            setError(err.message || "Failed to search people. Please try again.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchUsers, saveRecentSearch]);

    // Debounced search on query change
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            setLoading(false);
            setError("");
            return;
        }

        setLoading(true);
        debounceTimerRef.current = setTimeout(() => {
            executeSearch(trimmed, 1, false);
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [query, executeSearch]);

    // Handle clicking a recent search term
    const handleRecentClick = (term) => {
        setQuery(term);
        executeSearch(term, 1, false);
    };

    // Load next page
    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            executeSearch(query, page + 1, true);
        }
    };

    // Relationship Actions
    const handleConnect = async (user, e) => {
        e?.stopPropagation();
        const userId = user._id;
        setActionLoading((prev) => ({ ...prev, [userId]: true }));

        try {
            if (sendMatchRequest) {
                await sendMatchRequest(userId, `Hi ${user.name?.split(" ")[0]}, let's connect!`);
                // Update local status to outgoing_request
                setResults((prev) =>
                    prev.map((u) => (u._id === userId ? { ...u, relationship: "outgoing_request" } : u))
                );
                if (selectedProfile?._id === userId) {
                    setSelectedProfile((prev) => ({ ...prev, relationship: "outgoing_request" }));
                }
            }
        } catch (err) {
            console.error("Connect error:", err);
            setError(err.message || "Could not send match request.");
        } finally {
            setActionLoading((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const handleAcceptRequest = async (user, e) => {
        e?.stopPropagation();
        const userId = user._id;
        if (!user.requestId) return;

        setActionLoading((prev) => ({ ...prev, [userId]: true }));
        try {
            if (acceptMatchRequest) {
                const res = await acceptMatchRequest(user.requestId);
                setResults((prev) =>
                    prev.map((u) =>
                        u._id === userId
                            ? { ...u, relationship: "connected", conversationId: res.conversationId }
                            : u
                    )
                );
                if (selectedProfile?._id === userId) {
                    setSelectedProfile((prev) => ({
                        ...prev,
                        relationship: "connected",
                        conversationId: res.conversationId,
                    }));
                }
                setCelebrationUser({ ...user, conversationId: res.conversationId });
            }
        } catch (err) {
            console.error("Accept error:", err);
            setError(err.message || "Could not accept match request.");
        } finally {
            setActionLoading((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const handleDeclineRequest = async (user, e) => {
        e?.stopPropagation();
        const userId = user._id;
        if (!user.requestId) return;

        setActionLoading((prev) => ({ ...prev, [userId]: true }));
        try {
            if (declineMatchRequest) {
                await declineMatchRequest(user.requestId);
                setResults((prev) =>
                    prev.map((u) => (u._id === userId ? { ...u, relationship: "none", requestId: null } : u))
                );
                if (selectedProfile?._id === userId) {
                    setSelectedProfile((prev) => ({ ...prev, relationship: "none", requestId: null }));
                }
            }
        } catch (err) {
            console.error("Decline error:", err);
            setError(err.message || "Could not decline match request.");
        } finally {
            setActionLoading((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const handleOpenChat = (user, e) => {
        e?.stopPropagation();
        if (user.conversationId) {
            navigate(`/chat?conversationId=${user.conversationId}`);
        } else {
            navigate("/chat");
        }
    };

    // Render relationship button
    const renderActionButton = (user) => {
        const isLoading = Boolean(actionLoading[user._id]);

        if (isLoading) {
            return (
                <Button
                    size="small"
                    disabled
                    sx={{
                        borderRadius: "9999px",
                        px: 2,
                        minWidth: 90,
                        height: 34,
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                    }}
                >
                    <CircularProgress size={16} sx={{ color: BRAND_COLORS.coralPink }} />
                </Button>
            );
        }

        switch (user.relationship) {
            case "connected":
                return (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => handleOpenChat(user, e)}
                        startIcon={<ChatBubbleRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                            borderRadius: "9999px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            px: 1.8,
                            height: 34,
                            color: "#fff",
                            borderColor: BRAND_COLORS.surfaceDarkBorder,
                            bgcolor: "rgba(255, 255, 255, 0.05)",
                            "&:hover": {
                                borderColor: BRAND_COLORS.coralPink,
                                bgcolor: "rgba(253, 58, 115, 0.12)",
                            },
                        }}
                    >
                        Message
                    </Button>
                );

            case "outgoing_request":
                return (
                    <Button
                        size="small"
                        disabled
                        startIcon={<CheckRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                            borderRadius: "9999px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            px: 1.8,
                            height: 34,
                            color: BRAND_COLORS.textSecondary,
                            bgcolor: "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        }}
                    >
                        Requested
                    </Button>
                );

            case "incoming_request":
                return (
                    <Stack direction="row" spacing={0.8} alignItems="center">
                        <Button
                            size="small"
                            variant="contained"
                            onClick={(e) => handleAcceptRequest(user, e)}
                            sx={{
                                borderRadius: "9999px",
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                px: 1.6,
                                height: 34,
                                background: BRAND_COLORS.primaryGradient,
                                color: "#fff",
                                boxShadow: "0 2px 10px rgba(253, 58, 115, 0.4)",
                                "&:hover": { background: BRAND_COLORS.primaryGradientHover },
                            }}
                        >
                            Accept
                        </Button>
                        <Button
                            size="small"
                            onClick={(e) => handleDeclineRequest(user, e)}
                            sx={{
                                borderRadius: "9999px",
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.78rem",
                                px: 1.2,
                                height: 34,
                                color: BRAND_COLORS.textSecondary,
                                "&:hover": { color: "#EF4444" },
                            }}
                        >
                            Decline
                        </Button>
                    </Stack>
                );

            case "self":
                return (
                    <Chip
                        label="You"
                        size="small"
                        sx={{
                            bgcolor: "rgba(255, 255, 255, 0.06)",
                            color: BRAND_COLORS.textSecondary,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                        }}
                    />
                );

            case "none":
            default:
                return (
                    <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => handleConnect(user, e)}
                        startIcon={<PersonAddRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                            borderRadius: "9999px",
                            textTransform: "none",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            px: 2,
                            height: 34,
                            background: BRAND_COLORS.primaryGradient,
                            color: "#fff",
                            boxShadow: "0 2px 10px rgba(253, 58, 115, 0.35)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: BRAND_COLORS.primaryGradientHover,
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 14px rgba(253, 58, 115, 0.5)",
                            },
                        }}
                    >
                        Connect
                    </Button>
                );
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: BRAND_COLORS.bgDark, pb: { xs: 12, md: 6 } }}>
            <Navbar />

            <Container maxWidth="sm" sx={{ pt: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3 } }}>
                {/* Search Bar Header */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name, @username, or interests..."
                        inputProps={{
                            "aria-label": "Search people",
                            maxLength: 50,
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 24 }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    {loading ? (
                                        <CircularProgress size={18} sx={{ color: BRAND_COLORS.coralPink }} />
                                    ) : query ? (
                                        <IconButton
                                            size="small"
                                            onClick={() => setQuery("")}
                                            aria-label="Clear search"
                                            sx={{ color: BRAND_COLORS.textSecondary }}
                                        >
                                            <CloseRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    ) : null}
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "9999px",
                                bgcolor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                color: "#FFFFFF",
                                px: 2,
                                py: 0.5,
                                fontSize: "0.95rem",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    borderColor: "rgba(253, 58, 115, 0.4)",
                                },
                                "&.Mui-focused": {
                                    borderColor: BRAND_COLORS.coralPink,
                                    boxShadow: "0 0 16px rgba(253, 58, 115, 0.25)",
                                },
                            },
                        }}
                    />
                </Box>

                {/* Error Banner */}
                {error && (
                    <Box
                        sx={{
                            mb: 2.5,
                            p: 1.8,
                            borderRadius: "16px",
                            bgcolor: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography variant="body2" sx={{ color: "#EF4444", fontWeight: 600 }}>
                            {error}
                        </Typography>
                        <Button
                            size="small"
                            onClick={() => executeSearch(query, 1, false)}
                            startIcon={<RefreshRoundedIcon fontSize="small" />}
                            sx={{ color: "#EF4444", textTransform: "none", fontWeight: 700 }}
                        >
                            Retry
                        </Button>
                    </Box>
                )}

                {/* 1. Recent Searches View (Shown when query is empty) */}
                {!query.trim() && (
                    <Box>
                        {recentSearches.length > 0 ? (
                            <Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        mb: 1.5,
                                        px: 0.5,
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 800,
                                            color: "#fff",
                                            letterSpacing: "0.3px",
                                            textTransform: "uppercase",
                                            fontSize: "0.75rem",
                                        }}
                                    >
                                        Recent Searches
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={clearAllRecentSearches}
                                        sx={{
                                            color: BRAND_COLORS.coralPink,
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            textTransform: "none",
                                            p: 0,
                                            minWidth: "auto",
                                            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                        }}
                                    >
                                        Clear all
                                    </Button>
                                </Box>

                                <Stack spacing={1}>
                                    {recentSearches.map((term) => (
                                        <Card
                                            key={term}
                                            onClick={() => handleRecentClick(term)}
                                            sx={{
                                                bgcolor: BRAND_COLORS.surfaceDark,
                                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                                borderRadius: "16px",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                "&:hover": {
                                                    borderColor: "rgba(253, 58, 115, 0.4)",
                                                    bgcolor: "rgba(255, 255, 255, 0.05)",
                                                },
                                            }}
                                        >
                                            <CardContent
                                                sx={{
                                                    p: "12px 16px !important",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <HistoryRoundedIcon sx={{ color: BRAND_COLORS.textSecondary, fontSize: 20 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#fff" }}>
                                                        {term}
                                                    </Typography>
                                                </Stack>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => removeRecentSearch(term, e)}
                                                    aria-label={`Remove ${term} from recent searches`}
                                                    sx={{ color: BRAND_COLORS.textSecondary, "&:hover": { color: "#fff" } }}
                                                >
                                                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    textAlign: "center",
                                    py: 8,
                                    px: 2,
                                    color: BRAND_COLORS.textSecondary,
                                }}
                            >
                                <SearchRoundedIcon sx={{ fontSize: 56, color: "rgba(253, 58, 115, 0.3)", mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", mb: 0.8 }}>
                                    Search People & Connect
                                </Typography>
                                <Typography variant="body2" sx={{ maxWidth: 360, mx: "auto", color: BRAND_COLORS.textSecondary }}>
                                    Search by display name, username (@handle), or common interests to discover new friends and matches across Engaze.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* 2. Loading Skeletons */}
                {loading && (
                    <Stack spacing={1.5}>
                        {[1, 2, 3, 4].map((n) => (
                            <Card
                                key={n}
                                sx={{
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    borderRadius: "18px",
                                    p: 1.8,
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Skeleton variant="circular" width={52} height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton width="45%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.6 }} />
                                        <Skeleton width="30%" height={16} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.6 }} />
                                        <Skeleton width="70%" height={14} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                                    </Box>
                                    <Skeleton width={80} height={32} sx={{ borderRadius: "9999px", bgcolor: "rgba(255,255,255,0.06)" }} />
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* 3. Search Results List */}
                {!loading && query.trim() && (
                    <Box>
                        {results.length > 0 ? (
                            <Stack spacing={1.5}>
                                {results.map((user) => (
                                    <Card
                                        key={user._id}
                                        onClick={() => setSelectedProfile(user)}
                                        sx={{
                                            bgcolor: BRAND_COLORS.surfaceDark,
                                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            borderRadius: "18px",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                borderColor: "rgba(253, 58, 115, 0.45)",
                                                bgcolor: "rgba(255, 255, 255, 0.04)",
                                                transform: "translateY(-1px)",
                                                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
                                            },
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                p: "14px 16px !important",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 1.5,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.8} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                                                <Avatar
                                                    src={user.photos?.[0]}
                                                    alt={user.name}
                                                    sx={{
                                                        width: 52,
                                                        height: 52,
                                                        border: `2px solid ${BRAND_COLORS.coralPink}`,
                                                        boxShadow: "0 2px 10px rgba(253, 58, 115, 0.3)",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {user.name?.charAt(0) || "U"}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Stack direction="row" spacing={0.6} alignItems="center">
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: 800,
                                                                color: "#fff",
                                                                lineHeight: 1.2,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {user.name}
                                                            {user.age ? `, ${user.age}` : ""}
                                                        </Typography>
                                                        {user.isProfileComplete && (
                                                            <VerifiedRoundedIcon sx={{ fontSize: 15, color: BRAND_COLORS.verifiedBlue }} />
                                                        )}
                                                    </Stack>

                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: BRAND_COLORS.coralPink,
                                                            fontWeight: 700,
                                                            fontSize: "0.78rem",
                                                            display: "block",
                                                            mb: 0.4,
                                                        }}
                                                    >
                                                        @{user.username}
                                                    </Typography>

                                                    {user.bio && (
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: BRAND_COLORS.textSecondary,
                                                                fontSize: "0.8rem",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                maxWidth: "92%",
                                                            }}
                                                        >
                                                            {user.bio}
                                                        </Typography>
                                                    )}

                                                    {Array.isArray(user.interests) && user.interests.length > 0 && (
                                                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.4 }}>
                                                            {user.interests.slice(0, 3).map((item) => (
                                                                <Chip
                                                                    key={item}
                                                                    label={`#${item}`}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: "0.68rem",
                                                                        fontWeight: 600,
                                                                        bgcolor: "rgba(255, 255, 255, 0.05)",
                                                                        color: BRAND_COLORS.textSecondary,
                                                                        borderRadius: "6px",
                                                                    }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            </Stack>

                                            {/* Action Button */}
                                            <Box sx={{ flexShrink: 0 }}>
                                                {renderActionButton(user)}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Load More Pagination Button */}
                                {hasMore && (
                                    <Box sx={{ textAlign: "center", pt: 1, pb: 2 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            sx={{
                                                borderRadius: "9999px",
                                                px: 3,
                                                py: 0.8,
                                                borderColor: BRAND_COLORS.surfaceDarkBorder,
                                                color: "#fff",
                                                fontWeight: 700,
                                                fontSize: "0.85rem",
                                                textTransform: "none",
                                                "&:hover": {
                                                    borderColor: BRAND_COLORS.coralPink,
                                                    bgcolor: "rgba(253, 58, 115, 0.08)",
                                                },
                                            }}
                                        >
                                            {loadingMore ? (
                                                <CircularProgress size={18} sx={{ color: BRAND_COLORS.coralPink }} />
                                            ) : (
                                                "Load more results"
                                            )}
                                        </Button>
                                    </Box>
                                )}
                            </Stack>
                        ) : (
                            /* Empty Results State */
                            <Box
                                sx={{
                                    textAlign: "center",
                                    py: 8,
                                    px: 2,
                                }}
                            >
                                <SearchRoundedIcon sx={{ fontSize: 50, color: "rgba(255, 255, 255, 0.15)", mb: 1.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", mb: 0.8 }}>
                                    No results found
                                </Typography>
                                <Typography variant="body2" sx={{ maxWidth: 360, mx: "auto", color: BRAND_COLORS.textSecondary }}>
                                    We couldn't find anyone matching &ldquo;{query}&rdquo;. Try checking the spelling or searching by full username or common interest tags.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Container>

            {/* Profile Detail Preview Dialog */}
            <Dialog
                open={Boolean(selectedProfile)}
                onClose={() => setSelectedProfile(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "24px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        overflow: "hidden",
                    },
                }}
            >
                {selectedProfile && (
                    <DialogContent sx={{ p: 3 }}>
                        <Box sx={{ textAlign: "center", mb: 2.5 }}>
                            <Avatar
                                src={selectedProfile.photos?.[0]}
                                alt={selectedProfile.name}
                                sx={{
                                    width: 90,
                                    height: 90,
                                    mx: "auto",
                                    mb: 1.5,
                                    border: `3px solid ${BRAND_COLORS.coralPink}`,
                                    boxShadow: "0 4px 20px rgba(253, 58, 115, 0.4)",
                                }}
                            >
                                {selectedProfile.name?.charAt(0) || "U"}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                                {selectedProfile.name}
                                {selectedProfile.age ? `, ${selectedProfile.age}` : ""}
                            </Typography>
                            <Typography variant="caption" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 700, fontSize: "0.82rem" }}>
                                @{selectedProfile.username}
                            </Typography>
                        </Box>

                        {selectedProfile.bio && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: "14px", bgcolor: "rgba(255, 255, 255, 0.03)" }}>
                                <Typography variant="body2" sx={{ color: "#fff", lineHeight: 1.5 }}>
                                    {selectedProfile.bio}
                                </Typography>
                            </Box>
                        )}

                        {Array.isArray(selectedProfile.interests) && selectedProfile.interests.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 700, mb: 1, display: "block" }}>
                                    INTERESTS
                                </Typography>
                                <Stack direction="row" spacing={0.8} sx={{ flexWrap: "wrap", gap: 0.6 }}>
                                    {selectedProfile.interests.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={`#${tag}`}
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(253, 58, 115, 0.12)",
                                                color: BRAND_COLORS.coralPink,
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                borderRadius: "8px",
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Action Buttons in Modal */}
                        <Stack spacing={1}>
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                {renderActionButton(selectedProfile)}
                            </Box>
                            <Button
                                fullWidth
                                onClick={() => setSelectedProfile(null)}
                                sx={{
                                    color: BRAND_COLORS.textSecondary,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                }}
                            >
                                Close
                            </Button>
                        </Stack>
                    </DialogContent>
                )}
            </Dialog>

            {/* Match Celebration Dialog */}
            <Dialog
                open={Boolean(celebrationUser)}
                onClose={() => setCelebrationUser(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        p: 1,
                        textAlign: "center",
                    },
                }}
            >
                <DialogContent sx={{ pt: 4, pb: 3 }}>
                    <Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
                        <Avatar
                            src={userData?.photos?.[0]}
                            sx={{
                                width: 72,
                                height: 72,
                                border: `3px solid ${BRAND_COLORS.coralPink}`,
                                display: "inline-block",
                                mr: -1.5,
                            }}
                        />
                        <Avatar
                            src={celebrationUser?.photos?.[0]}
                            sx={{
                                width: 72,
                                height: 72,
                                border: `3px solid ${BRAND_COLORS.violet}`,
                                display: "inline-block",
                                ml: -1.5,
                            }}
                        />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: "#fff" }}>
                        It&apos;s a Connection!
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                        You and {celebrationUser?.name} are now connected. Chat and video calls are unlocked!
                    </Typography>

                    <Stack spacing={1.5}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<ChatBubbleRoundedIcon />}
                            onClick={() => {
                                const convId = celebrationUser?.conversationId;
                                setCelebrationUser(null);
                                if (convId) {
                                    navigate(`/chat?conversationId=${convId}`);
                                } else {
                                    navigate("/chat");
                                }
                            }}
                            sx={{
                                borderRadius: "9999px",
                                background: BRAND_COLORS.primaryGradient,
                                fontWeight: 800,
                                py: 1.2,
                                "&:hover": { background: BRAND_COLORS.primaryGradientHover },
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
                                const userToCall = celebrationUser;
                                setCelebrationUser(null);
                                if (userToCall) {
                                    initiateDirectCall(userToCall);
                                }
                            }}
                            sx={{
                                borderRadius: "9999px",
                                borderColor: BRAND_COLORS.violet,
                                color: BRAND_COLORS.violet,
                                fontWeight: 800,
                                py: 1.2,
                                "&:hover": {
                                    borderColor: BRAND_COLORS.violet,
                                    bgcolor: "rgba(139, 92, 246, 0.1)",
                                },
                            }}
                        >
                            Start Video Call
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default withAuth(SearchPage);
