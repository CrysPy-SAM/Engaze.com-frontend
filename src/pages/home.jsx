import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Avatar,
    Box,
    Button,
    Card,
    Container,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Switch,
    Typography,
    Chip,
} from "@mui/material";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

function HomeComponent() {
    const navigate = useNavigate();
    const { userData, handleLogout } = useContext(AuthContext);

    // Dialog states
    const [plusModalOpen, setPlusModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [supportModalOpen, setSupportModalOpen] = useState(false);

    const menuItems = [
        {
            id: "discover",
            title: "Discover",
            subtitle: "Find new people",
            icon: <WhatshotRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 24 }} />,
            onClick: () => navigate("/discovery"),
        },
        {
            id: "matches",
            title: "Matches",
            subtitle: "Your connections",
            icon: <FavoriteRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 24 }} />,
            onClick: () => navigate("/matches"),
        },
        {
            id: "messages",
            title: "Messages",
            subtitle: "Chat with your matches",
            icon: <ChatBubbleRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 24 }} />,
            onClick: () => navigate("/chat"),
        },
        {
            id: "random-video",
            title: "Random Video",
            subtitle: "Meet new people",
            icon: <VideocamRoundedIcon sx={{ color: BRAND_COLORS.violet, fontSize: 24 }} />,
            onClick: () => navigate("/random-video"),
        },
        {
            id: "profile",
            title: "Profile",
            subtitle: "View and edit profile",
            icon: <PersonRoundedIcon sx={{ color: "#9CA3AF", fontSize: 24 }} />,
            onClick: () => navigate("/profile"),
        },
        {
            id: "settings",
            title: "Settings",
            subtitle: "Account and preferences",
            icon: <SettingsRoundedIcon sx={{ color: "#9CA3AF", fontSize: 24 }} />,
            onClick: () => setSettingsModalOpen(true),
        },
        {
            id: "support",
            title: "Help & Support",
            subtitle: "Get help or contact us",
            icon: <HelpOutlineRoundedIcon sx={{ color: "#9CA3AF", fontSize: 24 }} />,
            onClick: () => setSupportModalOpen(true),
        },
    ];

    const plusPerks = [
        "Ad-Free Premium Experience (Coming Soon)",
        "Priority Profile Matching (In Development)",
        "Extended Discovery Radius (Planned)",
        "Advanced Conversation Insights (Planned)",
    ];

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, pb: { xs: 12, md: 6 } }}>
            {/* Unified Bottom Navigation Dock */}
            <Navbar hideTopNav={true} />

            <Container maxWidth="sm" sx={{ pt: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
                {/* 1. TOP USER PROFILE HEADER */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                        cursor: "pointer",
                    }}
                    onClick={() => navigate("/profile")}
                >
                    <Avatar
                        src={userData?.photos?.[0]}
                        alt={userData?.name}
                        sx={{
                            width: 68,
                            height: 68,
                            border: `2.5px solid ${BRAND_COLORS.coralPink}`,
                            boxShadow: "0 4px 18px rgba(253, 58, 115, 0.4)",
                        }}
                    >
                        {userData?.name?.charAt(0) || "U"}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                                {userData?.name || "Member"}
                            </Typography>
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{
                                color: BRAND_COLORS.textSecondary,
                                transition: "color 0.2s ease",
                                "&:hover": { color: "#FFFFFF" },
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Edit Profile
                            </Typography>
                            <ArrowForwardIosRoundedIcon sx={{ fontSize: 13 }} />
                        </Stack>
                    </Box>
                </Box>

                {/* 2. ENGAZE PLUS GRADIENT HERO BANNER */}
                <Paper
                    elevation={6}
                    onClick={() => setPlusModalOpen(true)}
                    sx={{
                        p: { xs: 2.2, sm: 2.8 },
                        borderRadius: "24px",
                        background: BRAND_COLORS.engazePlusGradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        mb: 3,
                        cursor: "pointer",
                        boxShadow: "0 12px 35px rgba(253, 58, 115, 0.4)",
                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        "&:hover": {
                            transform: "translateY(-3px) scale(1.01)",
                            boxShadow: "0 16px 45px rgba(253, 58, 115, 0.55)",
                        },
                        "&:active": {
                            transform: "scale(0.98)",
                        },
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                bgcolor: "rgba(255, 255, 255, 0.2)",
                                backdropFilter: "blur(10px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <WorkspacePremiumRoundedIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: "#FFFFFF", lineHeight: 1.2 }}>
                                Engaze Plus (Coming Soon)
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.8rem", fontWeight: 500 }}>
                                Preview upcoming premium features
                            </Typography>
                        </Box>
                    </Box>

                    <ArrowForwardIosRoundedIcon sx={{ color: "#FFFFFF", fontSize: 18, mr: 0.5 }} />
                </Paper>

                {/* 3. VERTICAL MENU NAVIGATION LIST */}
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: "24px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        overflow: "hidden",
                        mb: 3,
                    }}
                >
                    <List disablePadding>
                        {menuItems.map((item, idx) => (
                            <React.Fragment key={item.id}>
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={item.onClick}
                                        sx={{
                                            py: 1.6,
                                            px: { xs: 2, sm: 2.5 },
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                bgcolor: "rgba(255, 255, 255, 0.04)",
                                            },
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 46 }}>
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: "50%",
                                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {item.icon}
                                            </Box>
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.98rem" }}>
                                                    {item.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "0.8rem" }}>
                                                    {item.subtitle}
                                                </Typography>
                                            }
                                        />

                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            {item.badge && (
                                                <Box
                                                    sx={{
                                                        px: 1,
                                                        py: 0.2,
                                                        borderRadius: "9999px",
                                                        bgcolor: BRAND_COLORS.coralPink,
                                                        color: "#FFFFFF",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 800,
                                                        boxShadow: "0 2px 8px rgba(253, 58, 115, 0.5)",
                                                    }}
                                                >
                                                    {item.badge}
                                                </Box>
                                            )}
                                            <ArrowForwardIosRoundedIcon sx={{ fontSize: 14, color: BRAND_COLORS.textSecondary }} />
                                        </Stack>
                                    </ListItemButton>
                                </ListItem>
                                {idx < menuItems.length - 1 && (
                                    <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.04)", mx: 2 }} />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </Card>

                {/* 4. BOTTOM ACTION CARD: UPGRADE TO ENGAZE PLUS */}
                <Paper
                    elevation={0}
                    onClick={() => setPlusModalOpen(true)}
                    sx={{
                        p: 2,
                        borderRadius: "20px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: "1px solid rgba(245, 158, 11, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            bgcolor: "rgba(245, 158, 11, 0.08)",
                            borderColor: BRAND_COLORS.gold,
                        },
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <WorkspacePremiumRoundedIcon sx={{ color: BRAND_COLORS.gold, fontSize: 24 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                            Upgrade to Engaze Plus
                        </Typography>
                    </Stack>
                    <ArrowForwardIosRoundedIcon sx={{ fontSize: 14, color: BRAND_COLORS.textSecondary }} />
                </Paper>
            </Container>

            {/* ENGAZE PLUS SUBSCRIPTION DIALOG */}
            <Dialog
                open={plusModalOpen}
                onClose={() => setPlusModalOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        maxWidth: 440,
                        width: "100%",
                        p: { xs: 2.5, sm: 3.5 },
                        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <WorkspacePremiumRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 32 }} />
                            <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF" }}>
                                Engaze Plus (Coming Soon)
                            </Typography>
                        </Stack>
                        <IconButton onClick={() => setPlusModalOpen(false)} size="small" sx={{ color: BRAND_COLORS.textSecondary }}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>

                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                        Premium features are currently in development to enhance your connections safely.
                    </Typography>

                    <Stack spacing={1.8} sx={{ mb: 4 }}>
                        {plusPerks.map((perk, i) => (
                            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                                <CheckCircleRoundedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 20 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#FFFFFF" }}>
                                    {perk}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>

                    <Button
                        variant="contained"
                        fullWidth
                        disabled
                        sx={{
                            borderRadius: "9999px",
                            py: 1.5,
                            fontWeight: 800,
                            fontSize: "1rem",
                            mb: 1.5,
                            bgcolor: "rgba(255, 255, 255, 0.08)",
                            color: "rgba(255, 255, 255, 0.5)",
                        }}
                    >
                        Premium Tier (In Development)
                    </Button>

                    <Button
                        variant="text"
                        fullWidth
                        onClick={() => setPlusModalOpen(false)}
                        sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 700 }}
                    >
                        Close
                    </Button>
                </DialogContent>
            </Dialog>

            {/* SETTINGS DIALOG */}
            <Dialog
                open={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        maxWidth: 440,
                        width: "100%",
                        p: { xs: 2.5, sm: 3.5 },
                        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#FFFFFF" }}>
                            Account Settings
                        </Typography>
                        <IconButton onClick={() => setSettingsModalOpen(false)} size="small" sx={{ color: BRAND_COLORS.textSecondary }}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>

                    <Stack spacing={2.5} sx={{ mb: 4 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ pr: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF" }}>
                                        Push Notifications
                                    </Typography>
                                    <Chip label="Coming Soon" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(255, 255, 255, 0.08)", color: BRAND_COLORS.textSecondary }} />
                                </Stack>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    In-app notifications are active. Native push delivery is in development.
                                </Typography>
                            </Box>
                            <Switch disabled checked={false} />
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ pr: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF" }}>
                                    Read Receipts
                                </Typography>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Double checkmarks indicate delivery and read status in active chat
                                </Typography>
                            </Box>
                            <Chip label="Active" size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: "rgba(16, 185, 129, 0.15)", color: BRAND_COLORS.emerald }} />
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ pr: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF" }}>
                                        Incognito Discovery
                                    </Typography>
                                    <Chip label="Coming Soon" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(255, 255, 255, 0.08)", color: BRAND_COLORS.textSecondary }} />
                                </Stack>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Private browsing mode is currently in development.
                                </Typography>
                            </Box>
                            <Switch disabled checked={false} />
                        </Box>
                    </Stack>

                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<LogoutRoundedIcon />}
                        onClick={() => {
                            setSettingsModalOpen(false);
                            handleLogout();
                        }}
                        sx={{
                            borderRadius: "9999px",
                            py: 1.2,
                            color: "#EF4444",
                            borderColor: "rgba(239, 68, 68, 0.3)",
                            fontWeight: 700,
                            "&:hover": {
                                bgcolor: "rgba(239, 68, 68, 0.1)",
                                borderColor: "#EF4444",
                            },
                        }}
                    >
                        Log Out of Engaze
                    </Button>
                </DialogContent>
            </Dialog>

            {/* SUPPORT DIALOG */}
            <Dialog
                open={supportModalOpen}
                onClose={() => setSupportModalOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        maxWidth: 400,
                        width: "100%",
                        p: { xs: 2.5, sm: 3.5 },
                        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#FFFFFF" }}>
                            Help & Support
                        </Typography>
                        <IconButton onClick={() => setSupportModalOpen(false)} size="small" sx={{ color: BRAND_COLORS.textSecondary }}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>

                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3 }}>
                        Need help with your account, reporting safety concerns, or video meet? Our support team is here 24/7.
                    </Typography>

                    <Stack spacing={1.5}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => window.open("mailto:support@engaze.com", "_blank")}
                            sx={{
                                borderRadius: "9999px",
                                py: 1.2,
                                color: "#FFFFFF",
                                borderColor: BRAND_COLORS.surfaceDarkBorder,
                                fontWeight: 700,
                            }}
                        >
                            Email Support: support@engaze.com
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setSupportModalOpen(false)}
                            sx={{
                                background: BRAND_COLORS.primaryGradient,
                                borderRadius: "9999px",
                                py: 1.2,
                                fontWeight: 700,
                            }}
                        >
                            Close
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default withAuth(HomeComponent);