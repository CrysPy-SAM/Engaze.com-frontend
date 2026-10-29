import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import CompassCalibrationRoundedIcon from "@mui/icons-material/CompassCalibrationRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#F7FAFE",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Navbar hideBottomNav={false} />

            {/* Ambient Background Glows */}
            <Box
                sx={{
                    position: "absolute",
                    top: "15%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: { xs: 320, sm: 540 },
                    height: { xs: 320, sm: 540 },
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(37, 137, 216, 0.12) 0%, rgba(184, 167, 255, 0.08) 50%, transparent 75%)",
                    filter: "blur(60px)",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            <Container
                maxWidth="sm"
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                    px: 3,
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Visual Icon Badge */}
                <Box
                    sx={{
                        width: 96,
                        height: 96,
                        borderRadius: "28px",
                        background: "#FFFFFF",
                        border: "1px solid rgba(20, 43, 69, 0.08)",
                        boxShadow: "0 12px 32px rgba(20, 43, 69, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 3,
                    }}
                >
                    <CompassCalibrationRoundedIcon
                        sx={{
                            fontSize: 48,
                            color: BRAND_COLORS.brandBlue,
                        }}
                    />
                </Box>

                {/* 404 Headline */}
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: { xs: "3.5rem", sm: "4.5rem" },
                        fontWeight: 900,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                        background: BRAND_COLORS.primaryGradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mb: 1.5,
                    }}
                >
                    404
                </Typography>

                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 800,
                        color: BRAND_COLORS.deepNavy,
                        mb: 1.5,
                        fontSize: { xs: "1.4rem", sm: "1.75rem" },
                    }}
                >
                    Lost in the Crowd?
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: BRAND_COLORS.textSecondary,
                        maxWidth: 420,
                        mb: 4,
                        lineHeight: 1.6,
                    }}
                >
                    The page or link you are looking for does not exist, has been moved, or is no longer available.
                </Typography>

                {/* Navigation CTA Buttons */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<WhatshotRoundedIcon />}
                        onClick={() => navigate("/discovery")}
                        sx={{
                            px: 3.5,
                            py: 1.4,
                            fontWeight: 700,
                        }}
                    >
                        Explore Discover
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<HomeRoundedIcon />}
                        onClick={() => navigate("/")}
                        sx={{
                            px: 3.5,
                            py: 1.4,
                            color: BRAND_COLORS.deepNavy,
                            borderColor: "rgba(20, 43, 69, 0.16)",
                            borderRadius: 9999,
                            fontWeight: 600,
                            "&:hover": {
                                borderColor: BRAND_COLORS.brandBlue,
                                bgcolor: "rgba(37, 137, 216, 0.06)",
                            },
                        }}
                    >
                        Return Home
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
}
