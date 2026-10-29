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

export default function SafetyCenter() {
    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F7FAFE", color: BRAND_COLORS.deepNavy, overflowX: "hidden" }}>
            {/* Top Navigation Bar */}
            <Box
                component="header"
                sx={{
                    px: { xs: 2, sm: 4, md: 8 },
                    py: { xs: 1.8, md: 2.2 },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(20, 43, 69, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(20px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    boxShadow: "0 2px 14px rgba(20, 43, 69, 0.04)",
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
                            color: BRAND_COLORS.deepNavy,
                            borderRadius: 9999,
                            px: 2.5,
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": { color: BRAND_COLORS.brandBlue, bgcolor: "rgba(37, 137, 216, 0.08)" },
                        }}
                    >
                        Home
                    </Button>
                    <Button
                        component={Link}
                        to="/auth"
                        variant="contained"
                        sx={{
                            bgcolor: BRAND_COLORS.brandBlue,
                            color: "#FFFFFF",
                            borderRadius: 9999,
                            px: 3,
                            py: 0.9,
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            textTransform: "none",
                            boxShadow: "0 4px 14px rgba(37, 137, 216, 0.32)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: BRAND_COLORS.brandBlueHover,
                                boxShadow: "0 6px 20px rgba(37, 137, 216, 0.42)",
                                transform: "translateY(-1px)",
                            },
                        }}
                    >
                        Sign In / Join
                    </Button>
                </Stack>
            </Box>

            {/* Document Header */}
            <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 6, md: 10 } }}>
                <Box sx={{ mb: 6, textAlign: "center", maxWidth: 760, mx: "auto" }}>
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.8,
                            py: 0.6,
                            borderRadius: 9999,
                            bgcolor: "rgba(16, 185, 129, 0.1)",
                            border: "1px solid rgba(16, 185, 129, 0.25)",
                            color: BRAND_COLORS.emerald,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
                        ENGZ-SAFETY-GUIDE-01
                    </Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", sm: "3.2rem" }, fontWeight: 900, mb: 2, letterSpacing: "-0.03em", color: BRAND_COLORS.deepNavy }}>
                        Safety & Community Guidelines
                    </Typography>
                    <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, fontSize: "1.1rem", lineHeight: 1.6 }}>
                        Dating should be fun, respectful, and safe. Learn about Engaze's built-in privacy architecture and best practices for online and real-life connections.
                    </Typography>
                </Box>

                {/* Built-in Safety Features Grid */}
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3.5, textAlign: "center", color: BRAND_COLORS.deepNavy }}>
                    Platform Safety Built by Design
                </Typography>

                <Grid container spacing={3.5} sx={{ mb: 8 }}>
                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(20, 43, 69, 0.08)",
                                boxShadow: "0 10px 30px rgba(20, 43, 69, 0.04)",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "16px",
                                    bgcolor: "rgba(255, 90, 112, 0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2.5,
                                }}
                            >
                                <FavoriteRoundedIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                1. Mutual-Opt-In Matching
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Nobody can initiate a chat or call with you unless both of you swipe right. This structural rule prevents unsolicited messages, harassment, and unwanted cold contacts from ever entering your inbox.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(20, 43, 69, 0.08)",
                                boxShadow: "0 10px 30px rgba(20, 43, 69, 0.04)",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "16px",
                                    bgcolor: "rgba(139, 92, 246, 0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2.5,
                                }}
                            >
                                <VideocamRoundedIcon sx={{ color: BRAND_COLORS.violet, fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                2. Browser 1-on-1 Video Dates
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Verify that a match looks and sounds like their profile before exchanging phone numbers or meeting in person. Powered by peer-to-peer WebRTC connections without sharing your personal phone number or social handles.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                height: "100%",
                                borderRadius: "24px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(20, 43, 69, 0.08)",
                                boxShadow: "0 10px 30px rgba(20, 43, 69, 0.04)",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "16px",
                                    bgcolor: "rgba(16, 185, 129, 0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2.5,
                                }}
                            >
                                <LockOutlinedIcon sx={{ color: BRAND_COLORS.emerald, fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                3. Zero-Call-Recording Policy
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, lineHeight: 1.7 }}>
                                Engaze never records, monitors, or saves your video or audio conversations. Real-time media feeds travel directly between peer browsers via WebRTC encryption, preserving your privacy at all times.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Practical Advice Container */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 5, md: 6 },
                        borderRadius: "24px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(20, 43, 69, 0.08)",
                        boxShadow: "0 10px 36px rgba(20, 43, 69, 0.05)",
                        lineHeight: 1.8,
                        mb: 6,
                    }}
                >
                    <Stack spacing={4}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                Best Practices for Online Dating
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Keep Personal Info Private:</strong> Do not share your home address, workplace, financial details, or bank information with anyone you meet online.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Stay on the Platform Initially:</strong> Use Engaze's messaging and built-in video calling to establish chemistry before offering third-party social media or phone numbers.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Never Send Money:</strong> Never transfer funds, cryptocurrency, or gift cards to anyone you meet online, regardless of their circumstances or story.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                Guidelines for In-Person Dates
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Meet in Public:</strong> Always plan your first few dates in populated, public locations such as a cafe, restaurant, or park during daytime or busy evening hours.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Inform a Friend:</strong> Let a friend or family member know who you are meeting, where you will be, and when you expect to return.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Control Your Own Transportation:</strong> Arrange your own ride to and from the date so you have total autonomy to leave at any moment you choose.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                Reporting & Blocking Disruptive Behavior
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                You have full control over who can interact with you on Engaze:
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Instant Block:</strong> You can block any match at any time from their profile or chat menu. Blocking immediately removes the connection and prevents further messages or call attempts.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Report Concerns:</strong> If another member engages in harassment, hate speech, inappropriate behavior, or scamming, report them immediately through the Safety Action dialog or via email to <strong>safety@engaze.date</strong>.
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            </Container>

            {/* Clean Footer */}
            <Box
                component="footer"
                sx={{
                    py: 4,
                    borderTop: "1px solid rgba(20, 43, 69, 0.08)",
                    textAlign: "center",
                    backgroundColor: "#FFFFFF",
                }}
            >
                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                    &copy; {new Date().getFullYear()} Engaze.com &bull; All Rights Reserved. &bull; <Link to="/privacy" style={{ color: BRAND_COLORS.brandBlue, textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link> &bull; <Link to="/terms" style={{ color: BRAND_COLORS.brandBlue, textDecoration: "none", fontWeight: 600 }}>Terms of Service</Link>
                </Typography>
            </Box>
        </Box>
    );
}
