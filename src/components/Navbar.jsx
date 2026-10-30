import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { BRAND_COLORS } from "../theme";
import EngazeLogo from "./EngazeLogo";
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Popover,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

export default function Navbar({ hideBottomNav = false, hideTopNav = false, rightActions = null }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const {
        userData,
        handleLogout,
        unreadNotificationCount = 0,
        unreadChatCount = 0,
        unseenMissedCallCount = 0,
        likesYouCount = 0,
        getNotifications,
        getUnreadNotificationCount,
        getUnreadChatCount,
        markNotificationRead,
        markAllNotificationsRead,
    } = useContext(AuthContext);

    const [profileAnchorEl, setProfileAnchorEl] = useState(null);
    const isMenuOpen = Boolean(profileAnchorEl);

    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const [notifList, setNotifList] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const isNotifOpen = Boolean(notifAnchorEl);

    useEffect(() => {
        if (userData) {
            if (getUnreadNotificationCount) {
                getUnreadNotificationCount();
            }
            if (getUnreadChatCount) {
                getUnreadChatCount();
            }
        }
    }, [userData, getUnreadNotificationCount, getUnreadChatCount]);

    const handleProfileMenuOpen = (event) => {
        setProfileAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileAnchorEl(null);
    };

    const handleNotificationMenuOpen = async (event) => {
        setNotifAnchorEl(event.currentTarget);
        setLoadingNotifs(true);
        try {
            if (getNotifications) {
                const res = await getNotifications(1, 20);
                if (res?.notifications) {
                    setNotifList(res.notifications);
                }
            }
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        } finally {
            setLoadingNotifs(false);
        }
    };

    const handleNotificationMenuClose = () => {
        setNotifAnchorEl(null);
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read && markNotificationRead) {
            await markNotificationRead(notif._id);
        }
        handleNotificationMenuClose();
        if (notif.type === "match" || notif.type === "match_accepted") {
            if (notif.data?.conversationId) {
                navigate(`/chat?conversationId=${notif.data.conversationId}`);
            } else {
                navigate("/matches");
            }
        } else if (notif.type === "match_request") {
            navigate("/matches?tab=requests");
        } else if (notif.type === "missed_call") {
            navigate("/calls");
        } else if (notif.type === "like") {
            navigate("/matches?tab=likes");
        } else {
            navigate("/matches");
        }
    };

    const handleMarkAllRead = async () => {
        if (markAllNotificationsRead) {
            await markAllNotificationsRead();
            setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
        }
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return "Just now";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "Just now";
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const currentPath = location.pathname;

    const navItems = [
        { label: "Discover", path: "/discovery", icon: <WhatshotRoundedIcon fontSize="small" /> },
        { label: "Search", path: "/search", icon: <SearchRoundedIcon fontSize="small" /> },
        {
            label: "Matches",
            path: "/matches",
            icon: <FavoriteRoundedIcon fontSize="small" />,
            badge: likesYouCount > 0 ? (likesYouCount > 99 ? "99+" : String(likesYouCount)) : null,
        },
        {
            label: "Chat",
            path: "/chat",
            icon: <ChatBubbleRoundedIcon fontSize="small" />,
            badge: unreadChatCount > 0 ? (unreadChatCount > 99 ? "99+" : String(unreadChatCount)) : null,
        },
        {
            label: "Calls",
            path: "/calls",
            icon: <PhoneRoundedIcon fontSize="small" />,
            badge: unseenMissedCallCount > 0 ? (unseenMissedCallCount > 99 ? "99+" : String(unseenMissedCallCount)) : null,
        },
        { label: "Video", path: "/random-video", icon: <VideocamRoundedIcon fontSize="small" /> },
        { label: "Profile", path: "/home", icon: <PersonRoundedIcon fontSize="small" /> },
    ];

    const isActive = (path) => {
        if (path === "/home") {
            return currentPath === "/home" || currentPath === "/profile";
        }
        if (path === "/chat") {
            return currentPath.startsWith("/chat");
        }
        if (path === "/calls") {
            return currentPath.startsWith("/calls");
        }
        if (path === "/random-video") {
            return currentPath === "/random-video" || currentPath === "/random-call";
        }
        return currentPath === path;
    };

    return (
        <>
            {/* Top Desktop & Mobile Header */}
            {!hideTopNav && (
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        backgroundColor: "rgba(10, 17, 28, 0.90)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                        zIndex: 1100,
                    }}
                >
                    <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
                        <Toolbar
                            disableGutters
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                height: { xs: 58, sm: 66 },
                            }}
                        >
                            {/* Official Engaze Brand Logo */}
                            <EngazeLogo
                                size={30}
                                fontSize="1.35rem"
                                onClick={() => navigate("/discovery")}
                            />

                        {/* Desktop Navigation Centered Pill Container */}
                        {!isMobile && (
                            <Stack
                                direction="row"
                                spacing={0.8}
                                sx={{
                                    bgcolor: "#121C2D",
                                    p: 0.6,
                                    borderRadius: "9999px",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                                }}
                            >
                                {navItems.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <Button
                                            key={item.path}
                                            startIcon={item.icon}
                                            onClick={() => navigate(item.path)}
                                            sx={{
                                                px: 2.2,
                                                py: 0.8,
                                                borderRadius: "9999px",
                                                fontSize: "0.88rem",
                                                fontWeight: active ? 800 : 600,
                                                color: active ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                                background: active ? BRAND_COLORS.brandBlue : "transparent",
                                                border: "none",
                                                boxShadow: active ? "0 4px 14px rgba(37, 137, 216, 0.35)" : "none",
                                                position: "relative",
                                                transition: "all 0.18s ease",
                                                "&:hover": {
                                                    background: active ? BRAND_COLORS.brandBlueHover : "rgba(37, 137, 216, 0.12)",
                                                    color: "#FFFFFF",
                                                },
                                            }}
                                        >
                                            {item.label}
                                            {item.badge && (
                                                <Box
                                                    component="span"
                                                    role="status"
                                                    aria-label={`${item.label}, ${item.badge} unread`}
                                                    sx={{
                                                        ml: 1,
                                                        px: 0.8,
                                                        py: 0.2,
                                                        fontSize: "0.62rem",
                                                        fontWeight: 800,
                                                        borderRadius: "9999px",
                                                        bgcolor: active ? "#FFFFFF" : BRAND_COLORS.coralPink,
                                                        color: active ? BRAND_COLORS.coralPink : "#FFFFFF",
                                                        letterSpacing: "0.5px",
                                                    }}
                                                >
                                                    {item.badge}
                                                </Box>
                                            )}
                                        </Button>
                                    );
                                })}
                            </Stack>
                        )}

                        {/* Right Section: User Profile & Quick Menu */}
                        <Stack direction="row" spacing={1} alignItems="center">
                            {/* In-App Notifications Bell */}
                            <Tooltip title="Notifications">
                                <IconButton
                                    onClick={handleNotificationMenuOpen}
                                    sx={{
                                        width: { xs: 34, sm: 38 },
                                        height: { xs: 34, sm: 38 },
                                        borderRadius: "50%",
                                        bgcolor: isNotifOpen ? "rgba(37, 137, 216, 0.2)" : "rgba(255, 255, 255, 0.06)",
                                        color: unreadNotificationCount > 0 ? BRAND_COLORS.brandBlue : "#F8FAFC",
                                        border: `1px solid ${isNotifOpen ? BRAND_COLORS.brandBlue : "rgba(255, 255, 255, 0.1)"}`,
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            bgcolor: "rgba(37, 137, 216, 0.15)",
                                            color: BRAND_COLORS.brandBlue,
                                        },
                                    }}
                                >
                                    <Badge
                                        badgeContent={unreadNotificationCount}
                                        max={99}
                                        sx={{
                                            "& .MuiBadge-badge": {
                                                bgcolor: BRAND_COLORS.coralPink,
                                                color: "#fff",
                                                fontSize: "0.62rem",
                                                fontWeight: 800,
                                                minWidth: 16,
                                                height: 16,
                                                padding: "0 3px",
                                            },
                                        }}
                                    >
                                        <NotificationsRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                                    </Badge>
                                </IconButton>
                            </Tooltip>

                            {isMobile && rightActions ? (
                                rightActions
                            ) : (
                                <Box
                                    onClick={handleProfileMenuOpen}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    cursor: "pointer",
                                    p: 0.5,
                                    pr: { xs: 0.5, sm: 1.6 },
                                    borderRadius: "9999px",
                                    border: `1px solid ${
                                        isActive("/profile") || isMenuOpen
                                            ? BRAND_COLORS.brandBlue : "rgba(20, 43, 69, 0.1)"
                                    }`,
                                    bgcolor:
                                        isActive("/profile") || isMenuOpen
                                            ? "rgba(37, 137, 216, 0.08)" : "rgba(20, 43, 69, 0.03)",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: BRAND_COLORS.brandBlue,
                                        bgcolor: "rgba(37, 137, 216, 0.06)",
                                    },
                                }}
                            >
                                <Avatar
                                    src={userData?.photos?.[0]}
                                    alt={userData?.name}
                                    sx={{
                                        width: { xs: 32, sm: 36 },
                                        height: { xs: 32, sm: 36 },
                                        border: "2px solid #2589D8",
                                        boxShadow: "0 2px 8px rgba(37, 137, 216, 0.25)",
                                    }}
                                >
                                    {userData?.name?.charAt(0) || "U"}
                                </Avatar>
                                {!isMobile && (
                                    <>
                                        <Box sx={{ textAlign: "left" }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: BRAND_COLORS.deepNavy,
                                                    lineHeight: 1.2,
                                                    maxWidth: 110,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {userData?.name?.split(" ")[0] || "Profile"}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: BRAND_COLORS.textSecondary,
                                                    fontSize: "0.72rem",
                                                    display: "block",
                                                }}
                                            >
                                                @{userData?.username || "member"}
                                            </Typography>
                                        </Box>
                                        <KeyboardArrowDownRoundedIcon
                                            sx={{
                                                fontSize: 18,
                                                color: BRAND_COLORS.textSecondary,
                                                transform: isMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                transition: "transform 0.2s ease",
                                            }}
                                        />
                                    </>
                                )}
                            </Box>
                        )}

                        {/* Dropdown Profile Menu */}
                            <Menu
                                anchorEl={profileAnchorEl}
                                open={isMenuOpen}
                                onClose={handleProfileMenuClose}
                                transformOrigin={{ horizontal: "right", vertical: "top" }}
                                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                                slotProps={{
                                    paper: {
                                        style: {
                                            backgroundColor: "#121C2D",
                                            color: "#F8FAFC",
                                        },
                                        sx: {
                                            mt: 1.2,
                                            minWidth: 220,
                                            borderRadius: "20px",
                                            bgcolor: "#121C2D !important",
                                            backgroundColor: "#121C2D !important",
                                            color: "#F8FAFC !important",
                                            backgroundImage: "none !important",
                                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
                                            p: 1,
                                        },
                                    },
                                }}
                                PaperProps={{
                                    style: {
                                        backgroundColor: "#121C2D",
                                        color: "#F8FAFC",
                                    },
                                    sx: {
                                        mt: 1.2,
                                        minWidth: 220,
                                        borderRadius: "20px",
                                        bgcolor: "#121C2D !important",
                                        backgroundColor: "#121C2D !important",
                                        color: "#F8FAFC !important",
                                        backgroundImage: "none !important",
                                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
                                        p: 1,
                                    },
                                }}
                            >
                                <Box sx={{ px: 2, py: 1.2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC" }}>
                                        {userData?.name || "Engaze Member"}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                        @{userData?.username || "user"}
                                    </Typography>
                                </Box>
                                <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder, my: 0.8 }} />
                                <MenuItem
                                    onClick={() => {
                                        handleProfileMenuClose();
                                        navigate("/profile");
                                    }}
                                    sx={{
                                        borderRadius: "12px",
                                        gap: 1.5,
                                        py: 1,
                                        color: "#F8FAFC",
                                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
                                    }}
                                >
                                    <EditRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.brandBlue }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Edit Profile
                                    </Typography>
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        handleProfileMenuClose();
                                        navigate("/profile?tab=privacy");
                                    }}
                                    sx={{
                                        borderRadius: "12px",
                                        gap: 1.5,
                                        py: 1,
                                        color: "#F8FAFC",
                                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
                                    }}
                                >
                                    <SecurityRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.brandBlue }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Privacy & Status
                                    </Typography>
                                </MenuItem>
                                <MenuItem
                                    component="a"
                                    href="mailto:support@engaze.date"
                                    aria-label="Email Customer Support at support@engaze.date"
                                    onClick={handleProfileMenuClose}
                                    sx={{
                                        borderRadius: "12px",
                                        gap: 1.5,
                                        py: 1,
                                        color: "#F8FAFC",
                                        textDecoration: "none",
                                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
                                    }}
                                >
                                    <HelpOutlineRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.violet }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Help & Support
                                    </Typography>
                                </MenuItem>
                                <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder, my: 0.8 }} />
                                <MenuItem
                                    onClick={() => {
                                        handleProfileMenuClose();
                                        handleLogout();
                                    }}
                                    sx={{
                                        borderRadius: "12px",
                                        gap: 1.5,
                                        py: 1,
                                        color: "#EF4444",
                                        "&:hover": { bgcolor: "rgba(239, 68, 68, 0.12)" },
                                    }}
                                >
                                    <LogoutRoundedIcon fontSize="small" />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Log Out
                                    </Typography>
                                </MenuItem>
                            </Menu>

                            {/* Notifications Drawer / Popover */}
                            <Popover
                                anchorEl={notifAnchorEl}
                                open={isNotifOpen}
                                onClose={handleNotificationMenuClose}
                                transformOrigin={{ horizontal: "right", vertical: "top" }}
                                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                                slotProps={{
                                    paper: {
                                        style: {
                                            backgroundColor: "#121C2D",
                                            color: "#F8FAFC",
                                        },
                                        sx: {
                                            mt: 1.5,
                                            width: { xs: "calc(100vw - 32px)", sm: 380 },
                                            maxWidth: 380,
                                            maxHeight: 480,
                                            borderRadius: "20px",
                                            bgcolor: "#121C2D !important",
                                            backgroundColor: "#121C2D !important",
                                            color: "#F8FAFC !important",
                                            backgroundImage: "none !important",
                                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            boxShadow: "0 16px 44px rgba(0, 0, 0, 0.7)",
                                            overflow: "hidden",
                                            display: "flex",
                                            flexDirection: "column",
                                        },
                                    },
                                }}
                                PaperProps={{
                                    style: {
                                        backgroundColor: "#121C2D",
                                        color: "#F8FAFC",
                                    },
                                    sx: {
                                        mt: 1.5,
                                        width: { xs: "calc(100vw - 32px)", sm: 380 },
                                        maxWidth: 380,
                                        maxHeight: 480,
                                        borderRadius: "20px",
                                        bgcolor: "#121C2D !important",
                                        backgroundColor: "#121C2D !important",
                                        color: "#F8FAFC !important",
                                        backgroundImage: "none !important",
                                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                        boxShadow: "0 16px 44px rgba(0, 0, 0, 0.7)",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        bgcolor: "#121C2D",
                                        color: "#F8FAFC",
                                        display: "flex",
                                        flexDirection: "column",
                                        overflow: "hidden",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 2,
                                            pb: 1.5,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                            bgcolor: "#121C2D",
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#F8FAFC" }}>
                                                Notifications
                                            </Typography>
                                            {unreadNotificationCount > 0 && (
                                                <Chip
                                                    label={`${unreadNotificationCount} new`}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: "0.68rem",
                                                        fontWeight: 800,
                                                        bgcolor: "rgba(253, 58, 115, 0.2)",
                                                        color: BRAND_COLORS.coralPink,
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        {unreadNotificationCount > 0 && (
                                            <Button
                                                size="small"
                                                onClick={handleMarkAllRead}
                                                sx={{
                                                    fontSize: "0.72rem",
                                                    fontWeight: 700,
                                                    color: BRAND_COLORS.coralPink,
                                                    textTransform: "none",
                                                    p: 0,
                                                    minWidth: "auto",
                                                    "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                                }}
                                            >
                                                Mark all read
                                            </Button>
                                        )}
                                    </Box>

                                    <Box sx={{ overflowY: "auto", flexGrow: 1, py: 0.5, bgcolor: "#121C2D" }}>
                                        {loadingNotifs ? (
                                            <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                                                <CircularProgress size={24} sx={{ color: BRAND_COLORS.coralPink }} />
                                            </Box>
                                        ) : notifList.length === 0 ? (
                                            <Box sx={{ p: 4, textAlign: "center" }}>
                                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 500 }}>
                                                    You're all caught up! ✨
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textMuted, display: "block", mt: 0.5 }}>
                                                    When someone likes you or you get a match, it'll show up here.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <List disablePadding sx={{ bgcolor: "#121C2D" }}>
                                                {notifList.map((notif) => (
                                                    <ListItemButton
                                                        key={notif._id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        sx={{
                                                            px: 2,
                                                            py: 1.4,
                                                            borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                                            bgcolor: notif.read ? "transparent" : "rgba(37, 137, 216, 0.12)",
                                                            transition: "background-color 0.2s ease",
                                                            "&:hover": {
                                                                bgcolor: notif.read ? "rgba(255, 255, 255, 0.04)" : "rgba(37, 137, 216, 0.18)",
                                                            },
                                                        }}
                                                    >
                                                        <ListItemAvatar sx={{ minWidth: 46 }}>
                                                            <Avatar
                                                                src={notif.sender?.photos?.[0]}
                                                                alt={notif.sender?.name}
                                                                sx={{
                                                                    width: 38,
                                                                    height: 38,
                                                                    bgcolor: "rgba(255, 255, 255, 0.1)",
                                                                    border: notif.type === "match" ? `2px solid ${BRAND_COLORS.coralPink}` : "none",
                                                                }}
                                                            >
                                                                {notif.sender?.name?.charAt(0) || "U"}
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body2" sx={{ fontWeight: notif.read ? 600 : 800, color: "#F8FAFC", lineHeight: 1.3 }}>
                                                                    {notif.type === "match"
                                                                        ? `🎉 You and ${notif.sender?.name} matched!`
                                                                        : notif.type === "match_request"
                                                                        ? `💌 ${notif.sender?.name} sent you a match request!`
                                                                        : notif.type === "match_accepted"
                                                                        ? `✨ ${notif.sender?.name} accepted your match request!`
                                                                        : notif.type === "missed_call"
                                                                        ? `📞 Missed call from ${notif.sender?.name}`
                                                                        : `${notif.sender?.name} liked your profile`}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.72rem", mt: 0.3, display: "block" }}>
                                                                    {formatTimeAgo(notif.createdAt)}
                                                                </Typography>
                                                            }
                                                        />
                                                        {!notif.read && (
                                                            <Box
                                                                sx={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: "50%",
                                                                    bgcolor: BRAND_COLORS.coralPink,
                                                                    ml: 1,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )}
                                                    </ListItemButton>
                                                ))}
                                            </List>
                                        )}
                                    </Box>
                                </Box>
                            </Popover>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>
        )}

            {/* Mobile Bottom Navigation Bar (True Native iOS/Android Dating App Style) */}
            {isMobile && !hideBottomNav && (
                <Paper
                    elevation={12}
                    sx={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: "rgba(10, 17, 28, 0.94)",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        zIndex: 1200,
                        pt: 1,
                        pb: "max(12px, env(safe-area-inset-bottom))",
                        px: 1,
                        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.5)",
                    }}
                >
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <IconButton
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.3,
                                    py: 0.6,
                                    px: 1.4,
                                    borderRadius: "16px",
                                    color: active ? BRAND_COLORS.brandBlue : "#8E9CAE",
                                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                    "&:hover": {
                                        color: active ? BRAND_COLORS.brandBlue : BRAND_COLORS.deepNavy,
                                    },
                                    "&:active": {
                                        transform: "scale(0.92)",
                                    },
                                }}
                            >
                                <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {React.cloneElement(item.icon, {
                                        sx: {
                                            fontSize: 24,
                                            filter: active ? "drop-shadow(0 2px 6px rgba(37, 137, 216, 0.35))" : "none",
                                        },
                                    })}
                                    {item.badge && (
                                        <Box
                                            role="status"
                                            aria-label={`${item.label}, ${item.badge} unread`}
                                            sx={{
                                                position: "absolute",
                                                top: -4,
                                                right: -8,
                                                minWidth: 16,
                                                height: 16,
                                                borderRadius: "9999px",
                                                bgcolor: BRAND_COLORS.coralPink,
                                                color: "#fff",
                                                fontSize: "0.62rem",
                                                fontWeight: 800,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                px: 0.4,
                                                boxShadow: "0 2px 6px rgba(253, 58, 115, 0.6)",
                                            }}
                                        >
                                            {item.badge}
                                        </Box>
                                    )}
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: "0.68rem",
                                        fontWeight: active ? 800 : 500,
                                        color: active ? BRAND_COLORS.brandBlue : BRAND_COLORS.textSecondary,
                                        letterSpacing: "0.2px",
                                    }}
                                >
                                    {item.label}
                                </Typography>
                                {/* Micro Active Indicator Dot */}
                                {active && (
                                    <Box
                                        sx={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: "50%",
                                            background: BRAND_COLORS.brandBlue,
                                            boxShadow: "0 0 6px rgba(37, 137, 216, 0.6)",
                                            mt: 0.2,
                                        }}
                                    />
                                )}
                            </IconButton>
                        );
                    })}
                </Paper>
            )}
        </>
    );
}
