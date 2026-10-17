import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { BRAND_COLORS } from "../theme";
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container,
    IconButton,
    Paper,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatIcon from "@mui/icons-material/Chat";
import VideocamIcon from "@mui/icons-material/Videocam";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Navbar({ hideBottomNav = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { userData, handleLogout } = useContext(AuthContext);

    const currentPath = location.pathname;

    const navItems = [
        { label: "Discovery", path: "/discovery", icon: <WhatshotIcon /> },
        { label: "Matches", path: "/matches", icon: <FavoriteIcon /> },
        { label: "Chat", path: "/chat", icon: <ChatIcon /> },
        { label: "Video Match", path: "/random-video", icon: <VideocamIcon /> },
    ];

    const isActive = (path) => {
        if (path === "/chat") {
            return currentPath.startsWith("/chat");
        }
        return currentPath === path;
    };

    return (
        <>
            {/* Top Desktop & Mobile Header */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    backgroundColor: "rgba(11, 13, 23, 0.85)",
                    backdropFilter: "blur(16px)",
                    borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    zIndex: 1100,
                }}
            >
                <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 } }}>
                    <Toolbar
                        disableGutters
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            height: { xs: 60, sm: 70 },
                        }}
                    >
                        {/* Brand Logo */}
                        <Box
                            onClick={() => navigate("/discovery")}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: { xs: 0.8, sm: 1.2 },
                                cursor: "pointer",
                                userSelect: "none",
                                transition: "transform 0.2s ease",
                                "&:hover": { transform: "scale(1.02)" },
                            }}
                        >
                            <Box
                                sx={{
                                    width: { xs: 34, sm: 40 },
                                    height: { xs: 34, sm: 40 },
                                    borderRadius: "12px",
                                    background: BRAND_COLORS.primaryGradient,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 15px rgba(253, 58, 115, 0.4)",
                                }}
                            >
                                <WhatshotIcon sx={{ color: "#fff", fontSize: { xs: 20, sm: 26 } }} />
                            </Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: "-0.03em",
                                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                                    background: "linear-gradient(135deg, #FFFFFF 60%, rgba(255,255,255,0.7) 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                ENGAZE<span style={{ color: BRAND_COLORS.coralPink }}>.</span>
                            </Typography>
                        </Box>

                        {/* Desktop Navigation Links */}
                        {!isMobile && (
                            <Stack direction="row" spacing={1} sx={{ bgcolor: "rgba(255,255,255,0.03)", p: 0.6, borderRadius: 9999, border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                                {navItems.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <Button
                                            key={item.path}
                                            startIcon={item.icon}
                                            onClick={() => navigate(item.path)}
                                            sx={{
                                                px: 2.5,
                                                py: 0.8,
                                                borderRadius: 9999,
                                                fontSize: "0.9rem",
                                                fontWeight: active ? 700 : 500,
                                                color: active ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                                background: active ? BRAND_COLORS.primaryGradient : "transparent",
                                                boxShadow: active ? "0 4px 16px rgba(253, 58, 115, 0.35)" : "none",
                                                "&:hover": {
                                                    background: active
                                                        ? BRAND_COLORS.primaryGradientHover
                                                        : "rgba(255, 255, 255, 0.06)",
                                                    color: "#FFFFFF",
                                                },
                                            }}
                                        >
                                            {item.label}
                                        </Button>
                                    );
                                })}
                            </Stack>
                        )}

                        {/* Right Section: User Profile & Logout */}
                        <Stack direction="row" spacing={{ xs: 0.8, sm: 1.5 }} alignItems="center">
                            <Box
                                onClick={() => navigate("/profile")}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    cursor: "pointer",
                                    p: 0.6,
                                    pr: { xs: 0.6, sm: 2 },
                                    borderRadius: 9999,
                                    border: `1px solid ${isActive("/profile") ? BRAND_COLORS.coralPink : BRAND_COLORS.surfaceDarkBorder}`,
                                    bgcolor: isActive("/profile") ? "rgba(253, 58, 115, 0.12)" : "rgba(255,255,255,0.03)",
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
                                    <Box sx={{ textAlign: "left" }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#fff", lineHeight: 1.2, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {userData?.name?.split(" ")[0] || "Profile"}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.75rem", display: "block" }}>
                                            View Profile
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Tooltip title="Log Out">
                                <IconButton
                                    onClick={handleLogout}
                                    size="small"
                                    sx={{
                                        color: BRAND_COLORS.textSecondary,
                                        p: 1,
                                        borderRadius: "12px",
                                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                        "&:hover": {
                                            color: "#EF4444",
                                            borderColor: "rgba(239, 68, 68, 0.4)",
                                            bgcolor: "rgba(239, 68, 68, 0.1)",
                                        },
                                    }}
                                >
                                    <LogoutIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Bottom Navigation Bar (Dating App Native Style) */}
            {isMobile && !hideBottomNav && (
                <Paper
                    elevation={10}
                    sx={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 64,
                        backgroundColor: "rgba(11, 13, 23, 0.95)",
                        backdropFilter: "blur(20px)",
                        borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        zIndex: 1200,
                        px: 1,
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
                                    gap: 0.3,
                                    color: active ? BRAND_COLORS.coralPink : BRAND_COLORS.textSecondary,
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {item.icon}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: "0.68rem",
                                        fontWeight: active ? 700 : 500,
                                        color: active ? BRAND_COLORS.coralPink : BRAND_COLORS.textSecondary,
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </IconButton>
                        );
                    })}
                    <IconButton
                        onClick={() => navigate("/profile")}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.3,
                            color: isActive("/profile") ? BRAND_COLORS.coralPink : BRAND_COLORS.textSecondary,
                        }}
                    >
                        <PersonIcon />
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: "0.68rem",
                                fontWeight: isActive("/profile") ? 700 : 500,
                                color: isActive("/profile") ? BRAND_COLORS.coralPink : BRAND_COLORS.textSecondary,
                            }}
                        >
                            Profile
                        </Typography>
                    </IconButton>
                </Paper>
            )}
        </>
    );
}
