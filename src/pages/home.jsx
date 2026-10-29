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
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";

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
        <Box sx={{ minHeight: "100vh", backgroundColor: "#0A111C", pb: { xs: 12, md: 6 } }}>
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
                            border: "2.5px solid #2589D8",
                            boxShadow: "0 4px 18px rgba(37, 137, 216, 0.25)",
                        }}
                    >
                        {userData?.name?.charAt(0) || "U"}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                            <Typography variant="h5" sx={{ fontWeight: 800, color: BRAND_COLORS.deepNavy, letterSpacing: "-0.02em" }}>
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
                                "&:hover": { color: BRAND_COLORS.brandBlue },
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
                        boxShadow: "0 10px 30px rgba(37, 137, 216, 0.28)",
                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        "&:hover": {
                            transform: "translateY(-3px) scale(1.01)",
                            boxShadow: "0 14px 40px rgba(37, 137, 216, 0.38)",
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
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
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
                                                bgcolor: "rgba(37, 137, 216, 0.08)",
                                            },
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 46 }}>
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: "50%",
                                                    bgcolor: "rgba(37, 137, 216, 0.15)",
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
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.98rem" }}>
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
                                    <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)", mx: 2 }} />
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
                        border: "1px solid rgba(245, 158, 11, 0.25)",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            bgcolor: "rgba(245, 158, 11, 0.12)",
                            borderColor: BRAND_COLORS.gold,
                        },
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <WorkspacePremiumRoundedIcon sx={{ color: BRAND_COLORS.gold, fontSize: 24 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: BRAND_COLORS.deepNavy }}>
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
                        boxShadow: "0 24px 60px rgba(20, 43, 69, 0.15)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <WorkspacePremiumRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 32 }} />
                            <Typography variant="h5" sx={{ fontWeight: 900, color: BRAND_COLORS.deepNavy }}>
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
                                <Typography variant="body2" sx={{ fontWeight: 600, color: BRAND_COLORS.deepNavy }}>
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
                        boxShadow: "0 24px 60px rgba(20, 43, 69, 0.15)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: BRAND_COLORS.deepNavy }}>
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
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_COLORS.deepNavy }}>
                                        Push Notifications
                                    </Typography>
                                    <Chip label="Coming Soon" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(20, 43, 69, 0.06)", color: BRAND_COLORS.textSecondary }} />
                                </Stack>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    In-app notifications are active. Native push delivery is in development.
                                </Typography>
                            </Box>
                            <Switch disabled checked={false} />
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.06)" }} />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ pr: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_COLORS.deepNavy }}>
                                    Read Receipts
                                </Typography>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    Double checkmarks indicate delivery and read status in active chat
                                </Typography>
                            </Box>
                            <Chip label="Active" size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: "rgba(16, 185, 129, 0.15)", color: BRAND_COLORS.emerald }} />
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.06)" }} />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ pr: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_COLORS.deepNavy }}>
                                        Incognito Discovery
                                    </Typography>
                                    <Chip label="Coming Soon" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(20, 43, 69, 0.06)", color: BRAND_COLORS.textSecondary }} />
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
                        maxWidth: 440,
                        width: "100%",
                        p: { xs: 2.5, sm: 3.5 },
                        boxShadow: "0 24px 60px rgba(20, 43, 69, 0.15)",
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: BRAND_COLORS.deepNavy }}>
                            Help & Support
                        </Typography>
                        <IconButton onClick={() => setSupportModalOpen(false)} size="small" sx={{ color: BRAND_COLORS.textSecondary }}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>

                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 3, lineHeight: 1.6 }}>
                        Have questions about your profile, reporting safety concerns, or video meetups? Reach out directly via our official channels:
                    </Typography>

                    <Stack spacing={2} sx={{ mb: 3 }}>
                        {/* Customer Support */}
                        <Box
                            component="a"
                            href="mailto:support@engaze.date"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 2,
                                borderRadius: "16px",
                                bgcolor: BRAND_COLORS.surfaceDarkElevated,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                textDecoration: "none",
                                color: "#FFFFFF",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    bgcolor: "rgba(253, 58, 115, 0.12)",
                                    borderColor: BRAND_COLORS.coralPink,
                                    transform: "translateY(-1px)",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: "12px",
                                    bgcolor: "rgba(253, 58, 115, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <SupportAgentRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 24 }} />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC", mb: 0.2 }}>
                                    Customer Support & Help
                                </Typography>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, display: "block" }}>
                                    support@engaze.date
                                </Typography>
                            </Box>
                        </Box>

                        {/* General Enquiries */}
                        <Box
                            component="a"
                            href="mailto:contact@engaze.date"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 2,
                                borderRadius: "16px",
                                bgcolor: BRAND_COLORS.surfaceDarkElevated,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                textDecoration: "none",
                                color: "#FFFFFF",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    bgcolor: "rgba(139, 92, 246, 0.12)",
                                    borderColor: BRAND_COLORS.violet,
                                    transform: "translateY(-1px)",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: "12px",
                                    bgcolor: "rgba(139, 92, 246, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <EmailRoundedIcon sx={{ color: BRAND_COLORS.violet, fontSize: 22 }} />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC", mb: 0.2 }}>
                                    General & Business Enquiries
                                </Typography>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, display: "block" }}>
                                    contact@engaze.date
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setSupportModalOpen(false)}
                        sx={{
                            background: BRAND_COLORS.primaryGradient,
                            borderRadius: "9999px",
                            py: 1.2,
                            fontWeight: 700,
                            textTransform: "none",
                            fontSize: "0.95rem",
                        }}
                    >
                        Close
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default withAuth(HomeComponent);