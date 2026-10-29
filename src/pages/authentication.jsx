import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { AuthContext } from "../contexts/AuthContext";
import {
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VideocamIcon from "@mui/icons-material/Videocam";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import EngazeLogo from "../components/EngazeLogo";

// 3D Liquid Organic Waves matching the Engaze Peach & Warm Ivory theme
const LiquidWaveTopLeft = () => (
    <Box
        component="svg"
        viewBox="0 0 650 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        sx={{
            position: "absolute",
            top: -60,
            left: -80,
            width: { sm: 380, md: 480, lg: 560 },
            height: { sm: 300, md: 380, lg: 440 },
            pointerEvents: "none",
            zIndex: 1,
            filter: "drop-shadow(0 20px 45px rgba(255, 170, 150, 0.32))",
            opacity: 0.9,
        }}
    >
        <defs>
            <linearGradient id="authPeachGradTL1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE8DE" stopOpacity="0.96" />
                <stop offset="45%" stopColor="#FFC8B5" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#FFB39E" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="authPeachGradTL2" x1="15%" y1="10%" x2="85%" y2="85%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#FFD5C6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FFAA94" stopOpacity="0.2" />
            </linearGradient>
            <filter id="authLiquidGlowTL" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path
            d="M-50 -30 Q 120 40 220 180 T 420 280 C 490 350 480 430 380 470 C 260 520 80 440 -30 400 Z"
            fill="url(#authPeachGradTL1)"
        />
        <path
            d="M-40 -20 Q 90 60 170 170 T 320 260 C 370 310 330 370 240 370 C 140 370 40 320 -40 280 Z"
            fill="url(#authPeachGradTL2)"
        />
        <path
            d="M-20 10 Q 70 80 130 160 T 240 230"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.65"
            filter="url(#authLiquidGlowTL)"
        />
    </Box>
);

const LiquidWaveBottomLeft = () => (
    <Box
        component="svg"
        viewBox="0 0 650 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        sx={{
            position: "absolute",
            bottom: -60,
            left: -80,
            width: { sm: 380, md: 480, lg: 560 },
            height: { sm: 300, md: 380, lg: 440 },
            pointerEvents: "none",
            zIndex: 1,
            filter: "drop-shadow(0 -16px 38px rgba(255, 170, 150, 0.28))",
            opacity: 0.88,
        }}
    >
        <defs>
            <linearGradient id="authPeachGradBL1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD4C2" stopOpacity="0.96" />
                <stop offset="45%" stopColor="#FFBEA8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FFF0E8" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="authPeachGradBL2" x1="10%" y1="90%" x2="80%" y2="20%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="50%" stopColor="#FFD7C9" stopOpacity="0.48" />
                <stop offset="100%" stopColor="#FFAE98" stopOpacity="0.12" />
            </linearGradient>
        </defs>
        <path
            d="M-60 550 C 60 520 180 470 260 380 C 350 280 340 180 260 130 C 170 80 50 140 -50 220 Z"
            fill="url(#authPeachGradBL1)"
        />
        <path
            d="M-40 500 C 60 470 160 410 220 340 C 280 260 270 190 200 160 C 130 130 40 180 -40 240 Z"
            fill="url(#authPeachGradBL2)"
        />
        <path
            d="M-20 440 C 60 410 140 360 190 300"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.55"
        />
    </Box>
);

// 3D Translucent Glossy Liquid Pearl Droplet
const LiquidPearlDrop = ({ sx = {}, size = 26 }) => (
    <Box
        sx={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "radial-gradient(circle at 32% 30%, #FFFFFF 0%, #FFE2D6 40%, #FFB6A0 80%, #FF9E85 100%)",
            boxShadow: "0 8px 20px rgba(235, 130, 110, 0.35), inset 0 2px 5px rgba(255, 255, 255, 0.85), inset -1px -2px 4px rgba(220, 100, 80, 0.25)",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1,
            ...sx,
        }}
    />
);

// Subtle hand-drawn SVG doodles matching the Peach/Brand identity
const BurstLines = ({ sx = {}, rotation = 0, color = "#2589D8" }) => (
    <Box
        component="svg"
        viewBox="0 0 44 44"
        sx={{
            width: 32,
            height: 32,
            transform: `rotate(${rotation}deg)`,
            pointerEvents: "none",
            userSelect: "none",
            ...sx,
        }}
    >
        <path d="M8 8L16 16M22 4V14M36 8L28 16" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Box>
);

