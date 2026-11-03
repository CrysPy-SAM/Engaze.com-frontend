import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Stack, Chip } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import EngazeLogo from "./EngazeLogo";
import { AuthContext } from "../contexts/AuthContext";

export default function NativeMobileWelcome() {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useContext(AuthContext);

    // If user is already authenticated, take them straight to discovery
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate("/discovery", { replace: true });
        }
    }, [loading, isAuthenticated, navigate]);

    return (
        <Box
            sx={{
                minHeight: "100dvh",
                bgcolor: "#0B0D17",
                color: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                px: 3,
                pt: "calc(var(--safe-top, 0px) + 20px)",
                pb: "calc(var(--safe-bottom, 0px) + 28px)",
                userSelect: "none",
                background: "radial-gradient(circle at 50% 15%, rgba(253, 58, 115, 0.18) 0%, rgba(11, 13, 23, 0) 55%), radial-gradient(circle at 80% 65%, rgba(37, 137, 216, 0.16) 0%, rgba(11, 13, 23, 0) 60%), #0B0D17",
            }}
        >
            {/* Top Brand Header */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
                <EngazeLogo size={38} fontSize="1.55rem" textColor="#FFFFFF" />
                <Chip
                    label="ROMANTIC CHEMISTRY • LIVE VIDEO"
                    size="small"
                    sx={{
                        mt: 1.2,
                        bgcolor: "rgba(253, 58, 115, 0.12)",
                        color: "#FD3A73",
                        border: "1px solid rgba(253, 58, 115, 0.35)",
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        letterSpacing: "0.06em",
                    }}
                />
            </Box>

            {/* Center Hero Card & Value Proposition */}
            <Box
                sx={{
                    my: "auto",
                    py: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    zIndex: 2,
                }}
            >
                {/* Visual Avatar Stack Preview */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 3,
                        position: "relative",
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            border: "3px solid #FD3A73",
                            bgcolor: "#1F2937",
                            backgroundImage: "url(/images/hero-1.png)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            boxShadow: "0 8px 24px rgba(253, 58, 115, 0.4)",
                            transform: "rotate(-6deg)",
                        }}
                    />
                    <Box
                        sx={{
                            width: 74,
                            height: 74,
                            borderRadius: "50%",
                            border: "3px solid #2589D8",
                            bgcolor: "#111827",
                            backgroundImage: "url(/images/hero-2.png)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            ml: -2.2,
                            zIndex: 3,
                            boxShadow: "0 10px 30px rgba(37, 137, 216, 0.45)",
                            position: "relative",
                        }}
                    >
                        <VerifiedRoundedIcon
                            sx={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                fontSize: 24,
                                color: "#10B981",
                                bgcolor: "#0B0D17",
                                borderRadius: "50%",
                            }}
                        />
                    </Box>
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            border: "3px solid #FF7A00",
                            bgcolor: "#1F2937",
                            backgroundImage: "url(/images/hero-3.png)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            ml: -2.2,
                            boxShadow: "0 8px 24px rgba(255, 122, 0, 0.4)",
                            transform: "rotate(6deg)",
                        }}
                    />
                </Box>

                {/* Catchy Headline */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 900,
                        fontSize: { xs: "2rem", sm: "2.4rem" },
                        lineHeight: 1.15,
                        letterSpacing: "-0.03em",
                        color: "#FFFFFF",
                        mb: 1.2,
                    }}
                >
                    Real Chemistry.
                    <Box
                        component="span"
                        sx={{
                            display: "block",
                            background: "linear-gradient(135deg, #FD3A73 0%, #FF7A00 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        Face to Face.
                    </Box>
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: "#9CA3AF",
                        fontSize: "0.92rem",
                        lineHeight: 1.5,
                        maxWidth: 320,
                        mb: 3,
                    }}
                >
                    Match mutually, chat without cold spam, and meet over secure 1-on-1 video dates before trading numbers.
                </Typography>

                {/* 3 Native Highlights */}
                <Stack spacing={1} sx={{ width: "100%", maxWidth: 320 }}>
                    {[
                        { icon: <ShieldOutlinedIcon sx={{ fontSize: 18, color: "#10B981" }} />, text: "100% Verified Adult Singles" },
                        { icon: <FavoriteRoundedIcon sx={{ fontSize: 18, color: "#FD3A73" }} />, text: "Mutual Matches Only — Zero Cold Spam" },
                        { icon: <VideocamRoundedIcon sx={{ fontSize: 18, color: "#2589D8" }} />, text: "Encrypted 1-on-1 Video Vibe Checks" },
                    ].map((item, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.2,
                                bgcolor: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "14px",
                                px: 1.8,
                                py: 0.9,
                            }}
                        >
                            {item.icon}
                            <Typography sx={{ fontSize: "0.80rem", fontWeight: 700, color: "#E2E8F0" }}>
                                {item.text}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Box>

            {/* Bottom Floating Action Dock */}
            <Box sx={{ width: "100%", maxWidth: 360, mx: "auto", zIndex: 2 }}>
                <Stack spacing={1.5}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate("/auth?mode=register")}
                        sx={{
                            height: 54,
                            borderRadius: "9999px",
                            fontWeight: 800,
                            fontSize: "1rem",
                            textTransform: "none",
                            background: "linear-gradient(135deg, #FD3A73 0%, #FF7A00 100%)",
                            boxShadow: "0 8px 26px rgba(253, 58, 115, 0.45)",
                            color: "#FFFFFF",
                            transition: "transform 0.15s ease",
                            "&:active": {
                                transform: "scale(0.98)",
                            },
                        }}
                    >
                        Create Free Account
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate("/auth?mode=login")}
                        sx={{
                            height: 50,
                            borderRadius: "9999px",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            textTransform: "none",
                            borderColor: "rgba(255, 255, 255, 0.22)",
                            color: "#FFFFFF",
                            bgcolor: "rgba(255, 255, 255, 0.04)",
                            backdropFilter: "blur(10px)",
                            transition: "all 0.15s ease",
                            "&:hover": {
                                borderColor: "#FD3A73",
                                bgcolor: "rgba(253, 58, 115, 0.08)",
                            },
                            "&:active": {
                                transform: "scale(0.98)",
                            },
                        }}
                    >
                        Sign In
                    </Button>
                </Stack>

                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        textAlign: "center",
                        color: "#6B7280",
                        fontSize: "0.72rem",
                        mt: 2,
                        lineHeight: 1.4,
                    }}
                >
                    By continuing, you confirm you are 18+ and agree to Engaze{" "}
                    <Box
                        component="span"
                        onClick={() => navigate("/terms")}
                        sx={{ color: "#9CA3AF", textDecoration: "underline", cursor: "pointer" }}
                    >
                        Terms
                    </Box>{" "}
                    and{" "}
                    <Box
                        component="span"
                        onClick={() => navigate("/privacy")}
                        sx={{ color: "#9CA3AF", textDecoration: "underline", cursor: "pointer" }}
                    >
                        Privacy Policy
                    </Box>
                    .
                </Typography>
            </Box>
        </Box>
    );
}
