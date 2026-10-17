import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import server from "../environment";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Avatar,
    Badge,
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VideocamIcon from "@mui/icons-material/Videocam";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DoneIcon from "@mui/icons-material/Done";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SearchIcon from "@mui/icons-material/Search";
import ForumIcon from "@mui/icons-material/Forum";
import SparklesIcon from "@mui/icons-material/AutoAwesome";

function ChatPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { conversationId: paramConvId } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const {
        userData,
        token,
        getConversations,
        getOrCreateConversationByMatch,
        getConversationMessages,
        markConversationRead,
        sendMessageRest,
    } = useContext(AuthContext);

    // State
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [conversationsError, setConversationsError] = useState(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // Refs
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const activeConvRef = useRef(null);
    const loadConversationsRef = useRef(null);

    // Keep activeConvRef in sync for socket event handlers
    useEffect(() => {
        activeConvRef.current = activeConversation;
    }, [activeConversation]);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Initialize Socket.io connection with JWT auth
    useEffect(() => {
        if (!token) return;

        const socket = io(server, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnected(true);
            if (activeConvRef.current?._id) {
                socket.emit("chat:join", { conversationId: activeConvRef.current._id });
            }
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        // Incoming real-time message handler
        socket.on("chat:new-message", (newMsg) => {
            const currentConv = activeConvRef.current;

            if (currentConv && currentConv._id.toString() === newMsg.conversation.toString()) {
                setMessages((prev) => {
                    // Avoid duplicate if sent locally with clientTempId
                    if (newMsg.clientTempId && prev.some((m) => m.clientTempId === newMsg.clientTempId)) {
                        return prev.map((m) =>
                            m.clientTempId === newMsg.clientTempId ? newMsg : m
                        );
                    }
                    if (prev.some((m) => m._id === newMsg._id)) {
                        return prev;
                    }
                    return [...prev, newMsg];
                });

                scrollToBottom();

                // If message from the other person, send read event
                if (newMsg.sender?._id !== userData?._id && newMsg.sender !== userData?._id) {
                    socket.emit("chat:read", { conversationId: currentConv._id });
                }
            }

            // Update conversation list preview
            setConversations((prevConvs) => {
                const exists = prevConvs.some((c) => c._id.toString() === newMsg.conversation.toString());
                if (!exists && loadConversationsRef.current) {
                    loadConversationsRef.current();
                    return prevConvs;
                }

                const updated = prevConvs.map((conv) => {
                    if (conv._id.toString() === newMsg.conversation.toString()) {
                        const isCurrentActive =
                            currentConv && currentConv._id.toString() === conv._id.toString();
                        return {
                            ...conv,
                            lastMessage: newMsg,
                            lastMessageAt: newMsg.createdAt,
                            unreadCount: isCurrentActive
                                ? 0
                                : (conv.unreadCount || 0) + (newMsg.sender?._id !== userData?._id ? 1 : 0),
                        };
                    }
                    return conv;
                });

                // Sort by most recent message
                return updated.sort(
                    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
                );
            });
        });

        // Real-time read receipt handler
        socket.on("chat:read", ({ conversationId, readerId }) => {
            if (activeConvRef.current?._id.toString() === conversationId.toString()) {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (!m.readBy?.includes(readerId)) {
                            return { ...m, readBy: [...(m.readBy || []), readerId] };
                        }
                        return m;
                    })
                );
            }
        });

        // Real-time mutual match handler
        socket.on("match:new", () => {
            if (loadConversationsRef.current) {
                loadConversationsRef.current();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [token, userData?._id]);

    // 2. Load conversations and handle query params (e.g. ?matchId=...)
    const loadConversations = useCallback(async () => {
        setLoadingConversations(true);
        setConversationsError(null);
        try {
            const data = await getConversations();
            const convList = data?.conversations || [];
            setConversations(convList);

            // Check if URL has ?conversationId=... or :conversationId
            const queryParams = new URLSearchParams(location.search);
            const convIdParam = queryParams.get("conversationId") || paramConvId;
            const matchId = queryParams.get("matchId");

            if (convIdParam) {
                const target = convList.find((c) => c._id.toString() === convIdParam.toString());
                if (target) {
                    setActiveConversation(target);
                    setMobileShowChat(true);
                    return;
                }
            }

            if (matchId) {
                const existing = convList.find((c) =>
                    c.match?._id?.toString() === matchId.toString() ||
                    c.match?.toString() === matchId.toString() ||
                    c._id?.toString() === matchId.toString()
                );
                if (existing) {
                    setActiveConversation(existing);
                    setMobileShowChat(true);
                    return;
                }

                const matchRes = await getOrCreateConversationByMatch(matchId);
                if (matchRes?.conversation) {
                    const targetConv = matchRes.conversation;
                    setActiveConversation(targetConv);
                    setMobileShowChat(true);

                    setConversations((prev) => {
                        if (!prev.some((c) => c._id.toString() === targetConv._id.toString())) {
                            return [targetConv, ...prev];
                        }
                        return prev;
                    });
                    return;
                }
            }

            // Default to first conversation on desktop
            if (convList.length > 0 && !isMobile && !activeConvRef.current) {
                setActiveConversation(convList[0]);
            }
        } catch (err) {
            console.error("Failed to load conversations:", err);
            setConversationsError(err.message || "Failed to load conversations. Please retry.");
        } finally {
            setLoadingConversations(false);
        }
    }, [getConversations, getOrCreateConversationByMatch, location.search, paramConvId, isMobile]);

    useEffect(() => {
        loadConversationsRef.current = loadConversations;
    }, [loadConversations]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // 3. Load messages when activeConversation changes
    useEffect(() => {
        if (!activeConversation?._id) {
            setMessages([]);
            return;
        }

        const convId = activeConversation._id;

        // Immediately clear previous messages to prevent leakage between conversations
        setMessages([]);

        // Join room in socket
        if (socketRef.current?.connected) {
            socketRef.current.emit("chat:join", { conversationId: convId });
            socketRef.current.emit("chat:read", { conversationId: convId });
        }

        let isCancelled = false;

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const data = await getConversationMessages(convId, 1, 50);
                if (!isCancelled && data?.messages) {
                    setMessages(data.messages);
                    setTimeout(scrollToBottom, 100);
                }
                if (!isCancelled) {
                    await markConversationRead(convId);
                    setConversations((prev) =>
                        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
                    );
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("Failed to load messages:", err);
                }
            } finally {
                if (!isCancelled) {
                    setLoadingMessages(false);
                }
            }
        };

        fetchMessages();

        return () => {
            isCancelled = true;
        };
    }, [activeConversation?._id, getConversationMessages, markConversationRead]);

    // 4. Send Message Handler
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const trimmed = inputText.trim();
        if (!trimmed || !activeConversation || sending) return;

        const convId = activeConversation._id;
        const clientTempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setInputText("");
        setSending(true);

        const optimisticMessage = {
            _id: clientTempId,
            clientTempId,
            conversation: convId,
            sender: {
                _id: userData?._id,
                name: userData?.name,
                photos: userData?.photos,
            },
            content: trimmed,
            createdAt: new Date().toISOString(),
            readBy: [userData?._id],
        };

        // Optimistically add to UI
        setMessages((prev) => [...prev, optimisticMessage]);
        setTimeout(scrollToBottom, 50);

        try {
            if (socketRef.current?.connected) {
                socketRef.current.emit(
                    "chat:send",
                    {
                        conversationId: convId,
                        content: trimmed,
                        clientTempId,
                    },
                    (response) => {
                        setSending(false);
                        if (response?.success && response.message) {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.clientTempId === clientTempId ? response.message : m
                                )
                            );
                        }
                    }
                );
            } else {
                const resData = await sendMessageRest(convId, trimmed, clientTempId);
                setSending(false);

                if (resData?.success && resData.message) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.clientTempId === clientTempId ? resData.message : m
                        )
                    );
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            setSending(false);
        }
    };

    const otherUser = activeConversation?.otherParticipant;

    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    // Filter conversations by search term
    const filteredConversations = conversations.filter((c) => {
        if (!searchTerm) return true;
        const name = c.otherParticipant?.name?.toLowerCase() || "";
        const username = c.otherParticipant?.username?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return name.includes(term) || username.includes(term);
    });

    return (
        <Box
            sx={{
                height: { xs: "100dvh", md: "100vh" },
                display: "flex",
                flexDirection: "column",
                bgcolor: BRAND_COLORS.backgroundDark,
                overflow: "hidden",
            }}
        >
            {/* Unified Brand Navigation */}
            <Navbar hideBottomNav={isMobile && mobileShowChat} />

            {/* Offline warning banner */}
            {!isConnected && (
                <Box
                    sx={{
                        bgcolor: "rgba(245, 158, 11, 0.15)",
                        borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
                        py: 0.6,
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                    }}
                >
                    <WifiOffIcon sx={{ fontSize: 16, color: "#F59E0B" }} />
                    <Typography variant="caption" sx={{ color: "#F59E0B", fontWeight: 600 }}>
                        Reconnecting to live chat server... Messages will still send via HTTP fallback.
                    </Typography>
                </Box>
            )}

            {/* Main Chat Layout Container */}
            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* LEFT COLUMN: Conversations Sidebar */}
                <Box
                    sx={{
                        width: { xs: "100%", md: 380 },
                        bgcolor: BRAND_COLORS.surfaceDark,
                        borderRight: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        display: {
                            xs: mobileShowChat ? "none" : "flex",
                            md: "flex",
                        },
                        flexDirection: "column",
                        height: "100%",
                        zIndex: 1,
                    }}
                >
                    {/* Header & Search */}
                    <Box sx={{ p: 2.5, pb: 2, borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                                    Messages
                                </Typography>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Private chats with your matches
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    px: 1.2,
                                    py: 0.4,
                                    borderRadius: "12px",
                                    bgcolor: "rgba(253, 58, 115, 0.12)",
                                    border: "1px solid rgba(253, 58, 115, 0.25)",
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700, color: BRAND_COLORS.coralPink }}>
                                    {conversations.length} Active
                                </Typography>
                            </Box>
                        </Stack>

                        {/* Search Input */}
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search conversation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: BRAND_COLORS.textSecondary, fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "14px",
                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                    fontSize: "0.88rem",
                                    "& fieldset": { borderColor: BRAND_COLORS.surfaceDarkBorder },
                                    "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                                },
                            }}
                        />
                    </Box>

                    {/* Conversations List */}
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: "auto",
                            p: 1.5,
                            pb: { xs: 9, md: 1.5 },
                            "&::-webkit-scrollbar": { width: 5 },
                            "&::-webkit-scrollbar-thumb": {
                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                borderRadius: 4,
                            },
                        }}
                    >
                        {conversationsError && (
                            <Box
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: "14px",
                                    bgcolor: "rgba(239, 68, 68, 0.12)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.2,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: "#EF4444", fontWeight: 600 }}>
                                    {conversationsError}
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => loadConversations()}
                                    sx={{
                                        color: "#EF4444",
                                        borderColor: "#EF4444",
                                        borderRadius: "8px",
                                        alignSelf: "flex-start",
                                        "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
                                    }}
                                >
                                    Retry Connection
                                </Button>
                            </Box>
                        )}
                        {loadingConversations && (
                            <Box sx={{ p: 1.5 }}>
                                {[1, 2, 3, 4].map((n) => (
                                    <Box key={n} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                        <Skeleton variant="circular" width={52} height={52} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                                            <Skeleton variant="text" width="85%" height={18} sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {!loadingConversations && filteredConversations.length === 0 && (
                            <Box sx={{ p: 4, textAlign: "center", color: BRAND_COLORS.textSecondary }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(253, 58, 115, 0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                    }}
                                >
                                    <ForumIcon sx={{ fontSize: 32, color: BRAND_COLORS.coralPink }} />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#FFFFFF", mb: 0.5 }}>
                                    {searchTerm ? "No results found" : "No conversations yet"}
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 2.5, px: 2 }}>
                                    {searchTerm
                                        ? "Try searching for a different match name."
                                        : "Match with amazing people in Discovery to unlock private messaging!"}
                                </Typography>
                                {!searchTerm && (
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        onClick={() => navigate("/discovery")}
                                        startIcon={<SparklesIcon />}
                                        sx={{
                                            background: BRAND_COLORS.primaryGradient,
                                            borderRadius: "12px",
                                            boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                                        }}
                                    >
                                        Explore Discovery
                                    </Button>
                                )}
                            </Box>
                        )}

                        {!loadingConversations && filteredConversations.length > 0 && (
                            <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.8 }}>
                                {filteredConversations.map((conv) => {
                                    const other = conv.otherParticipant;
                                    if (!other) return null;
                                    const isSelected = activeConversation?._id === conv._id;
                                    const hasUnread = (conv.unreadCount || 0) > 0;

                                    return (
                                        <ListItem key={conv._id} disablePadding>
                                            <ListItemButton
                                                selected={isSelected}
                                                onClick={() => {
                                                    setActiveConversation(conv);
                                                    setMobileShowChat(true);
                                                }}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: "16px",
                                                    transition: "all 0.2s ease",
                                                    bgcolor: isSelected
                                                        ? "rgba(253, 58, 115, 0.12)"
                                                        : "transparent",
                                                    border: isSelected
                                                        ? `1px solid rgba(253, 58, 115, 0.35)`
                                                        : `1px solid transparent`,
                                                    "&:hover": {
                                                        bgcolor: isSelected
                                                            ? "rgba(253, 58, 115, 0.16)"
                                                            : "rgba(255, 255, 255, 0.04)",
                                                    },
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Badge
                                                        badgeContent={conv.unreadCount || 0}
                                                        color="error"
                                                        overlap="circular"
                                                        sx={{
                                                            "& .MuiBadge-badge": {
                                                                background: BRAND_COLORS.primaryGradient,
                                                                color: "#fff",
                                                                fontWeight: 800,
                                                                fontSize: "0.72rem",
                                                            },
                                                        }}
                                                    >
                                                        <Avatar
                                                            src={other.photos?.[0]}
                                                            alt={other.name}
                                                            sx={{
                                                                width: 52,
                                                                height: 52,
                                                                border: isSelected
                                                                    ? `2px solid ${BRAND_COLORS.coralPink}`
                                                                    : `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                                            }}
                                                        />
                                                    </Badge>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{
                                                                    fontWeight: hasUnread ? 800 : 600,
                                                                    color: isSelected ? "#FFFFFF" : hasUnread ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                                                    fontSize: "0.95rem",
                                                                }}
                                                            >
                                                                {other.name}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: hasUnread ? BRAND_COLORS.coralPink : BRAND_COLORS.textSecondary,
                                                                    fontWeight: hasUnread ? 700 : 400,
                                                                    fontSize: "0.72rem",
                                                                }}
                                                            >
                                                                {formatTime(conv.lastMessageAt)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography
                                                            variant="body2"
                                                            noWrap
                                                            sx={{
                                                                fontWeight: hasUnread ? 600 : 400,
                                                                color: hasUnread ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                                                fontSize: "0.84rem",
                                                            }}
                                                        >
                                                            {conv.lastMessage?.content || "Say hello! 👋"}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </Box>
                </Box>

                {/* RIGHT COLUMN: Active Chat Panel */}
                <Box
                    sx={{
                        flex: 1,
                        display: {
                            xs: mobileShowChat ? "flex" : "none",
                            md: "flex",
                        },
                        flexDirection: "column",
                        height: "100%",
                        bgcolor: BRAND_COLORS.backgroundDark,
                    }}
                >
                    {activeConversation && otherUser ? (
                        <>
                            {/* Chat Header */}
                            <Box
                                sx={{
                                    p: 1.8,
                                    px: { xs: 2, md: 3 },
                                    borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                }}
                            >
                                <Stack direction="row" spacing={{ xs: 1, sm: 1.8 }} alignItems="center" sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                                    {isMobile && (
                                        <IconButton
                                            edge="start"
                                            onClick={() => setMobileShowChat(false)}
                                            sx={{ color: "#FFFFFF", p: { xs: 0.5, sm: 1 } }}
                                        >
                                            <ArrowBackIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <Avatar
                                        src={otherUser.photos?.[0]}
                                        alt={otherUser.name}
                                        sx={{
                                            width: { xs: 38, sm: 46 },
                                            height: { xs: 38, sm: 46 },
                                            border: `2px solid ${BRAND_COLORS.coralPink}`,
                                        }}
                                    />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            variant="subtitle1"
                                            noWrap
                                            sx={{
                                                fontWeight: 800,
                                                color: "#FFFFFF",
                                                lineHeight: 1.2,
                                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                                maxWidth: { xs: 140, sm: 240, md: 360 },
                                            }}
                                        >
                                            {otherUser.name}
                                            {otherUser.age ? `, ${otherUser.age}` : ""}
                                        </Typography>
                                        <Typography variant="caption" noWrap sx={{ color: BRAND_COLORS.textSecondary, display: "block" }}>
                                            @{otherUser.username}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Start Random Video Match">
                                        <IconButton
                                            onClick={() => navigate("/random-video")}
                                            sx={{
                                                bgcolor: "rgba(139, 92, 246, 0.15)",
                                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                                color: BRAND_COLORS.violet,
                                                "&:hover": {
                                                    bgcolor: "rgba(139, 92, 246, 0.25)",
                                                },
                                            }}
                                        >
                                            <VideocamIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Box>

                            {/* Message History Stream */}
                            <Box
                                sx={{
                                    flex: 1,
                                    p: { xs: 2, md: 3 },
                                    overflowY: "auto",
                                    bgcolor: "#0A0C16",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                    "&::-webkit-scrollbar": { width: 6 },
                                    "&::-webkit-scrollbar-thumb": {
                                        bgcolor: "rgba(255, 255, 255, 0.1)",
                                        borderRadius: 4,
                                    },
                                }}
                            >
                                {loadingMessages && (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                        <CircularProgress size={32} sx={{ color: BRAND_COLORS.coralPink }} />
                                    </Box>
                                )}

                                {!loadingMessages && messages.length === 0 && (
                                    <Box
                                        sx={{
                                            m: "auto",
                                            textAlign: "center",
                                            p: 4,
                                            maxWidth: 380,
                                            bgcolor: BRAND_COLORS.surfaceDark,
                                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            borderRadius: "24px",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                                        }}
                                    >
                                        <Avatar
                                            src={otherUser.photos?.[0]}
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                mx: "auto",
                                                mb: 2,
                                                border: `3px solid ${BRAND_COLORS.coralPink}`,
                                                boxShadow: "0 0 25px rgba(253, 58, 115, 0.3)",
                                            }}
                                        />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                                            You and {otherUser.name} matched!
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mt: 1, mb: 3 }}>
                                            Don't wait for the right moment. Break the ice and send the first message!
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="medium"
                                            onClick={() => setInputText("Hey! How's your week going? 👋")}
                                            sx={{
                                                borderRadius: "9999px",
                                                color: BRAND_COLORS.coralPink,
                                                borderColor: BRAND_COLORS.coralPink,
                                                "&:hover": {
                                                    borderColor: BRAND_COLORS.sunsetOrange,
                                                    bgcolor: "rgba(253, 58, 115, 0.08)",
                                                },
                                            }}
                                        >
                                            "Hey! How's your week going? 👋"
                                        </Button>
                                    </Box>
                                )}

                                {!loadingMessages &&
                                    messages.map((msg, index) => {
                                        const senderId = msg.sender?._id || msg.sender;
                                        const isMine = senderId === userData?._id;
                                        const isRead = msg.readBy && msg.readBy.length > 1;

                                        return (
                                            <Box
                                                key={msg._id || index}
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: isMine ? "flex-end" : "flex-start",
                                                    maxWidth: "100%",
                                                }}
                                            >
                                                <Paper
                                                    elevation={2}
                                                    sx={{
                                                        p: 1.6,
                                                        px: 2.2,
                                                        borderRadius: "20px",
                                                        maxWidth: { xs: "84%", sm: "68%" },
                                                        background: isMine
                                                            ? BRAND_COLORS.primaryGradient
                                                            : BRAND_COLORS.surfaceDarkCard,
                                                        color: "#FFFFFF",
                                                        borderTopRightRadius: isMine ? "4px" : "20px",
                                                        borderTopLeftRadius: !isMine ? "4px" : "20px",
                                                        border: isMine ? "none" : `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                                        wordBreak: "break-word",
                                                        boxShadow: isMine
                                                            ? "0 4px 15px rgba(253, 58, 115, 0.25)"
                                                            : "0 4px 12px rgba(0,0,0,0.2)",
                                                    }}
                                                >
                                                    <Typography variant="body1" sx={{ fontSize: "0.95rem", lineHeight: 1.45, fontWeight: 400 }}>
                                                        {msg.content}
                                                    </Typography>
                                                </Paper>

                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    alignItems="center"
                                                    sx={{ mt: 0.4, px: 0.6 }}
                                                >
                                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.72rem" }}>
                                                        {formatTime(msg.createdAt)}
                                                    </Typography>
                                                    {isMine && (
                                                        isRead ? (
                                                            <DoneAllIcon sx={{ fontSize: 14, color: "#60A5FA" }} />
                                                        ) : (
                                                            <DoneIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }} />
                                                        )
                                                    )}
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Message Composer Input Area */}
                            <Box
                                component="form"
                                onSubmit={handleSendMessage}
                                sx={{
                                    p: { xs: 1.2, sm: 2 },
                                    borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: { xs: 1, sm: 1.5 },
                                }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Message ${otherUser.name}...`}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    inputProps={{ maxLength: 2000 }}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "9999px",
                                            bgcolor: "rgba(255, 255, 255, 0.05)",
                                            fontSize: "0.92rem",
                                            "& fieldset": { borderColor: BRAND_COLORS.surfaceDarkBorder },
                                            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                                        },
                                    }}
                                />
                                <IconButton
                                    type="submit"
                                    disabled={!inputText.trim() || sending}
                                    sx={{
                                        background: BRAND_COLORS.primaryGradient,
                                        color: "#ffffff",
                                        "&:hover": {
                                            opacity: 0.9,
                                        },
                                        "&.Mui-disabled": {
                                            bgcolor: "rgba(255, 255, 255, 0.06)",
                                            color: "rgba(255, 255, 255, 0.2)",
                                        },
                                        width: 44,
                                        height: 44,
                                        boxShadow: "0 4px 15px rgba(253, 58, 115, 0.3)",
                                    }}
                                >
                                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 3,
                                textAlign: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(253, 58, 115, 0.08)",
                                    border: "1px solid rgba(253, 58, 115, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2.5,
                                }}
                            >
                                <FavoriteIcon sx={{ fontSize: 40, color: BRAND_COLORS.coralPink }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 1 }}>
                                Select a conversation
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, maxWidth: 360 }}>
                                Choose a match from your list on the left to start exchanging messages.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default withAuth(ChatPage);