const HeartDoodle = ({ sx = {}, rotation = 0, color = "#FF7A8A" }) => (
    <Box
        component="svg"
        viewBox="0 0 48 48"
        sx={{
            width: 34,
            height: 34,
            transform: `rotate(${rotation}deg)`,
            pointerEvents: "none",
            userSelect: "none",
            ...sx,
        }}
    >
        <path
            d="M24 37.5C24 37.5 10 27.5 10 18.5C10 13.5 14 9.5 19 9.5C22 9.5 24 11.5 24 11.5C24 11.5 26 9.5 29 9.5C34 9.5 38 13.5 38 18.5C38 27.5 24 37.5 24 37.5Z"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </Box>
);

export default function Authentication() {
    const navigate = useNavigate();
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState("");
    const [formState, setFormState] = React.useState(0); // 0 = Sign In, 1 = Sign Up
    const [loading, setLoading] = React.useState(false);

    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const {
        handleRegister,
        handleLogin,
        handleGoogleLogin,
        isAuthenticated,
        loading: authLoading,
    } = React.useContext(AuthContext);

    // If user is already authenticated, redirect to /home immediately
    React.useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate("/home", { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate]);

    const handleAuth = async () => {
        setError("");
        setLoading(true);

        try {
            if (formState === 0) {
                if (!username || !password) {
                    setError("Please fill in both username and password");
                    setLoading(false);
                    return;
                }
                await handleLogin(username, password);
            } else if (formState === 1) {
                if (!name || !username || !password) {
                    setError("Please fill in all required fields");
                    setLoading(false);
                    return;
                }
                await handleRegister(name, username, password);
            }
        } catch (err) {
            let errorMessage = "An error occurred";
            if (err.response) {
                errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
            } else if (err.message && (err.message.includes("warming up") || err.message.includes("waking up"))) {
                errorMessage = err.message;
            } else if (err.request || err.message === "Network Error") {
                errorMessage = "Cannot reach server. The backend may be waking up (Render cold-start), please wait a moment and try again.";
            } else {
                errorMessage = err.message || "An error occurred";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        setLoading(true);
        try {
            if (!credentialResponse?.credential) {
                throw new Error("No Google credential token received");
            }
            await handleGoogleLogin(credentialResponse.credential);
        } catch (err) {
            console.error("Google sign-in error:", err);
            setError(err.message || "Failed to authenticate with Google. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google sign-in was cancelled or encountered an error. Please try again.");
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !loading) {
            handleAuth();
        }
    };

    return (
        <Grid
            container
            spacing={0}
            component="main"
            sx={{
                minHeight: "100vh",
                bgcolor: "#FFFDFB",
                width: "100%",
                m: 0,
                p: 0,
                overflowX: "hidden",
            }}
        >
            <CssBaseline />

            {/* Left Hero Storytelling Panel (Peach 3D Liquid & Warm Ivory Theme) */}
            <Grid
                item
                xs={false}
                sm={5}
                md={6}
                lg={6.5}
                sx={{
                    position: "relative",
                    background: "radial-gradient(ellipse 90% 85% at 35% 25%, #FFFDFB 0%, #FFF5EE 30%, #FFE9E2 65%, #FFD8C8 100%)",
                    color: "#142B45",
                    display: { xs: "none !important", sm: "flex !important" },
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: { xs: 0, sm: 4, md: 6, lg: 8 },
                    overflow: "hidden",
                    borderRight: { xs: "none", sm: "1px solid rgba(255, 193, 181, 0.45)" },
                    width: { xs: "0px !important", sm: "auto" },
                    minWidth: { xs: 0, sm: "auto" },
                }}
            >
                {/* 3D Liquid Wave Shapes */}
                <LiquidWaveTopLeft />
                <LiquidWaveBottomLeft />

                {/* Soft Radial 3D Liquid Glow Blurs */}
                <Box
                    sx={{
                        position: "absolute",
                        top: -90,
                        left: -90,
                        width: 380,
                        height: 380,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255, 216, 200, 0.75) 0%, rgba(255, 248, 242, 0) 70%)",
                        pointerEvents: "none",
                        filter: "blur(22px)",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: -100,
                        right: -100,
                        width: 400,
                        height: 400,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255, 193, 181, 0.70) 0%, rgba(255, 229, 232, 0) 70%)",
                        pointerEvents: "none",
                        filter: "blur(24px)",
                    }}
                />

                {/* 3D Pearl Droplets */}
                <LiquidPearlDrop sx={{ top: 70, right: 90 }} size={24} />
                <LiquidPearlDrop sx={{ bottom: 130, left: 70 }} size={22} />

                {/* Decorative Brand Doodles */}
                <BurstLines sx={{ position: "absolute", top: 40, right: 60 }} rotation={25} color="#2589D8" />
                <HeartDoodle sx={{ position: "absolute", bottom: 120, right: 80 }} rotation={-12} color="#FF7A8A" />

                {/* Top Navigation Row */}
                <Box sx={{ zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <EngazeLogo
                        size={34}
                        fontSize="1.45rem"
                        textColor="#142B45"
                        onClick={() => navigate("/")}
                    />
                    <Box
                        component={Link}
                        to="/"
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.6,
                            color: "#142B45",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            py: 0.65,
                            px: 1.8,
                            borderRadius: "9999px",
                            bgcolor: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 193, 181, 0.45)",
                            boxShadow: "0 2px 10px rgba(255, 160, 140, 0.12)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: "#FFFFFF",
                                transform: "translateX(-2px)",
                                boxShadow: "0 4px 16px rgba(255, 160, 140, 0.20)",
                                color: "#2589D8",
                            },
                        }}
                    >
                        <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
                        <span>Back to home</span>
                    </Box>
                </Box>

                {/* Central Brand Storytelling & Value Highlights */}
                <Box sx={{ maxWidth: 540, my: "auto", zIndex: 2, position: "relative", py: 4 }}>
                    {/* Badge */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.8,
                            bgcolor: "rgba(255, 255, 255, 0.90)",
                            color: "#2589D8",
                            px: 2,
                            py: 0.65,
                            borderRadius: "9999px",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            border: "1px solid rgba(255, 193, 181, 0.50)",
                            boxShadow: "0 4px 14px rgba(255, 160, 140, 0.10)",
                            mb: 3,
                        }}
                    >
                        <span>✨ A Modern Dating Platform</span>
                    </Box>

                    {/* Headline */}
                    <Typography
                        variant="h2"
                        sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: { sm: "2.6rem", md: "3.4rem", lg: "3.9rem" },
                            fontWeight: 900,
                            lineHeight: 1.08,
                            letterSpacing: "-0.04em",
                            color: "#142B45",
                            mb: 2.2,
                        }}
                    >
                        Real sparks.
                        <Box component="span" sx={{ color: "#2589D8", display: "block" }}>
                            Feel heard.
                        </Box>
                    </Typography>

                    <Typography
                        sx={{
                            color: "#4B5563",
                            fontSize: "1.05rem",
                            fontWeight: 600,
                            lineHeight: 1.6,
                            mb: 4,
                            maxWidth: 480,
                        }}
                    >
                        Join genuine singles testing real-world chemistry through mutual likes, real-time messaging, and secure 1-on-1 video dates.
                    </Typography>

                    {/* Non-colliding Social Vibe Snippet */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.8,
                            bgcolor: "rgba(255, 255, 255, 0.88)",
                            backdropFilter: "blur(16px)",
                            p: 1.8,
                            borderRadius: "20px",
                            border: "1px solid rgba(255, 193, 181, 0.45)",
                            boxShadow: "0 10px 30px rgba(255, 140, 110, 0.10)",
                            mb: 3.5,
                            maxWidth: 460,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box
                                component="img"
                                src={process.env.PUBLIC_URL + "/images/hero-1.png"}
                                alt="Member"
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    border: "2.5px solid #FFFFFF",
                                    bgcolor: "#FFD8C8",
                                    objectFit: "cover",
                                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                                }}
                            />
                            <Box
                                component="img"
                                src={process.env.PUBLIC_URL + "/images/hero-2.png"}
                                alt="Member"
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    border: "2.5px solid #FFFFFF",
                                    bgcolor: "#FFC1B5",
                                    objectFit: "cover",
                                    ml: -1.4,
                                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.3 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#142B45" }}>
                                    Live Video Vibe Check
                                </Typography>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                            </Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: "#64748B" }}>
                                “Coffee & banter this weekend?” ☕
                            </Typography>
                        </Box>
                    </Box>

                    {/* Features checklist pills (Clean vertical stack with delicate modern styling) */}
                    <Stack spacing={1.5}>
                        {[
                            {
                                icon: <FavoriteIcon sx={{ color: "#FF5A70", fontSize: 18 }} />,
                                text: "Mutual match discovery — zero unsolicited cold spam",
                            },
                            {
                                icon: <VideocamIcon sx={{ color: "#2589D8", fontSize: 18 }} />,
                                text: "Encrypted 1-on-1 browser video dating before phone numbers",
                            },
                            {
                                icon: <ShieldOutlinedIcon sx={{ color: "#10B981", fontSize: 18 }} />,
                                text: "Adult 18+ verified community with active moderation",
                            },
                        ].map((item, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    backgroundColor: "rgba(255, 255, 255, 0.90)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(255, 193, 181, 0.45)",
                                    boxShadow: "0 4px 14px rgba(255, 140, 110, 0.08)",
                                    borderRadius: "9999px",
                                    px: 2,
                                    py: 0.85,
                                    color: "#142B45",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    width: "fit-content",
                                }}
                            >
                                {item.icon}
                                <span>{item.text}</span>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Footer caption */}
                <Typography variant="caption" sx={{ color: "#64748B", zIndex: 2, fontWeight: 600 }}>
                    © {new Date().getFullYear()} Engaze. All rights reserved. Strictly 18+ adult dating platform.
                </Typography>
            </Grid>

            {/* Right Form Card Section (Warm Ivory & Polished Modern Card) */}
            <Grid
                item
                xs={12}
                sm={7}
                md={6}
                lg={5.5}
                sx={{
                    bgcolor: "#FFFDFB",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    p: { xs: 2, sm: 4, md: 6, lg: 8 },
                    boxSizing: "border-box",
                    width: "100%",
                    maxWidth: "100%",
                }}
            >
                <Box
                    sx={{
                        maxWidth: 440,
                        width: "100%",
                        bgcolor: "#FFFFFF",
                        p: { xs: 2.5, sm: 4.5 },
                        borderRadius: { xs: "22px", sm: "28px" },
                        boxShadow: "0 18px 50px rgba(255, 160, 140, 0.12)",
                        border: "1px solid rgba(255, 193, 181, 0.35)",
                        boxSizing: "border-box",
                        mx: "auto",
                    }}
                >
                    {/* Mobile Brand Header */}
                    <Box
                        sx={{
                            display: { xs: "flex", sm: "none" },
                            flexDirection: "column",
                            alignItems: "center",
                            mb: 3,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", mb: 2 }}>
                            <EngazeLogo
                                size={32}
                                fontSize="1.35rem"
                                textColor="#142B45"
                                onClick={() => navigate("/")}
                            />
                            <Box
                                component={Link}
                                to="/"
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    color: "#2589D8",
                                    fontWeight: 700,
                                    fontSize: "0.80rem",
                                    textDecoration: "none",
                                }}
                            >
                                <ArrowBackRoundedIcon sx={{ fontSize: 14 }} />
                                <span>Home</span>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                bgcolor: "rgba(255, 233, 226, 0.6)",
                                color: "#2589D8",
                                px: 1.8,
                                py: 0.45,
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                border: "1px solid rgba(255, 193, 181, 0.40)",
                            }}
                        >
                            Real Connections • Mutual Matches Only
                        </Box>
                    </Box>

                    {/* Form Title & Description */}
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 900,
                                color: "#142B45",
                                fontSize: { xs: "1.75rem", sm: "2.1rem" },
                                letterSpacing: "-0.03em",
                                mb: 0.8,
                            }}
                        >
                            {formState === 0 ? "Welcome back!" : "Create account"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.90rem", fontWeight: 600, lineHeight: 1.5 }}>
                            {formState === 0
                                ? "Enter your credentials to access your matches and live video dates."
                                : "Join Engaze today to find genuine connections with mutual likes."}
                        </Typography>
                    </Box>

                    {/* Clean Segmented Tab Switcher */}
                    <Box
                        sx={{
                            display: "flex",
                            p: 0.6,
                            borderRadius: "9999px",
                            bgcolor: "rgba(255, 245, 238, 0.8)",
                            border: "1px solid rgba(255, 193, 181, 0.35)",
                            mb: 3,
                        }}
                    >
                        <Button
                            fullWidth
                            onClick={() => {
                                setFormState(0);
                                setError("");
                            }}
                            sx={{
                                py: 0.95,
                                borderRadius: "9999px",
                                fontWeight: 800,
                                fontSize: "0.88rem",
                                textTransform: "none",
                                background: formState === 0 ? "#142B45" : "transparent",
                                color: formState === 0 ? "#FFFFFF" : "#64748B",
                                boxShadow: formState === 0 ? "0 4px 14px rgba(20, 43, 69, 0.18)" : "none",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: formState === 0 ? "#0C1B2C" : "rgba(20, 43, 69, 0.05)",
                                },
                            }}
                        >
                            Sign In
                        </Button>
                        <Button
                            fullWidth
                            onClick={() => {
                                setFormState(1);
                                setError("");
                            }}
                            sx={{
                                py: 0.95,
                                borderRadius: "9999px",
                                fontWeight: 800,
                                fontSize: "0.88rem",
                                textTransform: "none",
                                background: formState === 1 ? "#2589D8" : "transparent",
                                color: formState === 1 ? "#FFFFFF" : "#64748B",
                                boxShadow: formState === 1 ? "0 4px 14px rgba(37, 137, 216, 0.25)" : "none",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: formState === 1 ? "#1D6FB0" : "rgba(20, 43, 69, 0.05)",
                                },
                            }}
                        >
                            Sign Up
                        </Button>
                    </Box>

                    {/* Form Inputs (with dedicated top labels to prevent notched clipping) */}
                    <Box component="form" noValidate sx={{ width: "100%" }}>
                        {formState === 1 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    component="label"
                                    htmlFor="name"
                                    sx={{
                                        display: "block",
                                        fontWeight: 700,
                                        fontSize: "0.84rem",
                                        color: "#142B45",
                                        mb: 0.7,
                                    }}
                                >
                                    Full Name <Box component="span" sx={{ color: "#2589D8" }}>*</Box>
                                </Typography>
                                <TextField
                                    required
                                    fullWidth
                                    id="name"
                                    name="name"
                                    value={name}
                                    autoComplete="name"
                                    autoFocus={formState === 1}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    placeholder="e.g. Alex Morgan"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "14px",
                                            bgcolor: "#FFFFFF",
                                            border: "1.5px solid rgba(20, 43, 69, 0.14)",
                                            fontSize: "0.92rem",
                                            fontWeight: 600,
                                            color: "#142B45",
                                            transition: "all 0.2s ease",
                                            "&:hover": { borderColor: "rgba(37, 137, 216, 0.6)" },
                                            "&.Mui-focused": {
                                                borderColor: "#2589D8",
                                                boxShadow: "0 0 0 4px rgba(37, 137, 216, 0.14)",
                                            },
                                        },
                                        "& fieldset": { border: "none" },
                                    }}
                                />
                            </Box>
                        )}

                        <Box sx={{ mb: 2 }}>
                            <Typography
                                component="label"
                                htmlFor="username"
                                sx={{
                                    display: "block",
                                    fontWeight: 700,
                                    fontSize: "0.84rem",
                                    color: "#142B45",
                                    mb: 0.7,
                                }}
                            >
                                Username <Box component="span" sx={{ color: "#2589D8" }}>*</Box>
                            </Typography>
                            <TextField
                                required
                                fullWidth
                                id="username"
                                name="username"
                                value={username}
                                autoComplete="username"
                                autoFocus={formState === 0}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                placeholder="e.g. alex_m"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "14px",
                                        bgcolor: "#FFFFFF",
                                        border: "1.5px solid rgba(20, 43, 69, 0.14)",
                                        fontSize: "0.92rem",
                                        fontWeight: 600,
                                        color: "#142B45",
                                        transition: "all 0.2s ease",
                                        "&:hover": { borderColor: "rgba(37, 137, 216, 0.6)" },
                                        "&.Mui-focused": {
                                            borderColor: "#2589D8",
                                            boxShadow: "0 0 0 4px rgba(37, 137, 216, 0.14)",
                                        },
                                    },
                                    "& fieldset": { border: "none" },
                                }}
                            />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography
                                component="label"
                                htmlFor="password"
                                sx={{
                                    display: "block",
                                    fontWeight: 700,
                                    fontSize: "0.84rem",
                                    color: "#142B45",
                                    mb: 0.7,
                                }}
                            >
                                Password <Box component="span" sx={{ color: "#2589D8" }}>*</Box>
                            </Typography>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                value={password}
                                type={showPassword ? "text" : "password"}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                id="password"
                                autoComplete="current-password"
                                disabled={loading}
                                placeholder="••••••••"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                sx={{ color: "#64748B", "&:hover": { color: "#2589D8" } }}
                                            >
                                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "14px",
                                        bgcolor: "#FFFFFF",
                                        border: "1.5px solid rgba(20, 43, 69, 0.14)",
                                        fontSize: "0.92rem",
                                        fontWeight: 600,
                                        color: "#142B45",
                                        transition: "all 0.2s ease",
                                        "&:hover": { borderColor: "rgba(37, 137, 216, 0.6)" },
                                        "&.Mui-focused": {
                                            borderColor: "#2589D8",
                                            boxShadow: "0 0 0 4px rgba(37, 137, 216, 0.14)",
                                        },
                                    },
                                    "& fieldset": { border: "none" },
                                }}
                            />
                        </Box>

                        {error && (
                            <Alert
                                severity="error"
                                variant="filled"
                                sx={{
                                    mt: 2,
                                    mb: 1,
                                    borderRadius: "12px",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    backgroundColor: "#EF4444",
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {/* Primary Submit Button */}
                        <Button
                            type="button"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 2.5,
                                mb: 2,
                                py: 1.35,
                                background: "linear-gradient(135deg, #2589D8 0%, #1D6FB0 100%)",
                                color: "#FFFFFF",
                                borderRadius: "9999px",
                                fontWeight: 800,
                                fontSize: "0.95rem",
                                textTransform: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                                boxShadow: "0 6px 20px rgba(37, 137, 216, 0.28)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #1D6FB0 0%, #16568A 100%)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 8px 24px rgba(37, 137, 216, 0.35)",
                                },
                            }}
                            onClick={handleAuth}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                        >
                            <span>{loading ? "Authenticating..." : formState === 0 ? "Sign In to Engaze" : "Create My Account"}</span>
                            {!loading && <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                        </Button>

                        {/* Divider OR */}
                        <Box sx={{ display: "flex", alignItems: "center", my: 2.2 }}>
                            <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(20, 43, 69, 0.10)" }} />
                            <Typography variant="caption" sx={{ px: 1.8, color: "#94A3B8", fontWeight: 800, letterSpacing: "1px" }}>
                                OR
                            </Typography>
                            <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(20, 43, 69, 0.10)" }} />
                        </Box>

                        {/* Continue with Google */}
                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
                                <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        theme="outline"
                                        size="large"
                                        shape="pill"
                                        text={formState === 0 ? "signin_with" : "signup_with"}
                                        width="100%"
                                    />
                                </Box>
                            </GoogleOAuthProvider>
                        ) : (
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                }
                                onClick={() => {
                                    setError("Google Client ID is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your environment.");
                                }}
                                sx={{
                                    py: 1.15,
                                    backgroundColor: "#FFFFFF",
                                    color: "#142B45",
                                    border: "1.5px solid rgba(20, 43, 69, 0.14)",
                                    borderRadius: "9999px",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    fontSize: "0.90rem",
                                    "&:hover": {
                                        backgroundColor: "#FFF5EE",
                                        borderColor: "#2589D8",
                                    },
                                }}
                            >
                                Continue with Google
                            </Button>
                        )}

                        <Typography
                            variant="caption"
                            sx={{
                                color: "#64748B",
                                textAlign: "center",
                                display: "block",
                                mt: 2.5,
                                fontWeight: 500,
                                lineHeight: 1.5,
                            }}
                        >
                            By continuing, you agree to Engaze's{" "}
                            <Box component={Link} to="/terms" sx={{ color: "#2589D8", fontWeight: 700, textDecoration: "none" }}>Terms of Service</Box>
                            {" "}and{" "}
                            <Box component={Link} to="/privacy" sx={{ color: "#2589D8", fontWeight: 700, textDecoration: "none" }}>Privacy Policy</Box>.
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: "#94A3B8",
                                textAlign: "center",
                                display: "block",
                                mt: 1.2,
                                fontWeight: 500,
                            }}
                        >
                            Need assistance with your account?{" "}
                            <Box
                                component="a"
                                href="mailto:support@engaze.date"
                                aria-label="Email Customer Support at support@engaze.date"
                                sx={{
                                    color: "#2589D8",
                                    textDecoration: "none",
                                    fontWeight: 700,
                                    "&:hover": { textDecoration: "underline" },
                                }}
                            >
                                Contact Support
                            </Box>
                        </Typography>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}
