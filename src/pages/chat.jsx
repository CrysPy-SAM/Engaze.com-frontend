import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import server from "../environment";
import "../App.css";
import {
    Avatar,
    Badge,
    Box,
    Button,
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VideocamIcon from "@mui/icons-material/Videocam";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DoneIcon from "@mui/icons-material/Done";
import WifiOffIcon from "@mui/icons-material/WifiOff";

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
        handleLogout,
    } = useContext(AuthContext);

    // State
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // Refs
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const activeConvRef = useRef(null);

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
            // Re-join active conversation room if reconnecting
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

        return () => {
            socket.disconnect();
        };
    }, [token, userData?._id]);

    // 2. Load conversations and handle query params (e.g. ?matchId=...)
    const loadConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const data = await getConversations();
            const convList = data?.conversations || [];
            setConversations(convList);

            // Check if URL has ?matchId=...
            const queryParams = new URLSearchParams(location.search);
            const matchId = queryParams.get("matchId");

            if (matchId) {
                const matchRes = await getOrCreateConversationByMatch(matchId);
                if (matchRes?.conversation) {
                    const targetConv = matchRes.conversation;
                    setActiveConversation(targetConv);
                    setMobileShowChat(true);

                    // If not in list, add it
                    if (!convList.some((c) => c._id === targetConv._id)) {
                        setConversations([targetConv, ...convList]);
                    }
                    return;
                }
            }

            // Check if URL has :conversationId
            if (paramConvId) {
                const target = convList.find((c) => c._id === paramConvId);
                if (target) {
                    setActiveConversation(target);
                    setMobileShowChat(true);
                    return;
                }
            }

            // Default to first conversation on desktop
            if (convList.length > 0 && !isMobile && !activeConvRef.current) {
                setActiveConversation(convList[0]);
            }
        } catch (err) {
            console.error("Failed to load conversations:", err);
        } finally {
            setLoadingConversations(false);
        }
    }, [getConversations, getOrCreateConversationByMatch, location.search, paramConvId, isMobile]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // 3. Load messages when activeConversation changes
    useEffect(() => {
        if (!activeConversation?._id) return;

        const convId = activeConversation._id;

        // Join room in socket
        if (socketRef.current?.connected) {
            socketRef.current.emit("chat:join", { conversationId: convId });
            socketRef.current.emit("chat:read", { conversationId: convId });
        }

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const data = await getConversationMessages(convId, 1, 50);
                if (data?.messages) {
                    setMessages(data.messages);
                    setTimeout(scrollToBottom, 100);
                }
                // Mark as read in DB and update local counter
                await markConversationRead(convId);
                setConversations((prev) =>
                    prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
                );
            } catch (err) {
                console.error("Failed to load messages:", err);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();
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
            // Send via Socket.io with acknowledgement
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
                // REST API Fallback
                const response = await fetch(`${server}/api/v1/conversations/${convId}/messages`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ content: trimmed, clientTempId }),
                });
                const resData = await response.json();
                setSending(false);

                if (resData.success && resData.message) {
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

    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f0f2f5" }}>
            {/* Top Navigation Bar */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: { xs: 2, md: 4 },
                    py: 1.5,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    zIndex: 10,
                }}
            >
                <Typography
                    variant="h6"
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
                    <WhatshotIcon sx={{ color: "#FF9839" }} /> ENGAZE.com
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
                        startIcon={<FavoriteIcon />}
                        onClick={() => navigate("/matches")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Matches
                    </Button>
                    <Button
                        startIcon={<VideocamIcon />}
                        onClick={() => navigate("/random-video")}
                        sx={{ color: "#FF9839", fontWeight: 700, textTransform: "none" }}
                    >
                        Video Match
                    </Button>
                    <IconButton title="Profile" onClick={() => navigate("/profile")} sx={{ color: "#555" }}>
                        <PersonIcon />
                    </IconButton>
                    <IconButton title="Home" onClick={() => navigate("/home")} sx={{ color: "#555" }}>
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

            {/* Offline warning banner */}
            {!isConnected && (
                <Box
                    sx={{
                        bgcolor: "#fff3e0",
                        py: 0.5,
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                    }}
                >
                    <WifiOffIcon sx={{ fontSize: 16, color: "#e65100" }} />
                    <Typography variant="caption" sx={{ color: "#e65100", fontWeight: 600 }}>
                        Reconnecting to live chat server... Messages will still send via HTTP fallback.
                    </Typography>
                </Box>
            )}

            {/* Main Chat Layout Container */}
            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* LEFT COLUMN: Conversations Sidebar */}
                <Box
                    sx={{
                        width: { xs: "100%", md: 360 },
                        bgcolor: "#ffffff",
                        borderRight: "1px solid #e0e0e0",
                        display: {
                            xs: mobileShowChat ? "none" : "flex",
                            md: "flex",
                        },
                        flexDirection: "column",
                        height: "100%",
                    }}
                >
                    <Box sx={{ p: 2, borderBottom: "1px solid #f0f0f0" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Conversations
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Private chats with your mutual matches
                        </Typography>
                    </Box>

                    {/* Conversations List */}
                    <Box sx={{ flex: 1, overflowY: "auto" }}>
                        {loadingConversations && (
                            <Box sx={{ p: 2 }}>
                                {[1, 2, 3].map((n) => (
                                    <Box key={n} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                        <Skeleton variant="circular" width={48} height={48} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="80%" />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {!loadingConversations && conversations.length === 0 && (
                            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                                <FavoriteIcon sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    No conversations yet
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                                    Match with someone in Discovery to start chatting!
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => navigate("/discovery")}
                                    sx={{ textTransform: "none", color: "#FF9839", borderColor: "#FF9839" }}
                                >
                                    Go to Discovery
                                </Button>
                            </Box>
                        )}

                        {!loadingConversations && conversations.length > 0 && (
                            <List sx={{ p: 0 }}>
                                {conversations.map((conv) => {
                                    const other = conv.otherParticipant;
                                    if (!other) return null;
                                    const isSelected = activeConversation?._id === conv._id;

                                    return (
                                        <ListItem key={conv._id} disablePadding divider>
                                            <ListItemButton
                                                selected={isSelected}
                                                onClick={() => {
                                                    setActiveConversation(conv);
                                                    setMobileShowChat(true);
                                                }}
                                                sx={{
                                                    py: 1.5,
                                                    "&.Mui-selected": {
                                                        bgcolor: "#fff3e0",
                                                        borderLeft: "4px solid #FF9839",
                                                    },
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Badge
                                                        badgeContent={conv.unreadCount || 0}
                                                        color="error"
                                                        overlap="circular"
                                                    >
                                                        <Avatar
                                                            src={other.photos?.[0]}
                                                            alt={other.name}
                                                            sx={{ width: 48, height: 48 }}
                                                        />
                                                    </Badge>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                {other.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatTime(conv.lastMessageAt)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            noWrap
                                                            sx={{
                                                                fontWeight: conv.unreadCount > 0 ? 600 : 400,
                                                                color: conv.unreadCount > 0 ? "#111" : "text.secondary",
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
                        bgcolor: "#ffffff",
                    }}
                >
                    {activeConversation && otherUser ? (
                        <>
                            {/* Chat Header */}
                            <Box
                                sx={{
                                    p: 1.5,
                                    px: 2,
                                    borderBottom: "1px solid #e0e0e0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    bgcolor: "#ffffff",
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    {isMobile && (
                                        <IconButton
                                            edge="start"
                                            onClick={() => setMobileShowChat(false)}
                                            sx={{ mr: 0.5 }}
                                        >
                                            <ArrowBackIcon />
                                        </IconButton>
                                    )}
                                    <Avatar
                                        src={otherUser.photos?.[0]}
                                        alt={otherUser.name}
                                        sx={{ width: 42, height: 42 }}
                                    />
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                            {otherUser.name}
                                            {otherUser.age ? `, ${otherUser.age}` : ""}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            @{otherUser.username}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Message History Stream */}
                            <Box
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    overflowY: "auto",
                                    bgcolor: "#fafafa",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                }}
                            >
                                {loadingMessages && (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                        <CircularProgress size={32} />
                                    </Box>
                                )}

                                {!loadingMessages && messages.length === 0 && (
                                    <Box
                                        sx={{
                                            m: "auto",
                                            textAlign: "center",
                                            p: 3,
                                            maxWidth: 320,
                                        }}
                                    >
                                        <Avatar
                                            src={otherUser.photos?.[0]}
                                            sx={{ width: 72, height: 72, mx: "auto", mb: 2 }}
                                        />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            You matched with {otherUser.name}!
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                                            Break the ice and send the first message.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setInputText("Hey! How's your week going? 👋")}
                                            sx={{ borderRadius: 4, textTransform: "none" }}
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
                                                    elevation={1}
                                                    sx={{
                                                        p: 1.5,
                                                        px: 2,
                                                        borderRadius: 3,
                                                        maxWidth: { xs: "82%", sm: "70%" },
                                                        bgcolor: isMine ? "#FF9839" : "#ffffff",
                                                        color: isMine ? "#ffffff" : "#222222",
                                                        borderTopRightRadius: isMine ? 2 : 12,
                                                        borderTopLeftRadius: !isMine ? 2 : 12,
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    <Typography variant="body1" sx={{ fontSize: "0.95rem" }}>
                                                        {msg.content}
                                                    </Typography>
                                                </Paper>

                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    alignItems="center"
                                                    sx={{ mt: 0.3, px: 0.5 }}
                                                >
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                                                        {formatTime(msg.createdAt)}
                                                    </Typography>
                                                    {isMine && (
                                                        isRead ? (
                                                            <DoneAllIcon sx={{ fontSize: 14, color: "#1976d2" }} />
                                                        ) : (
                                                            <DoneIcon sx={{ fontSize: 14, color: "#999999" }} />
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
                                    p: 1.5,
                                    borderTop: "1px solid #e0e0e0",
                                    bgcolor: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
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
                                            borderRadius: 4,
                                        },
                                    }}
                                />
                                <IconButton
                                    type="submit"
                                    color="primary"
                                    disabled={!inputText.trim() || sending}
                                    sx={{
                                        bgcolor: "#FF9839",
                                        color: "#ffffff",
                                        "&:hover": { bgcolor: "#e68933" },
                                        "&.Mui-disabled": { bgcolor: "#f0f0f0", color: "#bbb" },
                                        p: 1.2,
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
                                color: "text.secondary",
                                p: 3,
                            }}
                        >
                            <FavoriteIcon sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Select a conversation
                            </Typography>
                            <Typography variant="body2">
                                Choose someone from the list to start messaging.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default withAuth(ChatPage);
