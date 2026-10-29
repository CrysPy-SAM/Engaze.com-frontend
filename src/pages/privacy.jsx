import React from "react";
import { Link } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Stack,
    Button,
    Paper,
    Divider,
} from "@mui/material";
import { BRAND_COLORS } from "../theme";
import EngazeLogo from "../components/EngazeLogo";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

export default function PrivacyPolicy() {
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
            <Container maxWidth="md" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 6, md: 10 } }}>
                <Box sx={{ mb: 4 }}>
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.8,
                            py: 0.6,
                            borderRadius: 9999,
                            bgcolor: "rgba(37, 137, 216, 0.1)",
                            border: "1px solid rgba(37, 137, 216, 0.25)",
                            color: BRAND_COLORS.brandBlue,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
                        ENGZ-LEGAL-POL-01
                    </Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", sm: "3rem" }, fontWeight: 900, mb: 1.5, letterSpacing: "-0.03em", color: BRAND_COLORS.deepNavy }}>
                        Privacy Policy
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                        Effective Date: October 2026 &bull; Canonical URL: https://www.engaze.date/privacy
                    </Typography>
                </Box>

                {/* Notice of Draft Status / Entity Details Pending */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 4,
                        borderRadius: "16px",
                        backgroundColor: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.25)",
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: "#B45309", fontWeight: 800, mb: 0.5 }}>
                        Notice: Preliminary Operational Policy Draft
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#78350F", fontSize: "0.85rem", lineHeight: 1.6 }}>
                        This document details the current technical and data protection practices of the Engaze platform (https://www.engaze.date/). Designated corporate entity registration details, registered agent contact, and specific governing legal jurisdiction are subject to formal confirmation upon corporate filing by the platform administration. Inquiries may be directed to contact@engaze.date.
                    </Typography>
                </Paper>

                {/* Content Paper */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 5, md: 6 },
                        borderRadius: "24px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(20, 43, 69, 0.08)",
                        boxShadow: "0 10px 36px rgba(20, 43, 69, 0.05)",
                        lineHeight: 1.8,
                    }}
                >
                    <Stack spacing={4}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                1. Overview & Commitment
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                Engaze ("we", "us", or "our"), accessible at <strong>https://www.engaze.date/</strong>, provides an online dating and live video connection service. We respect your personal privacy and are committed to safeguarding the information you share while using our platform. This Privacy Policy details what information we collect, how it is used, and the privacy controls available to you.
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textMuted, mt: 1 }}>
                                <em>Service Operator: Engaze Dating Platform &bull; Corporate filing details and designated legal jurisdiction are maintained under platform administration and available via contact@engaze.date.</em>
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                2. Eligibility & Age Restriction
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                Engaze is strictly intended for individuals who are at least eighteen (18) years of age. We do not knowingly permit account creation, profile publication, or data collection from individuals under the age of 18. If we discover that an account has been registered by a minor, the account and associated data will be promptly terminated.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                3. Information We Collect
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                We collect information necessary to facilitate mutual matchmaking, profile discovery, and real-time communication:
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Account Credentials:</strong> Email address, encrypted password credentials, or Google OAuth profile identifier when signing up via third-party login.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Profile Details:</strong> First name, date of birth / age, gender identity, dating preferences (preferred age range, preferred gender), biography, general location city, and profile photographs you choose to upload.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Mutual Communications:</strong> Messages sent between mutually matched members within our chat system. Messages are stored securely to allow conversation continuity across your devices.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>1-on-1 Video Connections:</strong> Live video and audio calls utilize WebRTC peer-to-peer technology. Media streams travel directly between call participants' browsers. <strong>Engaze does not record, monitor, or store audio or video streams from your calls on our servers.</strong>
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                4. How Your Information is Used
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; To authenticate your account and maintain session security.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; To present profile discovery cards to potential matches according to matching preferences.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; To deliver mutual messages, typing indicators, and read receipts between matched users.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; To facilitate WebRTC video call signaling between connected participants.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; To investigate reports, prevent fraud, enforce community safety guidelines, and block disruptive users.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                5. Information Sharing & Third Parties
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                We do not sell your personal information or profile data to third parties. Information is only shared under limited circumstances:
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2, mt: 1.5 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Public Profile Display:</strong> Your display name, photos, bio, and dating preferences are visible to other registered adult members during discovery. Contact details such as your email are never publicly displayed.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Infrastructure Providers:</strong> We use reputable cloud infrastructure and hosting providers to operate our servers under confidentiality and security agreements.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Legal Compliance:</strong> We may disclose information if required to do so by applicable law, court order, or governmental authority.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                6. Your Rights & Account Deletion
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                You have the right to review, update, or remove your profile information at any time directly through the Profile page. To request permanent account deletion and removal of your personal data, please contact customer support at <strong>support@engaze.date</strong> from your registered email address.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                7. Contact Us
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                For any questions regarding this Privacy Policy, data practices, or account inquiries, you can reach us at:
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.brandBlue, fontWeight: 700 }}>
                                    Customer Support: support@engaze.date
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.brandBlueHover, fontWeight: 700 }}>
                                    General Enquiries: contact@engaze.date
                                </Typography>
                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textMuted, mt: 1, display: "block" }}>
                                    Physical business correspondence address is available upon verified written request to contact@engaze.date.
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
                    &copy; {new Date().getFullYear()} Engaze.com &bull; All Rights Reserved. &bull; <Link to="/terms" style={{ color: BRAND_COLORS.brandBlue, textDecoration: "none", fontWeight: 600 }}>Terms of Service</Link> &bull; <Link to="/safety" style={{ color: BRAND_COLORS.brandBlue, textDecoration: "none", fontWeight: 600 }}>Safety Center</Link>
                </Typography>
            </Box>
        </Box>
    );
}
