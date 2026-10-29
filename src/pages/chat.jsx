import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import { useDirectCall } from "../contexts/DirectCallContext";
import server from "../environment";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import { formatLastSeen } from "../utils/presenceFormatters";
import "../App.css";
import {
    Avatar,
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
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
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VideocamIcon from "@mui/icons-material/Videocam";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DoneIcon from "@mui/icons-material/Done";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SearchIcon from "@mui/icons-material/Search";
import ForumIcon from "@mui/icons-material/Forum";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import BlockIcon from "@mui/icons-material/Block";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import SafetyActionModal from "../components/SafetyActionModal";
import {
    reconcileSingleMessage,
    reconcileBatchMessages,
    isStaleConversationResponse,
    isOutgoingMessage,
    normalizeEntityId,
} from "../utils/chatHelpers";

// Quick photo presets for engaging conversation
const PHOTO_PRESETS = [
    {
        title: "Coffee Date ☕",
        url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=700&auto=format&fit=crop&q=80",
    },
    {
        title: "Sunset Beach 🌅",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80",
    },
    {
        title: "City Lights 🌃",
        url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=700&auto=format&fit=crop&q=80",
    },
    {
        title: "Cozy Books & Tea 📖",
        url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=700&auto=format&fit=crop&q=80",
    },
];

const QUICK_EMOJIS = ["❤️", "🔥", "😍", "✨", "👋", "🥂", "☕", "🎉", "💃", "🥳", "💖", "🌸"];

const ICEBREAKERS = [
    "What's your go-to comfort food on a rainy evening? 🌧️🍜",
    "If you could teleport to any city right now, where would you go? ✈️",
    "Two truths and a lie: what are yours? 😉",
    "Mountains or beach vacation? 🏔️🏖️",
];

function isImageContent(text) {
    if (!text || typeof text !== "string") return false;
    if (text.startsWith("[image:")) return true;
    if (
        (text.startsWith("http://") || text.startsWith("https://")) &&
        (text.match(/\.(jpeg|jpg|gif|png|webp)/i) ||
            text.includes("images.unsplash.com") ||
            text.includes("res.cloudinary.com"))
    ) {
        return true;
    }
    return false;
}

function extractImageUrl(text) {
    if (!text) return "";
    if (text.startsWith("[image:") && text.endsWith("]")) {
        return text.slice(7, -1).trim();
    }
    return text.trim();
}



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
        blockUser,
        reportUser,
        unmatchUser,
    } = useContext(AuthContext);

    const { initiateDirectCall } = useDirectCall();

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
    const [connectionStatus, setConnectionStatus] = useState("connecting"); // "connecting" | "connected" | "reconnecting" | "offline"
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // Interactive Extras
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [customImageUrl, setCustomImageUrl] = useState("");
    const [safetyModalOpen, setSafetyModalOpen] = useState(false);
    const [safetyActionType, setSafetyActionType] = useState("report");
    const [previewImage, setPreviewImage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [messageReactions, setMessageReactions] = useState({});
    const [partnerTyping, setPartnerTyping] = useState(false);

    // Refs
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const activeConvRef = useRef(null);
    const messagesRef = useRef(messages);
    const pendingTimeoutsRef = useRef({});
    const loadConversationsRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const lastTypingEmitRef = useRef(0);

    // Keep activeConvRef and messagesRef in sync for callbacks
    useEffect(() => {
        activeConvRef.current = activeConversation;
    }, [activeConversation]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Missed message recovery using cursor after reconnect
    const recoverMissedMessages = useCallback(async (convId) => {
        if (!convId || isStaleConversationResponse(activeConvRef.current?._id, convId)) return;

        // Find the latest message that has a persisted MongoDB _id
        const currentMessages = messagesRef.current;
        let lastPersistedId = null;
        for (let i = currentMessages.length - 1; i >= 0; i--) {
            const msg = currentMessages[i];
            if (msg._id && typeof msg._id === "string" && !msg._id.startsWith("temp_")) {
                lastPersistedId = msg._id;
                break;
            }
        }

        try {
            let missed = [];
            if (lastPersistedId) {
                const res = await getConversationMessages(convId, 1, 50, lastPersistedId);
                if (res?.messages) {
                    missed = res.messages;
                }
            } else {
                const res = await getConversationMessages(convId, 1, 50);
                if (res?.messages) {
                    missed = res.messages;
                }
            }

            // Verify conversation hasn't changed while request was in-flight
            if (isStaleConversationResponse(activeConvRef.current?._id, convId)) return;

            if (missed.length > 0) {
                setMessages((prev) => reconcileBatchMessages(prev, missed));
                setTimeout(scrollToBottom, 50);

                // If any missed message is from partner, send read receipt
                const hasPartnerMsg = missed.some(
                    (m) => !isOutgoingMessage(m, userData?._id)
                );
                if (hasPartnerMsg) {
                    if (socketRef.current?.connected) {
                        socketRef.current.emit("chat:read", { conversationId: convId });
                    }
                    markConversationRead(convId).catch(() => {});
                }
            }
        } catch (err) {
            console.error("Failed to recover missed messages:", err);
        }
    }, [getConversationMessages, markConversationRead, userData?._id]);

    // 1. Initialize Socket.io connection with JWT auth
    useEffect(() => {
        if (!token) return;

        const socket = io(server, {
            auth: { token: localStorage.getItem("token") || token },
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 15000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setConnectionStatus("connected");
            const activeConv = activeConvRef.current;
            if (activeConv?._id) {
                socket.emit("chat:join", { conversationId: activeConv._id });
                socket.emit("chat:read", { conversationId: activeConv._id });
                recoverMissedMessages(activeConv._id);
            }
        });

        socket.on("disconnect", (reason) => {
            if (reason === "io client disconnect") {
                setConnectionStatus("offline");
            } else {
                setConnectionStatus("reconnecting");
            }
        });

        socket.on("connect_error", (error) => {
            console.warn("Chat socket connection error:", error.message);
            setConnectionStatus("reconnecting");
            const freshToken = localStorage.getItem("token");
            if (freshToken) {
                socket.auth = { token: freshToken };
            }
        });

        socket.io.on("reconnect_attempt", () => {
            setConnectionStatus("reconnecting");
            const freshToken = localStorage.getItem("token");
            if (freshToken) {
                socket.auth = { token: freshToken };
            }
        });

        socket.io.on("reconnect", () => {
            setConnectionStatus("connected");
            const activeConv = activeConvRef.current;
            if (activeConv?._id) {
                socket.emit("chat:join", { conversationId: activeConv._id });
                socket.emit("chat:read", { conversationId: activeConv._id });
                recoverMissedMessages(activeConv._id);
            }
        });

        socket.io.on("reconnect_failed", () => {
            setConnectionStatus("offline");
        });

        // Incoming real-time message handler
        socket.on("chat:new-message", (newMsg) => {
            const currentConv = activeConvRef.current;

            if (currentConv && currentConv._id.toString() === newMsg.conversation.toString()) {
                setMessages((prev) => reconcileSingleMessage(prev, newMsg));
                scrollToBottom();

                // If message from the other person, send read event
                if (!isOutgoingMessage(newMsg, userData?._id)) {
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
                                : (conv.unreadCount || 0) + (!isOutgoingMessage(newMsg, userData?._id) ? 1 : 0),
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
            if (activeConvRef.current?._id?.toString() === conversationId?.toString()) {
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

        // Real-time partner typing indicator
        socket.on("chat:typing", ({ conversationId, userId, isTyping }) => {
            if (activeConvRef.current?._id?.toString() === conversationId?.toString() && normalizeEntityId(userId) !== normalizeEntityId(userData?._id)) {
                setPartnerTyping(Boolean(isTyping));
                if (isTyping) {
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setPartnerTyping(false);
                    }, 3000);
                }
            }
        });

        // Real-time mutual match handler
        socket.on("match:new", () => {
            if (loadConversationsRef.current) {
                loadConversationsRef.current();
            }
        });

        // Real-time WhatsApp-style presence & last-seen updates
        socket.on("presence:update", ({ userId, isOnline, lastSeenAt }) => {
            if (!userId) return;
            const uid = userId.toString();

            setConversations((prev) =>
                prev.map((c) => {
                    const pId = c.otherParticipant?._id?.toString() || c.otherParticipant?.id?.toString();
                    if (pId === uid) {
                        return {
                            ...c,
                            otherParticipant: {
                                ...c.otherParticipant,
                                isOnline: Boolean(isOnline),
                                lastSeenAt: lastSeenAt !== undefined ? lastSeenAt : c.otherParticipant.lastSeenAt,
                            },
                        };
                    }
                    return c;
                })
            );

            setActiveConversation((prev) => {
                const pId = prev?.otherParticipant?._id?.toString() || prev?.otherParticipant?.id?.toString();
                if (pId === uid) {
                    return {
                        ...prev,
                        otherParticipant: {
                            ...prev.otherParticipant,
                            isOnline: Boolean(isOnline),
                            lastSeenAt: lastSeenAt !== undefined ? lastSeenAt : prev.otherParticipant?.lastSeenAt,
                        },
                    };
                }
                return prev;
            });
        });

        // Real-time unmatch notification
        socket.on("match:unmatched", ({ matchId }) => {
            const currentConv = activeConvRef.current;
            const currentMatchId = currentConv?.match?._id?.toString() || currentConv?.match?.toString();
            if (currentMatchId && matchId && currentMatchId === matchId.toString()) {
                setActiveConversation(null);
                setMobileShowChat(false);
            }
            if (loadConversationsRef.current) {
                loadConversationsRef.current();
            }
        });

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            Object.values(pendingTimeoutsRef.current).forEach(clearTimeout);
            pendingTimeoutsRef.current = {};
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [token, userData?._id, recoverMissedMessages]);

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
        setPartnerTyping(false);

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
                if (!isCancelled && data?.messages && !isStaleConversationResponse(activeConvRef.current?._id, convId)) {
                    setMessages((prev) => reconcileBatchMessages(prev, data.messages));
                    setTimeout(scrollToBottom, 100);
                }
                if (!isCancelled && !isStaleConversationResponse(activeConvRef.current?._id, convId)) {
                    await markConversationRead(convId);
                    setConversations((prev) =>
                        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
                    );
                }
            } catch (err) {
                if (!isCancelled && !isStaleConversationResponse(activeConvRef.current?._id, convId)) {
                    console.error("Failed to load messages:", err);
                }
            } finally {
                if (!isCancelled && !isStaleConversationResponse(activeConvRef.current?._id, convId)) {
                    setLoadingMessages(false);
                }
            }
        };

        fetchMessages();

        return () => {
            isCancelled = true;
        };
    }, [activeConversation?._id, getConversationMessages, markConversationRead]);

    const ACK_TIMEOUT_MS = 5000;
    const MAX_AUTO_RETRIES = 1;

    // Execute message send with bounded retry and ack timeout
    const executeSend = useCallback(
        async (msgToProcess, autoRetryCount = 0) => {
            const { conversation: convId, content, clientTempId } = msgToProcess;
            if (!convId || !clientTempId) return;

            // Clear any previous timer for this clientTempId
            if (pendingTimeoutsRef.current[clientTempId]) {
                clearTimeout(pendingTimeoutsRef.current[clientTempId]);
                delete pendingTimeoutsRef.current[clientTempId];
            }

            const sendViaRest = autoRetryCount > 0 || !socketRef.current?.connected;

            if (!sendViaRest) {
                let ackHandled = false;

                // Set 5-second timeout for socket ack
                pendingTimeoutsRef.current[clientTempId] = setTimeout(async () => {
                    if (ackHandled) return;
                    delete pendingTimeoutsRef.current[clientTempId];

                    if (autoRetryCount < MAX_AUTO_RETRIES) {
                        console.warn(`Socket ack timeout for ${clientTempId}. Attempting auto-retry via REST...`);
                        executeSend(msgToProcess, autoRetryCount + 1);
                    } else {
                        if (activeConvRef.current?._id?.toString() === convId.toString()) {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.clientTempId === clientTempId ? { ...m, status: "failed" } : m
                                )
                            );
                        }
                        setSending(false);
                    }
                }, ACK_TIMEOUT_MS);

                try {
                    socketRef.current.emit(
                        "chat:send",
                        {
                            conversationId: convId,
                            content,
                            clientTempId,
                        },
                        (response) => {
                            ackHandled = true;
                            if (pendingTimeoutsRef.current[clientTempId]) {
                                clearTimeout(pendingTimeoutsRef.current[clientTempId]);
                                delete pendingTimeoutsRef.current[clientTempId];
                            }
                            setSending(false);

                            if (response?.success && response.message) {
                                if (activeConvRef.current?._id?.toString() === convId.toString()) {
                                    setMessages((prev) => reconcileSingleMessage(prev, response.message));
                                }
                                setConversations((prevConvs) =>
                                    prevConvs.map((conv) => {
                                        if (conv._id.toString() === convId.toString()) {
                                            return {
                                                ...conv,
                                                lastMessage: response.message,
                                                lastMessageAt: response.message.createdAt || new Date().toISOString(),
                                            };
                                        }
                                        return conv;
                                    })
                                );
                            } else {
                                if (activeConvRef.current?._id?.toString() === convId.toString()) {
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.clientTempId === clientTempId ? { ...m, status: "failed" } : m
                                        )
                                    );
                                }
                            }
                        }
                    );
                } catch (emitErr) {
                    console.error("Socket emit failed:", emitErr);
                    if (autoRetryCount < MAX_AUTO_RETRIES) {
                        executeSend(msgToProcess, autoRetryCount + 1);
                    } else {
                        if (activeConvRef.current?._id?.toString() === convId.toString()) {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.clientTempId === clientTempId ? { ...m, status: "failed" } : m
                                )
                            );
                        }
                        setSending(false);
                    }
                }
            } else {
                // Socket disconnected or retry after socket ack timeout: send via REST fallback directly
                try {
                    const resData = await sendMessageRest(convId, content, clientTempId);
                    setSending(false);

                    if (resData?.success && resData.message) {
                        if (activeConvRef.current?._id?.toString() === convId.toString()) {
                            setMessages((prev) => reconcileSingleMessage(prev, resData.message));
                        }
                        setConversations((prevConvs) =>
                            prevConvs.map((conv) => {
                                if (conv._id.toString() === convId.toString()) {
                                    return {
                                        ...conv,
                                        lastMessage: resData.message,
                                        lastMessageAt: resData.message.createdAt || new Date().toISOString(),
                                    };
                                }
                                return conv;
                            })
                        );
                    } else {
                        if (activeConvRef.current?._id?.toString() === convId.toString()) {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.clientTempId === clientTempId ? { ...m, status: "failed" } : m
                                )
                            );
                        }
                    }
                } catch (restErr) {
                    console.error("REST send failed:", restErr);
                    setSending(false);
                    if (activeConvRef.current?._id?.toString() === convId.toString()) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.clientTempId === clientTempId ? { ...m, status: "failed" } : m
                            )
                        );
                    }
                }
            }
        },
        [sendMessageRest]
    );

    // 4. Send Message Handler
    const handleSendMessage = async (textToSend) => {
        const text = typeof textToSend === "string" ? textToSend : inputText;
        const trimmed = text.trim();
        if (!trimmed || !activeConversation) return;

        const convId = activeConversation._id;
        const clientTempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setInputText("");
        setShowEmojiPicker(false);
        setSending(true);

        const currentUserId = normalizeEntityId(userData?._id) || (userData?._id ? String(userData._id) : "");
        const optimisticMessage = {
            _id: clientTempId,
            clientTempId,
            conversation: convId,
            sender: {
                _id: currentUserId,
                name: userData?.name || "Me",
                photos: Array.isArray(userData?.photos) ? userData.photos : [],
            },
            content: trimmed,
            createdAt: new Date().toISOString(),
            readBy: currentUserId ? [currentUserId] : [],
            status: "pending",
        };

        // Optimistically add to UI
        setMessages((prev) => [...prev, optimisticMessage]);
        setTimeout(scrollToBottom, 50);

        executeSend(optimisticMessage, 0);
    };

    // Manual Retry Handler for failed messages
    const handleRetryMessage = (failedMsg) => {
        if (!failedMsg || !failedMsg.clientTempId) return;

        // Reset status to pending in UI
        setMessages((prev) =>
            prev.map((m) =>
                m.clientTempId === failedMsg.clientTempId ? { ...m, status: "pending" } : m
            )
        );
        setSending(true);

        // Retry with the exact same clientTempId to reuse server-side idempotency
        executeSend(failedMsg, 0);
    };

    const handleSendPhoto = (photoUrl) => {
        if (!photoUrl) return;
        const formatted = `[image:${photoUrl}]`;
        handleSendMessage(formatted);
        setShowMediaModal(false);
        setCustomImageUrl("");
    };

    const toggleHeartReaction = (msgId) => {
        setMessageReactions((prev) => ({
            ...prev,
            [msgId]: !prev[msgId],
        }));
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
        const term = searchTerm.toLowerCase();
        return name.includes(term);
    });

    const handleOpenMenu = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

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
            {/* Unified Brand Navigation - Hidden on mobile if actively in 1-on-1 chat to ensure edge-to-edge view */}
            <Navbar hideBottomNav={isMobile && mobileShowChat} hideTopNav={isMobile && mobileShowChat} />

            {/* Live Chat Connection Status Banner (Only visible on genuine disconnection/reconnection) */}
            {(connectionStatus === "reconnecting" || connectionStatus === "offline") && (
                <Box
                    sx={{
                        bgcolor: connectionStatus === "offline" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        borderBottom: `1px solid ${connectionStatus === "offline" ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                        py: 0.6,
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        zIndex: 10,
                    }}
                >
                    <WifiOffIcon sx={{ fontSize: 16, color: connectionStatus === "offline" ? "#EF4444" : "#F59E0B" }} />
                    <Typography variant="caption" sx={{ color: connectionStatus === "offline" ? "#EF4444" : "#F59E0B", fontWeight: 600 }}>
                        {connectionStatus === "offline"
                            ? "Live chat server unavailable. Messages will send via HTTP fallback."
                            : "Reconnecting to live chat server... Messages will still send via HTTP fallback."}
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
                                <Typography variant="h6" sx={{ fontWeight: 800, color: BRAND_COLORS.deepNavy, letterSpacing: "-0.01em" }}>
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
                                    bgcolor: "rgba(37, 137, 216, 0.1)",
                                    border: "1px solid rgba(37, 137, 216, 0.25)",
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700, color: BRAND_COLORS.brandBlue }}>
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
                                    bgcolor: "#142034",
                                    color: "#F8FAFC",
                                    fontSize: "0.88rem",
                                    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
                                    "&:hover fieldset": { borderColor: "rgba(37, 137, 216, 0.4)" },
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

                        {!loadingConversations && conversationsError && (
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

                        {!loadingConversations && !conversationsError && filteredConversations.length === 0 && (
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
                                    const lastMsgContent = conv.lastMessage?.content || "";
                                    const snippet = isImageContent(lastMsgContent)
                                        ? "📷 Sent a photo"
                                        : lastMsgContent || "Say hello! 👋";

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
                                                    bgcolor: isSelected ? "rgba(37, 137, 216, 0.16)" : "transparent",
                                                    border: isSelected ? "1px solid rgba(37, 137, 216, 0.4)" : "1px solid transparent",
                                                    "&:hover": {
                                                        bgcolor: isSelected ? "rgba(37, 137, 216, 0.22)" : "rgba(255, 255, 255, 0.04)",
                                                    },
                                                }}
                                            >
                                                <ListItemAvatar sx={{ position: "relative" }}>
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
                                                                border: isSelected ? "2px solid #2589D8" : "1px solid rgba(20, 43, 69, 0.08)",
                                                            }}
                                                        />
                                                    </Badge>
                                                    {Boolean(other.isOnline) && <Box className="online-indicator-dot" />}
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    sx={{
                                                                        fontWeight: hasUnread ? 800 : 600,
                                                                        color: isSelected ? BRAND_COLORS.deepNavy : hasUnread ? BRAND_COLORS.deepNavy : BRAND_COLORS.textSecondary,
                                                                        fontSize: "0.95rem",
                                                                    }}
                                                                >
                                                                    {other.name}
                                                                </Typography>
                                                            </Stack>
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
                                                                color: hasUnread ? BRAND_COLORS.deepNavy : BRAND_COLORS.textSecondary,
                                                                fontSize: "0.84rem",
                                                            }}
                                                        >
                                                            {snippet}
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

                {/* RIGHT COLUMN: Active Chat Panel (Screen 4 Tinder-Style) */}
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
                            {/* Screen 4 Top Header */}
                            <Box
                                sx={{
                                    p: 1.6,
                                    px: { xs: 2, md: 3 },
                                    borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    zIndex: 2,
                                }}
                            >
                                <Stack direction="row" spacing={{ xs: 1.2, sm: 1.8 }} alignItems="center" sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                                    {isMobile && (
                                        <IconButton
                                            edge="start"
                                            onClick={() => setMobileShowChat(false)}
                                            sx={{
                                                color: "#F8FAFC",
                                                p: 0.8,
                                                bgcolor: "rgba(255, 255, 255, 0.06)",
                                                "&:hover": { bgcolor: "rgba(37, 137, 216, 0.15)" },
                                            }}
                                        >
                                            <ArrowBackIcon fontSize="small" />
                                        </IconButton>
                                    )}

                                    {/* Partner Avatar with Online Indicator */}
                                    <Box
                                        onClick={() => setShowProfileModal(true)}
                                        sx={{ position: "relative", cursor: "pointer" }}
                                    >
                                        <Avatar
                                            src={otherUser.photos?.[0]}
                                            alt={otherUser.name}
                                            sx={{
                                                width: { xs: 44, sm: 48 },
                                                height: { xs: 44, sm: 48 },
                                                border: "2px solid #2589D8",
                                                boxShadow: "0 2px 10px rgba(37, 137, 216, 0.25)",
                                            }}
                                        />
                                        {Boolean(otherUser.isOnline) && <Box className="online-indicator-dot" />}
                                    </Box>

                                    {/* Partner Name, Verified Badge & Online Status */}
                                    <Box
                                        onClick={() => setShowProfileModal(true)}
                                        sx={{ minWidth: 0, flex: 1, cursor: "pointer" }}
                                    >
                                        <Stack direction="row" spacing={0.6} alignItems="center">
                                            <Typography
                                                variant="subtitle1"
                                                noWrap
                                                sx={{
                                                    fontWeight: 800,
                                                    color: BRAND_COLORS.deepNavy,
                                                    lineHeight: 1.2,
                                                    fontSize: { xs: "0.96rem", sm: "1.08rem" },
                                                    maxWidth: { xs: 160, sm: 280, md: 400 },
                                                }}
                                            >
                                                {otherUser.name}{otherUser.age ? `, ${otherUser.age}` : ""}
                                            </Typography>
                                        </Stack>
                                        {Boolean(otherUser.isOnline) ? (
                                            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.2 }}>
                                                <Box
                                                    sx={{
                                                        width: 7,
                                                        height: 7,
                                                        borderRadius: "50%",
                                                        bgcolor: BRAND_COLORS.emerald,
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: BRAND_COLORS.emerald,
                                                        fontWeight: 600,
                                                        fontSize: "0.74rem",
                                                    }}
                                                >
                                                    Online
                                                </Typography>
                                            </Stack>
                                        ) : otherUser.lastSeenAt ? (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: BRAND_COLORS.textMuted,
                                                    fontWeight: 500,
                                                    fontSize: "0.74rem",
                                                    mt: 0.2,
                                                }}
                                            >
                                                {formatLastSeen(otherUser.lastSeenAt)}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                </Stack>

                                {/* Screen 4 Top Header Actions (Video Call + Options) */}
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Tooltip title={`Start Video Call with ${otherUser.name}`}>
                                        <IconButton
                                            onClick={() => setShowVideoModal(true)}
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                bgcolor: BRAND_COLORS.brandBlue,
                                                border: "none",
                                                color: "#FFFFFF",
                                                boxShadow: "0 4px 14px rgba(37, 137, 216, 0.3)",
                                                transition: "all 0.2s ease",
                                                "&:hover": {
                                                    bgcolor: BRAND_COLORS.brandBlueHover,
                                                    boxShadow: "0 6px 18px rgba(37, 137, 216, 0.4)",
                                                    transform: "translateY(-1px)",
                                                },
                                            }}
                                        >
                                            <VideocamIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>

                                    <IconButton
                                        onClick={handleOpenMenu}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            color: BRAND_COLORS.deepNavy,
                                            bgcolor: "rgba(20, 43, 69, 0.04)",
                                            "&:hover": { bgcolor: "rgba(37, 137, 216, 0.08)", color: BRAND_COLORS.brandBlue },
                                        }}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Box>

                            {/* Message History Stream */}
                            <Box
                                sx={{
                                    flex: 1,
                                    p: { xs: 2, md: 3 },
                                    overflowY: "auto",
                                    bgcolor: "#0A111C",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.6,
                                    "&::-webkit-scrollbar": { width: 6 },
                                    "&::-webkit-scrollbar-thumb": {
                                        bgcolor: "rgba(255, 255, 255, 0.1)",
                                        borderRadius: 4,
                                    },
                                }}
                            >
                                {/* Centered Date Chip Pill */}
                                <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: "9999px",
                                            bgcolor: "#121C2D",
                                            border: "1px solid rgba(255, 255, 255, 0.08)",
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                                            color: BRAND_COLORS.textSecondary,
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            letterSpacing: "0.04em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Today
                                    </Box>
                                </Box>

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
                                            p: 3.5,
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
                                                width: 82,
                                                height: 82,
                                                mx: "auto",
                                                mb: 2,
                                                border: `3px solid ${BRAND_COLORS.coralPink}`,
                                                boxShadow: "0 0 25px rgba(253, 58, 115, 0.35)",
                                            }}
                                        />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                                            You and {otherUser.name} matched! 🎉
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mt: 1, mb: 3 }}>
                                            Say something nice or send an icebreaker to spark the connection.
                                        </Typography>
                                        <Stack spacing={1}>
                                            {ICEBREAKERS.slice(0, 2).map((ib, i) => (
                                                <Button
                                                    key={i}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleSendMessage(ib)}
                                                    sx={{
                                                        borderRadius: "9999px",
                                                        color: "#FFFFFF",
                                                        borderColor: "rgba(253, 58, 115, 0.4)",
                                                        textTransform: "none",
                                                        fontSize: "0.82rem",
                                                        py: 0.8,
                                                        "&:hover": {
                                                            borderColor: BRAND_COLORS.coralPink,
                                                            bgcolor: "rgba(253, 58, 115, 0.1)",
                                                        },
                                                    }}
                                                >
                                                    {ib}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {!loadingMessages &&
                                    messages.map((msg, index) => {
                                        const isMine = isOutgoingMessage(msg, userData?._id);
                                        const isRead = msg.readBy && msg.readBy.length > 1;
                                        const isImg = isImageContent(msg.content);
                                        const imgUrl = isImg ? extractImageUrl(msg.content) : null;
                                        const isHearted = messageReactions[msg._id];

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
                                                {isImg ? (
                                                    /* Photo Card Message (Screen 4 style) */
                                                    <Box
                                                        sx={{
                                                            position: "relative",
                                                            borderRadius: "18px",
                                                            overflow: "hidden",
                                                            border: "1px solid rgba(255, 255, 255, 0.12)",
                                                            maxWidth: { xs: 240, sm: 290 },
                                                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() => setPreviewImage(imgUrl)}
                                                    >
                                                        <Box
                                                            component="img"
                                                            src={imgUrl}
                                                            alt="Shared in chat"
                                                            sx={{
                                                                width: "100%",
                                                                maxHeight: 280,
                                                                objectFit: "cover",
                                                                display: "block",
                                                                borderRadius: "18px",
                                                            }}
                                                        />
                                                        {/* Heart Reaction Badge */}
                                                        <Box
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleHeartReaction(msg._id);
                                                            }}
                                                            sx={{
                                                                position: "absolute",
                                                                bottom: 8,
                                                                right: 8,
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: "50%",
                                                                bgcolor: "rgba(11, 13, 23, 0.8)",
                                                                backdropFilter: "blur(6px)",
                                                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                transition: "transform 0.15s ease",
                                                                "&:hover": { transform: "scale(1.15)" },
                                                            }}
                                                        >
                                                            <span style={{ fontSize: "16px" }}>❤️</span>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    /* Text Message Bubble (Screen 4 style) */
                                                    <Box
                                                        sx={{
                                                            position: "relative",
                                                            maxWidth: { xs: "84%", sm: "68%" },
                                                        }}
                                                    >
                                                        <Paper
                                                            elevation={0}
                                                            onDoubleClick={() => toggleHeartReaction(msg._id)}
                                                            sx={{
                                                                p: 1.6,
                                                                px: 2.2,
                                                                borderRadius: "20px",
                                                                bgcolor: isMine ? BRAND_COLORS.brandBlue : "#18253A",
                                                                color: isMine ? "#FFFFFF" : "#F8FAFC",
                                                                borderTopRightRadius: isMine ? "4px" : "20px",
                                                                borderTopLeftRadius: !isMine ? "4px" : "20px",
                                                                border: isMine ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                                                                boxShadow: isMine ? "0 4px 14px rgba(37, 137, 216, 0.35)" : "0 4px 16px rgba(0, 0, 0, 0.25)",
                                                                wordBreak: "break-word",
                                                            }}
                                                        >
                                                            <Typography variant="body1" sx={{ fontSize: "0.95rem", lineHeight: 1.45, fontWeight: 400 }}>
                                                                {msg.content}
                                                            </Typography>
                                                        </Paper>

                                                        {/* Heart Reaction pill if reacted */}
                                                        {isHearted && (
                                                            <Box
                                                                onClick={() => toggleHeartReaction(msg._id)}
                                                                sx={{
                                                                    position: "absolute",
                                                                    bottom: -10,
                                                                    right: isMine ? 4 : "auto",
                                                                    left: !isMine ? 4 : "auto",
                                                                    px: 0.8,
                                                                    py: 0.2,
                                                                    borderRadius: "9999px",
                                                                    bgcolor: "#1E202C",
                                                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                                                    fontSize: "0.75rem",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 0.3,
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                                                    zIndex: 1,
                                                                }}
                                                            >
                                                                <span>❤️</span>
                                                                <span style={{ fontSize: "0.68rem", color: "#FFFFFF", fontWeight: 700 }}>1</span>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}

                                                {/* Timestamp & Status Icon */}
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    alignItems="center"
                                                    sx={{ mt: isHearted ? 1.2 : 0.4, px: 0.6 }}
                                                >
                                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.72rem" }}>
                                                        {formatTime(msg.createdAt)}
                                                    </Typography>
                                                    {isMine && (
                                                        msg.status === "failed" ? (
                                                            <Box
                                                                component="span"
                                                                onClick={() => handleRetryMessage(msg)}
                                                                sx={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: 0.4,
                                                                    color: "#F87171",
                                                                    cursor: "pointer",
                                                                    fontSize: "0.72rem",
                                                                    fontWeight: 700,
                                                                    "&:hover": { textDecoration: "underline" },
                                                                }}
                                                            >
                                                                <span>⚠️ Failed.</span>
                                                                <span>Retry</span>
                                                            </Box>
                                                        ) : msg.status === "pending" ? (
                                                            <CircularProgress size={10} sx={{ color: "rgba(255,255,255,0.5)", ml: 0.3 }} />
                                                        ) : isRead ? (
                                                            <DoneAllIcon sx={{ fontSize: 14, color: "#60A5FA" }} />
                                                        ) : (
                                                            <DoneIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }} />
                                                        )
                                                    )}
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Emoji Quick Tray (collapsible) */}
                            {showEmojiPicker && (
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.2,
                                        overflowX: "auto",
                                    }}
                                >
                                    {QUICK_EMOJIS.map((emoji) => (
                                        <Box
                                            key={emoji}
                                            onClick={() => setInputText((prev) => prev + emoji)}
                                            sx={{
                                                fontSize: "1.35rem",
                                                cursor: "pointer",
                                                px: 0.8,
                                                py: 0.4,
                                                borderRadius: "10px",
                                                transition: "all 0.15s ease",
                                                "&:hover": {
                                                    bgcolor: "rgba(255, 255, 255, 0.1)",
                                                    transform: "scale(1.2)",
                                                },
                                            }}
                                        >
                                            {emoji}
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Typing Indicator Banner */}
                            {partnerTyping && (
                                <Box sx={{ px: 2, py: 0.6, bgcolor: "rgba(255, 255, 255, 0.03)", borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            bgcolor: BRAND_COLORS.coralPink,
                                            animation: "pulse 1.5s infinite",
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic", fontSize: "0.75rem" }}>
                                        {activeConversation?.otherParticipant?.name || "Partner"} is typing...
                                    </Typography>
                                </Box>
                            )}

                            {/* Screen 4 Bottom Input Dock */}
                            <Box
                                component="form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                sx={{
                                    p: { xs: 1.2, sm: 1.8 },
                                    borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: { xs: 0.8, sm: 1.2 },
                                }}
                            >
                                {/* Plus (+) Attachment Button */}
                                <IconButton
                                    onClick={() => setShowMediaModal(true)}
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(255, 255, 255, 0.06)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        color: "#F8FAFC",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            bgcolor: "rgba(37, 137, 216, 0.15)",
                                            borderColor: BRAND_COLORS.brandBlue,
                                            transform: "rotate(90deg)",
                                        },
                                    }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>

                                {/* Message Input Pill */}
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={(e) => {
                                        setInputText(e.target.value);
                                        const now = Date.now();
                                        if (socketRef.current?.connected && activeConversation?._id && now - lastTypingEmitRef.current > 1500) {
                                            lastTypingEmitRef.current = now;
                                            socketRef.current.emit("chat:typing", {
                                                conversationId: activeConversation._id,
                                                isTyping: true,
                                            });
                                        }
                                    }}
                                    inputProps={{ maxLength: 2000 }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                                                    sx={{
                                                        color: showEmojiPicker ? BRAND_COLORS.brandBlue : BRAND_COLORS.textSecondary,
                                                         transition: "color 0.2s ease",
                                                         "&:hover": { color: "#F8FAFC" },
                                                    }}
                                                >
                                                    <SentimentSatisfiedAltIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "9999px",
                                            bgcolor: "#142034",
                                            color: "#F8FAFC",
                                            fontSize: "0.94rem",
                                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.25)",
                                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.1)" },
                                            "&:hover fieldset": { borderColor: "rgba(37, 137, 216, 0.4)" },
                                            "&.Mui-focused fieldset": { borderColor: BRAND_COLORS.brandBlue },
                                        },
                                    }}
                                />

                                {/* Circular Pink Send Button */}
                                <IconButton
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        bgcolor: BRAND_COLORS.brandBlue,
                                        border: "none",
                                        color: "#ffffff",
                                        boxShadow: "0 4px 12px rgba(37, 137, 216, 0.3)",
                                        transition: "all 0.15s ease",
                                        "&:hover": {
                                            bgcolor: BRAND_COLORS.brandBlueHover,
                                            boxShadow: "0 6px 18px rgba(37, 137, 216, 0.4)",
                                            transform: "translateY(-1px)",
                                        },
                                        "&.Mui-disabled": {
                                            bgcolor: "rgba(20, 43, 69, 0.06)",
                                            color: "rgba(20, 43, 69, 0.3)",
                                            border: "none",
                                            boxShadow: "none",
                                        },
                                    }}
                                >
                                    {sending && !inputText.trim() ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        /* Empty state when no conversation is selected on desktop */
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

            {/* More Options Popover Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                    sx: {
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        borderRadius: "16px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        mt: 1,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        handleCloseMenu();
                        setShowProfileModal(true);
                    }}
                    sx={{ gap: 1.5, py: 1.2, color: "#FFFFFF", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" } }}
                >
                    <FavoriteBorderIcon fontSize="small" sx={{ color: BRAND_COLORS.coralPink }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>View Full Profile</Typography>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleCloseMenu();
                        setShowVideoModal(true);
                    }}
                    sx={{ gap: 1.5, py: 1.2, color: "#FFFFFF", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" } }}
                >
                    <VideocamIcon fontSize="small" sx={{ color: BRAND_COLORS.violet }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Start Video Call</Typography>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleCloseMenu();
                        setShowMediaModal(true);
                    }}
                    sx={{ gap: 1.5, py: 1.2, color: "#FFFFFF", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" } }}
                >
                    <PhotoCameraIcon fontSize="small" sx={{ color: "#38BDF8" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Share Photo</Typography>
                </MenuItem>

                <Divider sx={{ my: 1, borderColor: "rgba(255, 255, 255, 0.08)" }} />

                <MenuItem
                    onClick={() => {
                        handleCloseMenu();
                        setSafetyActionType("unmatch");
                        setSafetyModalOpen(true);
                    }}
                    sx={{ gap: 1.5, py: 1.2, color: "#FBBF24", "&:hover": { bgcolor: "rgba(251, 191, 36, 0.1)" } }}
                >
                    <PersonRemoveIcon fontSize="small" sx={{ color: "#FBBF24" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Unmatch</Typography>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleCloseMenu();
                        setSafetyActionType("report");
                        setSafetyModalOpen(true);
                    }}
                    sx={{ gap: 1.5, py: 1.2, color: "#F87171", "&:hover": { bgcolor: "rgba(248, 113, 113, 0.1)" } }}
                >
                    <ReportProblemIcon fontSize="small" sx={{ color: "#F87171" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Report User</Typography>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleCloseMenu();
                        setSafetyActionType("block");
                        setSafetyModalOpen(true);
                    }}
                    sx={{ gap: 1.5, py: 1.2, color: "#EF4444", "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" } }}
                >
                    <BlockIcon fontSize="small" sx={{ color: "#EF4444" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Block User</Typography>
                </MenuItem>
            </Menu>

            {/* Dating Safety Action Modal (Block, Report, Unmatch) */}
            <SafetyActionModal
                isOpen={safetyModalOpen}
                onClose={() => setSafetyModalOpen(false)}
                actionType={safetyActionType}
                targetUser={otherUser}
                matchId={activeConversation?.match?._id || activeConversation?.match}
                conversationId={activeConversation?._id}
                context="chat"
                onBlockUser={blockUser}
                onReportUser={reportUser}
                onUnmatchUser={unmatchUser}
                onSuccess={() => {
                    setActiveConversation(null);
                    setMobileShowChat(false);
                    loadConversations();
                }}
            />

            {/* Video Call Initiation Modal */}
            <Dialog
                open={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                PaperProps={{
                    sx: {
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        borderRadius: "24px",
                        p: 1.5,
                        maxWidth: 420,
                    },
                }}
            >
                <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            bgcolor: "rgba(139, 92, 246, 0.15)",
                            border: "1px solid rgba(139, 92, 246, 0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 1.5,
                        }}
                    >
                        <VideocamIcon sx={{ fontSize: 32, color: BRAND_COLORS.violet }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                        Video Call with {otherUser?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                        Select your preferred video calling mode
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={() => {
                            setShowVideoModal(false);
                            if (otherUser) {
                                initiateDirectCall(otherUser, activeConversation?._id);
                            }
                        }}
                        startIcon={<VideocamIcon />}
                        sx={{
                            background: BRAND_COLORS.primaryGradient,
                            borderRadius: "14px",
                            py: 1.3,
                            fontWeight: 700,
                            boxShadow: "0 6px 20px rgba(253, 58, 115, 0.35)",
                        }}
                    >
                        Direct 1-on-1 Video Call
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        onClick={() => {
                            setShowVideoModal(false);
                            navigate("/random-video");
                        }}
                        startIcon={<SparklesIcon />}
                        sx={{
                            borderRadius: "14px",
                            borderColor: "rgba(139, 92, 246, 0.5)",
                            color: "#C4B5FD",
                            py: 1.3,
                            fontWeight: 700,
                            "&:hover": {
                                borderColor: BRAND_COLORS.violet,
                                bgcolor: "rgba(139, 92, 246, 0.1)",
                            },
                        }}
                    >
                        Explore Random Match Pool
                    </Button>
                    <Button
                        onClick={() => setShowVideoModal(false)}
                        sx={{ color: BRAND_COLORS.textSecondary, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Quick Media Attachment Dialog */}
            <Dialog
                open={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                PaperProps={{
                    sx: {
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        borderRadius: "24px",
                        p: 1.5,
                        maxWidth: 440,
                    },
                }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                        Share a Photo 📷
                    </Typography>
                    <IconButton size="small" onClick={() => setShowMediaModal(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                        Select from cute presets or paste an image link to send directly in chat.
                    </Typography>

                    {/* Presets Grid */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
                        {PHOTO_PRESETS.map((item, idx) => (
                            <Box
                                key={idx}
                                onClick={() => handleSendPhoto(item.url)}
                                sx={{
                                    borderRadius: "14px",
                                    overflow: "hidden",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        transform: "scale(1.03)",
                                        borderColor: BRAND_COLORS.coralPink,
                                    },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={item.url}
                                    alt={item.title}
                                    sx={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                                />
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 0.6,
                                        bgcolor: "rgba(0,0,0,0.65)",
                                        textAlign: "center",
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.72rem" }}>
                                        {item.title}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Custom URL Input */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Or paste image URL here..."
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    bgcolor: "rgba(255, 255, 255, 0.05)",
                                    fontSize: "0.86rem",
                                    "& fieldset": { borderColor: BRAND_COLORS.surfaceDarkBorder },
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            disabled={!customImageUrl.trim()}
                            onClick={() => handleSendPhoto(customImageUrl.trim())}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: "12px",
                                px: 2.5,
                                fontWeight: 700,
                            }}
                        >
                            Send
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Fullscreen Photo Lightbox Modal */}
            <Dialog
                open={Boolean(previewImage)}
                onClose={() => setPreviewImage(null)}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        bgcolor: "transparent",
                        boxShadow: "none",
                        overflow: "hidden",
                    },
                }}
            >
                <Box sx={{ position: "relative", p: 1 }}>
                    <IconButton
                        onClick={() => setPreviewImage(null)}
                        sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            bgcolor: "rgba(0,0,0,0.7)",
                            color: "#FFFFFF",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.9)" },
                            zIndex: 2,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <Box
                        component="img"
                        src={previewImage || ""}
                        alt="Preview"
                        sx={{
                            maxWidth: "90vw",
                            maxHeight: "85vh",
                            borderRadius: "20px",
                            display: "block",
                            objectFit: "contain",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                    />
                </Box>
            </Dialog>

            {/* Partner Profile Modal */}
            <Dialog
                open={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                PaperProps={{
                    sx: {
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        borderRadius: "24px",
                        maxWidth: 420,
                        overflow: "hidden",
                        p: 0,
                    },
                }}
            >
                {otherUser && (
                    <Box>
                        <Box sx={{ position: "relative" }}>
                            <Box
                                component="img"
                                src={otherUser.photos?.[0]}
                                alt={otherUser.name}
                                sx={{
                                    width: "100%",
                                    height: 320,
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            <IconButton
                                onClick={() => setShowProfileModal(false)}
                                sx={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    bgcolor: "rgba(0,0,0,0.6)",
                                    color: "#FFFFFF",
                                    "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    p: 2,
                                    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(11, 13, 23, 0.95) 100%)",
                                }}
                            >
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                                        {otherUser.name}{otherUser.age ? `, ${otherUser.age}` : ""}
                                    </Typography>
                                </Stack>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, textTransform: "capitalize" }}>
                                    {otherUser.gender ? `${otherUser.gender} • ` : ""}Engaze Match
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {otherUser.location?.city && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <LocationOnIcon sx={{ fontSize: 18, color: BRAND_COLORS.coralPink }} />
                                    <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
                                        {otherUser.location.city}, {otherUser.location.country || "India"}
                                    </Typography>
                                </Stack>
                            )}

                            {otherUser.occupation && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <WorkOutlineIcon sx={{ fontSize: 18, color: BRAND_COLORS.coralPink }} />
                                    <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
                                        {otherUser.occupation}
                                    </Typography>
                                </Stack>
                            )}

                            {otherUser.education && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <SchoolIcon sx={{ fontSize: 18, color: BRAND_COLORS.coralPink }} />
                                    <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
                                        {otherUser.education}
                                    </Typography>
                                </Stack>
                            )}

                            {otherUser.bio && (
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.5, mt: 0.5 }}>
                                    {otherUser.bio}
                                </Typography>
                            )}

                            {otherUser.interests && otherUser.interests.length > 0 && (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 1 }}>
                                    {otherUser.interests.map((int, i) => (
                                        <Chip
                                            key={i}
                                            label={int}
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(255, 255, 255, 0.08)",
                                                color: "#FFFFFF",
                                                borderRadius: "9999px",
                                                fontSize: "0.78rem",
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Dialog>
        </Box>
    );
}

export default withAuth(ChatPage);
