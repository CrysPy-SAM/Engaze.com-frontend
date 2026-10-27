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
                            background: BRAND_COLORS.primaryGradient,
                            borderRadius: 9999,
                            px: 3,
                            py: 0.9,
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            textTransform: "none",
                        }}
                    >
                        Sign In / Join
                    </Button>
                </Stack>
            </Box>

            {/* Document Header */}
            <Container maxWidth="md" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 6, md: 10 } }}>
                <Box sx={{ mb: 5 }}>
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.8,
                            py: 0.6,
                            borderRadius: 9999,
                            bgcolor: "rgba(139, 92, 246, 0.12)",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            color: BRAND_COLORS.violet,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        <GavelRoundedIcon sx={{ fontSize: 16 }} />
                        ENGZ-LEGAL-TOS-01
                    </Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", sm: "3rem" }, fontWeight: 900, mb: 1.5, letterSpacing: "-0.03em" }}>
                        Terms of Service
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.textMuted }}>
                        Effective Date: October 2026 &bull; Canonical URL: https://www.engaze.date/terms
                    </Typography>
                </Box>

                {/* Content Paper */}
                <Paper
                    sx={{
                        p: { xs: 3, sm: 5, md: 6 },
                        borderRadius: "24px",
                        backgroundColor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        lineHeight: 1.8,
                    }}
                >
                    <Stack spacing={4}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                1. Agreement to Terms
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                By creating an account, accessing, or using Engaze (available at <strong>https://www.engaze.date/</strong>), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all provisions of these Terms, you may not access or use the platform.
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textMuted, mt: 1 }}>
                                <em>Operating Entity: [Insert Legal Entity Name, e.g. Engaze Operating Entity] | Jurisdiction: [Insert Jurisdiction, e.g. Delaware, USA / India]</em>
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                2. Eligibility & Age Verification
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                You must be at least eighteen (18) years old to create an account or use Engaze. By accessing our services, you warrant and represent that you are at least 18 years of age and possess the legal authority to enter into this agreement.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                3. Member Accounts & Safety
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Accuracy:</strong> You agree to provide true, accurate, and current information on your profile and not misrepresent your age, gender, or identity.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Account Security:</strong> You are responsible for safeguarding your login credentials and for all activities that occur under your account.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>One Person per Account:</strong> Each user may maintain only one active account. Account sharing or transferring is strictly prohibited.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                4. Community Standards & Prohibited Conduct
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                Engaze maintains a strict zero-tolerance policy for abuse, exploitation, and illegal behavior. You expressly agree not to:
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; Harass, stalk, threaten, intimidate, or bully any other member.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; Upload or transmit sexually explicit, non-consensual, hate speech, or violent content.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; <strong>Record, screenshot, or broadcast 1-on-1 video calls</strong> without the express prior written consent of all call participants.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; Solicit money, financial assistance, investments, or commercial advertising from other members.
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                    &bull; Use automated scripts, bots, spiders, or scrapers to extract data or automate interactions on the platform.
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                5. Termination & Suspension
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                We reserve the right, at our sole discretion, to suspend or permanently terminate your account and remove your profile content immediately if you violate these Terms, harass other members, or engage in behavior deemed harmful to the community.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                6. Disclaimers & Limitation of Liability
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary }}>
                                Engaze is provided on an "as is" and "as available" basis without warranties of any kind. While we incorporate mutual matching controls and user-reporting tools, Engaze does not conduct formal criminal background checks on all members. You are solely responsible for exercising caution and following personal safety guidelines when interacting with other members online or offline.
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: BRAND_COLORS.surfaceDarkBorder }} />

                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#FFFFFF" }}>
                                7. Contact Information
                            </Typography>
                            <Typography variant="body1" sx={{ color: BRAND_COLORS.textSecondary, mb: 1.5 }}>
                                If you have questions regarding these Terms or need to report a legal issue:
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 700 }}>
                                Customer Support: support@engaze.date
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.violet, fontWeight: 700 }}>
                                Legal / Business Enquiries: contact@engaze.date
                            </Typography>
                        </Box>
                    </Stack>
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
                    &copy; {new Date().getFullYear()} Engaze.com &bull; All Rights Reserved. &bull; <Link to="/privacy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Privacy Policy</Link> &bull; <Link to="/safety" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Safety Center</Link>
                </Typography>
            </Box>
        </Box>
    );
}

