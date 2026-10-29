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
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";

export default function TermsOfService() {
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
                            bgcolor: "rgba(139, 92, 246, 0.1)",
                            border: "1px solid rgba(139, 92, 246, 0.25)",
                            color: BRAND_COLORS.violet,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        <GavelRoundedIcon sx={{ fontSize: 16 }} />
                        ENGZ-LEGAL-TOS-01
                    </Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", sm: "3rem" }, fontWeight: 900, mb: 1.5, letterSpacing: "-0.03em", color: BRAND_COLORS.deepNavy }}>
                        Terms of Service
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                        Effective Date: October 2026 &bull; Canonical URL: https://www.engaze.date/terms
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
                        Notice: Preliminary Terms of Service Draft
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#78350F", fontSize: "0.85rem", lineHeight: 1.6 }}>
                        These terms define the current user agreement and operational rules for the Engaze dating platform (https://www.engaze.date/). Formally designated operating corporate entity details and governing legal jurisdiction are subject to corporate filing by the platform administration. Inquiries may be directed to contact@engaze.date.
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
                                1. Agreement to Terms
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                By creating an account, accessing, or using Engaze (available at <strong>https://www.engaze.date/</strong>), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all provisions of these Terms, you may not access or use the platform.
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textMuted, mt: 1 }}>
                                <em>Operating Entity: Engaze Dating Platform &bull; Corporate filing details and governing jurisdiction are maintained under platform administration and available via contact@engaze.date.</em>
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                2. Eligibility & Age Verification
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                You must be at least eighteen (18) years old to create an account or use Engaze. By accessing our services, you warrant and represent that you are at least 18 years of age and possess the legal authority to enter into this agreement.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                3. Member Accounts & Safety
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Accurate Information:</strong> You agree to provide truthful, authentic information and accurate profile pictures representing yourself.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Account Security:</strong> You are responsible for safeguarding your login credentials and are liable for all activities under your account.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>One Account Per Person:</strong> Users may maintain only one active individual profile. Impersonation of another person is strictly prohibited.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                4. Code of Conduct & Prohibited Acts
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                Engaze enforces a zero-tolerance policy against malicious or non-consensual behavior:
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; No harassment, hate speech, bullying, defamation, or stalking of other members.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; No solicitation of money, financial fraud, investment pitches, commercial advertising, or scamming.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; No non-consensual sharing of private communications, photos, or media captured during calls.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; No automated scraping, bot generation, reverse engineering, or unauthorized access to platform servers.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                5. Termination & Suspension
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                We reserve the right to suspend or permanently terminate your account without notice if we detect violations of these Terms, community safety policies, or fraudulent conduct.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(20, 43, 69, 0.08)" }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: BRAND_COLORS.deepNavy }}>
                                6. Inquiries & Legal Notices
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                For any legal inquiries, copyright notices, or questions regarding these Terms, contact our platform administration:
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.brandBlue, fontWeight: 700 }}>
                                    Legal Department: contact@engaze.date
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.brandBlueHover, fontWeight: 700 }}>
                                    Customer Support: support@engaze.date
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
                    &copy; {new Date().getFullYear()} Engaze.com &bull; All Rights Reserved. &bull; <Link to="/privacy" style={{ color: BRAND_COLORS.brandBlue, textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link> &bull; <Link to="/safety" style={{ color: BRAND_COLORS.brandBlue, textDecoration: "none", fontWeight: 600 }}>Safety Center</Link>
                </Typography>
            </Box>
        </Box>
    );
}
