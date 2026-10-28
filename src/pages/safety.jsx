import React from "react";
import { Link } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Stack,
    Button,
    Paper,
    Grid,
    Divider,
} from "@mui/material";
import { BRAND_COLORS } from "../theme";
import EngazeLogo from "../components/EngazeLogo";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";

export default function SafetyCenter() {
    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: BRAND_COLORS.bgDark, color: "#FFFFFF", overflowX: "hidden" }}>
            {/* Top Navigation Bar */}
            <Box
                component="header"
                sx={{
                    px: { xs: 2, sm: 4, md: 8 },
                    py: { xs: 1.8, md: 2.2 },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    backgroundColor: "rgba(11, 13, 23, 0.8)",
                    backdropFilter: "blur(20px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Box
                    component={Link}
                    to="/"
                    aria-label="Engaze Homepage"
                    sx={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                >
                    <EngazeLogo size={36} fontSize="1.45rem" />
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        component={Link}
                        to="/"
                        startIcon={<ArrowBackRoundedIcon />}
                        sx={{
                            color: "rgba(255, 255, 255, 0.85)",
                            borderRadius: 9999,
                            px: 2,
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.06)" },
                        }}
                    >
                        Home
                    </Button>
                    <Button
                        component={Link}
                        to="/auth"
                        variant="contained"
                        sx={{
                            bgcolor: BRAND_COLORS.hotPink || "#FD2E7A",
                            color: "#FFFFFF",
                            border: "2px solid #0D0E15",
                            boxShadow: "2.5px 2.5px 0px #0D0E15",
                            borderRadius: 9999,
                            px: 3,
                            py: 0.9,
                            fontSize: "0.9rem",
                            fontWeight: 800,
                            textTransform: "none",
                            transition: "all 0.15s ease",
                            "&:hover": {
                                bgcolor: "#E61A68",
                                boxShadow: "3.5px 3.5px 0px #0D0E15",
                                transform: "translate(-1px, -1px)",
                            },
                        }}
                    >
                        Sign In / Join
                    </Button>
                </Stack>
            </Box>

            {/* Document Header */}
            <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 6, md: 10 } }}>
                <Box sx={{ mb: 6, textAlign: "center", maxWidth: 760, mx: "auto" }}>
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.8,
                            py: 0.6,
                            borderRadius: 9999,
                            bgcolor: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            color: BRAND_COLORS.emerald,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
                        ENGZ-SAFETY-GUIDE-01
                    </Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", sm: "3.2rem" }, fontWeight: 900, mb: 2, letterSpacing: "-0.03em" }}>
                        Safety & Community Guidelines
                    </Typography>
                    <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "1.1rem", lineHeight: 1.6 }}>
                        Dating should be fun, respectful, and safe. Learn about Engaze's built-in privacy architecture and best practices for online and real-life connections.
                    </Typography>
                </Box>

                {/* Built-in Safety Features Grid */}
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, textAlign: "center" }}>
                    Platform Safety Built by Design
                </Typography>

                <Grid container spacing={3.5} sx={{ mb: 8 }}>
                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            }}
                        >
                            <FavoriteRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 36, mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                1. Mutual-Opt-In Matching
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Nobody can initiate a chat or call with you unless both of you swipe right. This structural rule prevents unsolicited messages, harassment, and unwanted cold contacts from ever entering your inbox.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            }}
                        >
                            <VideocamRoundedIcon sx={{ color: BRAND_COLORS.violet, fontSize: 36, mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                2. Browser 1-on-1 Video Dates
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Verify that a match looks and sounds like their profile before exchanging phone numbers or meeting in person. Powered by peer-to-peer WebRTC connections without sharing your personal phone number or social handles.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            }}
                        >
                            <LockOutlinedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 36, mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                3. One-Tap Reporting & Blocking
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                If anyone makes you feel uncomfortable, you can instantly terminate a live call and block or report their profile. Blocked members are immediately prevented from reaching you again.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Practical Safety Tips */}
                <Paper
                    sx={{
                        p: { xs: 3, sm: 5, md: 6 },
                        borderRadius: "28px",
                        backgroundColor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        mb: 8,
                    }}
                >
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: "#FFFFFF" }}>
                        Best Practices for Dating Safely
                    </Typography>

                    <Stack spacing={3.5}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.coralPink, mb: 1 }}>
                                Never Send Money or Financial Information
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Never send money, wire transfers, cryptocurrency, gift cards, or bank details to anyone you meet online — regardless of the reason or emergency claimed. Report anyone who asks for money immediately to support@engaze.date.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.violet, mb: 1 }}>
                                Keep Early Chats on the Engaze Platform
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Keep communications within Engaze's chat and video call features while you are getting to know someone. Avoid sharing your home address, workplace, or personal phone number until mutual trust has been firmly established.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.emerald, mb: 1 }}>
                                Do a Video Vibe Check Before In-Person Meetings
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Take advantage of Engaze's built-in 1-on-1 video call feature before agreeing to meet someone offline. A brief 5-minute video date confirms that your match is genuine and helps you evaluate real chemistry.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.skyBlue, mb: 1 }}>
                                Meet in Public & Tell Someone You Trust
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                When meeting for the first time, choose a populated public location (such as a busy cafe or restaurant). Arrange your own transportation to and from the venue, and inform a friend or family member where you are going and when you expect to return.
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

                {/* Reporting Support Card */}
                <Paper
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: "24px",
                        background: "linear-gradient(135deg, rgba(253, 58, 115, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)",
                        border: "1px solid rgba(253, 58, 115, 0.3)",
                        textAlign: "center",
                    }}
                >
                    <ReportProblemRoundedIcon sx={{ fontSize: 44, color: BRAND_COLORS.coralPink, mb: 1.5 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                        Need to Report Unsafe Behavior?
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, maxWidth: 600, mx: "auto", mb: 3, lineHeight: 1.7 }}>
                        Our moderation team reviews reports of harassment, suspicious profiles, and guideline violations. You can report directly inside the app or email our dedicated support desk.
                    </Typography>
                    <Button
                        component="a"
                        href="mailto:support@engaze.date"
                        variant="contained"
                        sx={{
                            background: BRAND_COLORS.primaryGradient,
                            borderRadius: 9999,
                            px: 4,
                            py: 1.2,
                            fontWeight: 700,
                            textTransform: "none",
                        }}
                    >
                        Email Support: support@engaze.date
                    </Button>
                </Paper>
            </Container>

            {/* Simple Clean Footer */}
            <Box
                component="footer"
                sx={{
                    py: 4,
                    borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    textAlign: "center",
                    backgroundColor: "rgba(11, 13, 23, 0.95)",
                }}
            >
                <Typography variant="body2" sx={{ color: BRAND_COLORS.textMuted }}>
                    &copy; {new Date().getFullYear()} Engaze.com &bull; All Rights Reserved. &bull; <Link to="/privacy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Privacy Policy</Link> &bull; <Link to="/terms" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Terms of Service</Link>
                </Typography>
            </Box>
        </Box>
    );
}

