import React, { useState, useEffect, useCallback, useContext } from "react";
import {
    Box,
    Container,
    Typography,
    Stack,
    Tabs,
    Tab,
    Paper,
    Avatar,
    IconButton,
    Button,
    Chip,
    CircularProgress,
    Tooltip,
    Pagination,
} from "@mui/material";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import CallMadeRoundedIcon from "@mui/icons-material/CallMadeRounded";
import CallReceivedRoundedIcon from "@mui/icons-material/CallReceivedRounded";
import CallMissedRoundedIcon from "@mui/icons-material/CallMissedRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Navbar from "../components/Navbar";
import { AuthContext } from "../contexts/AuthContext";
import { useDirectCall } from "../contexts/DirectCallContext";

const BRAND_COLORS = {
    background: "#0A111C",
    surfaceDark: "#121C2D",
    surfaceDarkBorder: "rgba(255, 255, 255, 0.08)",
    brandBlue: "#2589D8",
    brandBlueHover: "#1d72b5",
    coralPink: "#FD3A73",
    coralPinkHover: "#e02d62",
    emeraldGreen: "#10B981",
    warningYellow: "#F59E0B",
    textPrimary: "#F8FAFC",
    textSecondary: "#8E9CAE",
};

export default function CallsPage() {
    const {
        getCallHistory,
        markMissedCallsAsSeen,
        unseenMissedCallCount,
    } = useContext(AuthContext);

    const { initiateDirectCall } = useDirectCall();

    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState("all"); // "all", "missed", "video", "audio"

    const fetchHistory = useCallback(async (targetPage = 1, filterTab = activeTab) => {
        setLoading(true);
        try {
            let typeParam = "all";
            let statusParam = "all";

            if (filterTab === "missed") {
                statusParam = "missed";
            } else if (filterTab === "video") {
                typeParam = "video";
            } else if (filterTab === "audio") {
                typeParam = "audio";
            }

            const res = await getCallHistory(targetPage, 20, typeParam, statusParam);
            if (res && res.success) {
                setCalls(res.calls || []);
                setPage(res.page || 1);
                setTotalPages(res.totalPages || 1);
            }
        } catch (err) {
            console.error("Error fetching call history:", err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, getCallHistory]);

    // On mount or filter change, fetch history
    useEffect(() => {
        fetchHistory(1, activeTab);
    }, [activeTab, fetchHistory]);

    // Automatically mark unseen missed calls as seen on page visit
    useEffect(() => {
        if (unseenMissedCallCount > 0 && markMissedCallsAsSeen) {
            markMissedCallsAsSeen().catch(() => {});
        }
    }, [unseenMissedCallCount, markMissedCallsAsSeen]);

    const handleTabChange = (event, newTab) => {
        setActiveTab(newTab);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
        fetchHistory(newPage, activeTab);
    };

    const handleMarkAllSeen = async () => {
        if (markMissedCallsAsSeen) {
            await markMissedCallsAsSeen();
            fetchHistory(page, activeTab);
        }
    };

    const handleCallBack = (call) => {
        if (!call.partner) return;
        const callType = call.callType === "audio" ? "audio" : "video";
        initiateDirectCall(call.partner, null, callType);
    };

    const formatDuration = (secs) => {
        if (!secs || secs <= 0) return "0s";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        if (m > 0) {
            return `${m}m ${s}s`;
        }
        return `${s}s`;
    };

    const formatCallTimestamp = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = d.toDateString() === yesterday.toDateString();

        const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        if (isToday) return `Today, ${timeStr}`;
        if (isYesterday) return `Yesterday, ${timeStr}`;
        return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: BRAND_COLORS.background, color: BRAND_COLORS.textPrimary, pb: { xs: 12, md: 6 } }}>
            <Navbar />

            <Container maxWidth="md" sx={{ pt: { xs: 2.5, md: 4 }, px: { xs: 2, sm: 3 } }}>
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 3,
                    }}
                >
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                                Call History
                            </Typography>
                            {unseenMissedCallCount > 0 && (
                                <Chip
                                    label={`${unseenMissedCallCount} new missed`}
                                    size="small"
                                    sx={{
                                        bgcolor: "rgba(253, 58, 115, 0.2)",
                                        color: BRAND_COLORS.coralPink,
                                        fontWeight: 800,
                                        fontSize: "0.72rem",
                                        height: 24,
                                        border: `1px solid rgba(253, 58, 115, 0.4)`,
                                    }}
                                />
                            )}
                        </Stack>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mt: 0.5 }}>
                            One-to-one voice and video calls with your connections
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        {unseenMissedCallCount > 0 && (
                            <Button
                                size="small"
                                startIcon={<DoneAllRoundedIcon sx={{ fontSize: 18 }} />}
                                onClick={handleMarkAllSeen}
                                sx={{
                                    bgcolor: "rgba(37, 137, 216, 0.15)",
                                    color: BRAND_COLORS.brandBlue,
                                    borderRadius: "12px",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    px: 1.8,
                                    py: 0.6,
                                    "&:hover": { bgcolor: "rgba(37, 137, 216, 0.25)" },
                                }}
                            >
                                Mark all as read
                            </Button>
                        )}
                        <Tooltip title="Refresh Call History">
                            <IconButton
                                onClick={() => fetchHistory(page, activeTab)}
                                sx={{
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    color: BRAND_COLORS.textSecondary,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                    borderRadius: "12px",
                                    "&:hover": { color: "#FFF", bgcolor: "rgba(255, 255, 255, 0.08)" },
                                }}
                            >
                                <RefreshRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                {/* Filter Tabs */}
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        borderRadius: "16px",
                        p: 0.5,
                        mb: 3,
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            minHeight: 40,
                            "& .MuiTabs-indicator": {
                                bgcolor: BRAND_COLORS.brandBlue,
                                height: 3,
                                borderRadius: "3px",
                            },
                        }}
                    >
                        <Tab
                            value="all"
                            label="All Calls"
                            sx={{
                                color: BRAND_COLORS.textSecondary,
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: "0.85rem",
                                "&.Mui-selected": { color: "#FFFFFF" },
                            }}
                        />
                        <Tab
                            value="missed"
                            label={
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                    <span>Missed</span>
                                    {unseenMissedCallCount > 0 && (
                                        <Box
                                            component="span"
                                            sx={{
                                                bgcolor: BRAND_COLORS.coralPink,
                                                color: "#FFF",
                                                borderRadius: "9999px",
                                                px: 0.8,
                                                py: 0.1,
                                                fontSize: "0.62rem",
                                                fontWeight: 800,
                                            }}
                                        >
                                            {unseenMissedCallCount}
                                        </Box>
                                    )}
                                </Stack>
                            }
                            sx={{
                                color: BRAND_COLORS.textSecondary,
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: "0.85rem",
                                "&.Mui-selected": { color: BRAND_COLORS.coralPink },
                            }}
                        />
                        <Tab
                            value="video"
                            label="Video"
                            sx={{
                                color: BRAND_COLORS.textSecondary,
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: "0.85rem",
                                "&.Mui-selected": { color: "#FFFFFF" },
                            }}
                        />
                        <Tab
                            value="audio"
                            label="Audio"
                            sx={{
                                color: BRAND_COLORS.textSecondary,
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: "0.85rem",
                                "&.Mui-selected": { color: "#FFFFFF" },
                            }}
                        />
                    </Tabs>
                </Paper>

                {/* Call List Content */}
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                        <CircularProgress size={36} sx={{ color: BRAND_COLORS.brandBlue }} />
                    </Box>
                ) : calls.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            bgcolor: BRAND_COLORS.surfaceDark,
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            borderRadius: "24px",
                            p: { xs: 4, sm: 6 },
                            textAlign: "center",
                        }}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                bgcolor: "rgba(37, 137, 216, 0.12)",
                                color: BRAND_COLORS.brandBlue,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 2,
                            }}
                        >
                            {activeTab === "missed" ? (
                                <CallMissedRoundedIcon sx={{ fontSize: 32, color: BRAND_COLORS.coralPink }} />
                            ) : (
                                <PhoneRoundedIcon sx={{ fontSize: 32 }} />
                            )}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                            {activeTab === "missed" ? "No missed calls" : "No call history yet"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, maxWidth: 360, mx: "auto" }}>
                            {activeTab === "missed"
                                ? "You're all caught up! You have no missed calls."
                                : "Start a 1-on-1 audio or video call from any match in your Chat or Matches section."}
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={1.5}>
                        {calls.map((call) => {
                            const isIncoming = call.direction === "incoming";
                            const isMissed = call.isMissed;
                            const isCompleted = call.status === "completed";
                            const isRejected = call.status === "rejected";

                            return (
                                <Paper
                                    key={call._id || call.callId}
                                    elevation={0}
                                    sx={{
                                        bgcolor: isMissed ? "rgba(253, 58, 115, 0.05)" : BRAND_COLORS.surfaceDark,
                                        border: `1px solid ${
                                            isMissed ? "rgba(253, 58, 115, 0.3)" : BRAND_COLORS.surfaceDarkBorder
                                        }`,
                                        borderRadius: "20px",
                                        p: { xs: 1.8, sm: 2.2 },
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        transition: "all 0.18s ease",
                                        "&:hover": {
                                            borderColor: isMissed
                                                ? "rgba(253, 58, 115, 0.5)"
                                                : "rgba(255, 255, 255, 0.16)",
                                        },
                                    }}
                                >
                                    {/* Left: Avatar & Info */}
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flexGrow: 1 }}>
                                        <Avatar
                                            src={call.partner?.photos?.[0]}
                                            alt={call.partner?.name || "User"}
                                            sx={{
                                                width: { xs: 46, sm: 52 },
                                                height: { xs: 46, sm: 52 },
                                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                                border: isMissed
                                                    ? `2px solid ${BRAND_COLORS.coralPink}`
                                                    : `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            }}
                                        >
                                            {call.partner?.name?.charAt(0) || "U"}
                                        </Avatar>

                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight: isMissed ? 800 : 700,
                                                    color: isMissed ? BRAND_COLORS.coralPink : BRAND_COLORS.textPrimary,
                                                    fontSize: { xs: "0.95rem", sm: "1.05rem" },
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {call.partner?.name || "Engaze User"}
                                            </Typography>

                                            {/* Status line with Direction Icon */}
                                            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.3 }}>
                                                {isMissed ? (
                                                    <CallMissedRoundedIcon sx={{ fontSize: 16, color: BRAND_COLORS.coralPink }} />
                                                ) : isIncoming ? (
                                                    <CallReceivedRoundedIcon
                                                        sx={{
                                                            fontSize: 16,
                                                            color: isCompleted ? BRAND_COLORS.emeraldGreen : BRAND_COLORS.textSecondary,
                                                        }}
                                                    />
                                                ) : (
                                                    <CallMadeRoundedIcon
                                                        sx={{
                                                            fontSize: 16,
                                                            color: isCompleted ? BRAND_COLORS.brandBlue : BRAND_COLORS.textSecondary,
                                                        }}
                                                    />
                                                )}

                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: isMissed
                                                            ? BRAND_COLORS.coralPink
                                                            : isCompleted
                                                            ? BRAND_COLORS.emeraldGreen
                                                            : BRAND_COLORS.textSecondary,
                                                        fontWeight: 700,
                                                        fontSize: "0.74rem",
                                                    }}
                                                >
                                                    {isMissed
                                                        ? "Missed Call"
                                                        : isCompleted
                                                        ? `Completed • ${formatDuration(call.duration)}`
                                                        : isRejected
                                                        ? "Declined"
                                                        : isIncoming
                                                        ? "Unanswered"
                                                        : "No Answer"}
                                                </Typography>

                                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.72rem" }}>
                                                    • {formatCallTimestamp(call.initiatedAt || call.createdAt)}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    {/* Right: Call Type & Call Back Action */}
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                        <Tooltip title={call.callType === "audio" ? "Audio Call" : "Video Call"}>
                                            <Box
                                                sx={{
                                                    display: { xs: "none", sm: "flex" },
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: "50%",
                                                    bgcolor: "rgba(255, 255, 255, 0.05)",
                                                    color: BRAND_COLORS.textSecondary,
                                                }}
                                            >
                                                {call.callType === "audio" ? (
                                                    <PhoneRoundedIcon sx={{ fontSize: 18 }} />
                                                ) : (
                                                    <VideocamRoundedIcon sx={{ fontSize: 18 }} />
                                                )}
                                            </Box>
                                        </Tooltip>

                                        {call.partner && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={
                                                    call.callType === "audio" ? (
                                                        <PhoneRoundedIcon sx={{ fontSize: 16 }} />
                                                    ) : (
                                                        <VideocamRoundedIcon sx={{ fontSize: 16 }} />
                                                    )
                                                }
                                                onClick={() => handleCallBack(call)}
                                                sx={{
                                                    bgcolor: isMissed ? BRAND_COLORS.coralPink : BRAND_COLORS.brandBlue,
                                                    color: "#FFFFFF",
                                                    fontWeight: 700,
                                                    fontSize: "0.78rem",
                                                    textTransform: "none",
                                                    borderRadius: "12px",
                                                    px: { xs: 1.5, sm: 2 },
                                                    py: 0.7,
                                                    boxShadow: isMissed
                                                        ? "0 4px 14px rgba(253, 58, 115, 0.3)"
                                                        : "0 4px 14px rgba(37, 137, 216, 0.3)",
                                                    "&:hover": {
                                                        bgcolor: isMissed ? BRAND_COLORS.coralPinkHover : BRAND_COLORS.brandBlueHover,
                                                    },
                                                }}
                                            >
                                                Call Back
                                            </Button>
                                        )}
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            sx={{
                                "& .MuiPaginationItem-root": {
                                    color: BRAND_COLORS.textSecondary,
                                    "&.Mui-selected": {
                                        bgcolor: BRAND_COLORS.brandBlue,
                                        color: "#FFF",
                                    },
                                },
                            }}
                        />
                    </Box>
                )}
            </Container>
        </Box>
    );
}

