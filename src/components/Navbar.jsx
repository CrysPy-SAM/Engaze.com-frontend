import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { BRAND_COLORS } from "../theme";
import EngazeLogo from "./EngazeLogo";
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Toolbar,
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
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

export default function Navbar({ hideBottomNav = false, hideTopNav = false, rightActions = null }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { userData, handleLogout } = useContext(AuthContext);

    const [profileAnchorEl, setProfileAnchorEl] = useState(null);
    const isMenuOpen = Boolean(profileAnchorEl);

    const handleProfileMenuOpen = (event) => {
        setProfileAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileAnchorEl(null);
    };

    const currentPath = location.pathname;

    const navItems = [
        { label: "Discover", path: "/discovery", icon: <WhatshotRoundedIcon fontSize="small" /> },
        { label: "Matches", path: "/matches", icon: <FavoriteRoundedIcon fontSize="small" />, badge: "5" },
        { label: "Chat", path: "/chat", icon: <ChatBubbleRoundedIcon fontSize="small" /> },
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
                        backgroundColor: "rgba(9, 10, 16, 0.88)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
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
                                spacing={0.6}
                                sx={{
                                    bgcolor: "rgba(255, 255, 255, 0.03)",
                                    p: 0.6,
                                    borderRadius: "9999px",
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
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
                                                fontWeight: active ? 700 : 500,
                                                color: active ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                                background: active ? BRAND_COLORS.primaryGradient : "transparent",
                                                boxShadow: active ? "0 4px 18px rgba(253, 58, 115, 0.35)" : "none",
                                                position: "relative",
                                                transition: "all 0.22s ease",
                                                "&:hover": {
                                                    background: active
                                                        ? BRAND_COLORS.primaryGradientHover
                                                        : "rgba(255, 255, 255, 0.06)",
                                                    color: "#FFFFFF",
                                                },
                                            }}
                                        >
                                            {item.label}
                                            {item.badge && (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        ml: 1,
                                                        px: 0.8,
                                                        py: 0.2,
                                                        fontSize: "0.62rem",
                                                        fontWeight: 800,
                                                        borderRadius: "9999px",
                                                        bgcolor: active ? "rgba(255, 255, 255, 0.25)" : "rgba(139, 92, 246, 0.3)",
                                                        color: "#fff",
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
                                            ? BRAND_COLORS.coralPink
                                            : BRAND_COLORS.surfaceDarkBorder
                                    }`,
                                    bgcolor:
                                        isActive("/profile") || isMenuOpen
                                            ? "rgba(253, 58, 115, 0.12)"
                                            : "rgba(255,255,255,0.03)",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: BRAND_COLORS.coralPink,
                                        bgcolor: "rgba(253, 58, 115, 0.08)",
                                    },
                                }}
                            >
                                <Avatar
                                    src={userData?.photos?.[0]}
                                    alt={userData?.name}
                                    sx={{
                                        width: { xs: 32, sm: 36 },
                                        height: { xs: 32, sm: 36 },
                                        border: `2px solid ${BRAND_COLORS.coralPink}`,
                                        boxShadow: "0 2px 8px rgba(253, 58, 115, 0.3)",
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
                                                    color: "#fff",
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
                                PaperProps={{
                                    sx: {
                                        mt: 1.2,
                                        minWidth: 220,
                                        borderRadius: "20px",
                                        bgcolor: BRAND_COLORS.surfaceDark,
                                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
                                        p: 1,
                                    },
                                }}
                            >
                                <Box sx={{ px: 2, py: 1.2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#fff" }}>
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
                                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
                                    }}
                                >
                                    <EditRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.coralPink }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Edit Profile
                                    </Typography>
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        handleProfileMenuClose();
                                        navigate("/history");
                                    }}
                                    sx={{
                                        borderRadius: "12px",
                                        gap: 1.5,
                                        py: 1,
                                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
                                    }}
                                >
                                    <HistoryRoundedIcon fontSize="small" sx={{ color: BRAND_COLORS.violet }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Video Activity
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
                                        "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                                    }}
                                >
                                    <LogoutRoundedIcon fontSize="small" />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Log Out
                                    </Typography>
                                </MenuItem>
                            </Menu>
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
                        backgroundColor: "rgba(9, 10, 16, 0.94)",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        zIndex: 1200,
                        pt: 1,
                        pb: "max(12px, env(safe-area-inset-bottom))",
                        px: 1,
                        boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.6)",
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
                                    color: active ? BRAND_COLORS.coralPink : BRAND_COLORS.textSecondary,
                                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                    "&:hover": {
                                        color: active ? BRAND_COLORS.coralPink : "#fff",
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
                                            filter: active ? "drop-shadow(0 2px 8px rgba(253, 58, 115, 0.6))" : "none",
                                        },
                                    })}
                                    {item.badge && (
                                        <Box
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
                                        color: active ? "#FFFFFF" : BRAND_COLORS.textSecondary,
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
                                            background: BRAND_COLORS.primaryGradient,
                                            boxShadow: "0 0 6px rgba(253, 58, 115, 0.8)",
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
