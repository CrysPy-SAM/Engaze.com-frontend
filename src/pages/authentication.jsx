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

// Subtle hand-drawn SVG doodles matching the Engaze Sky Blue brand identity
const BurstLines = ({ sx = {}, rotation = 0, color = "#0A6CFF" }) => (
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

const HeartDoodle = ({ sx = {}, rotation = 0, color = "#F06C9B" }) => (
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
            component="main"
            sx={{
                minHeight: "100vh",
                bgcolor: "#FFFFFF",
                overflow: "hidden",
            }}
        >
            <CssBaseline />

            {/* Left Hero Storytelling Panel (Desktop / Tablet sm+) */}
            <Grid
                item
                xs={false}
                sm={5}
                md={6}
                lg={6.5}
                sx={{
                    position: "relative",
                    background: "linear-gradient(145deg, #E8F4FD 0%, #DCEEFC 100%)",
                    color: "#0A1A4A",
                    display: { xs: "none", sm: "flex" },
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: { sm: 4, md: 6, lg: 8 },
                    overflow: "hidden",
                    borderRight: "1px solid rgba(10, 26, 74, 0.08)",
                }}
            >
                {/* Soft Organic Background Blobs */}
                <Box
                    sx={{
                        position: "absolute",
                        top: -90,
                        left: -90,
                        width: 320,
                        height: 320,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(205, 230, 250, 0.7) 0%, rgba(232, 244, 253, 0) 70%)",
                        pointerEvents: "none",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: -100,
                        right: -100,
                        width: 360,
                        height: 360,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(205, 230, 250, 0.7) 0%, rgba(232, 244, 253, 0) 70%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Decorative Doodles */}
                <BurstLines sx={{ position: "absolute", top: 40, right: 60 }} rotation={25} />
                <HeartDoodle sx={{ position: "absolute", bottom: 120, right: 80 }} rotation={-12} />

                {/* Top Navigation Row */}
                <Box sx={{ zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <EngazeLogo
                        size={34}
                        fontSize="1.45rem"
                        textColor="#0A1A4A"
                        onClick={() => navigate("/")}
                    />
                    <Box
                        component={Link}
                        to="/"
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.6,
                            color: "#0A6CFF",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            py: 0.6,
                            px: 1.6,
                            borderRadius: "9999px",
                            bgcolor: "rgba(255, 255, 255, 0.8)",
                            border: "1px solid rgba(10, 108, 255, 0.15)",
                            boxShadow: "0 2px 8px rgba(10, 108, 255, 0.08)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: "#FFFFFF",
                                transform: "translateX(-2px)",
                                boxShadow: "0 4px 12px rgba(10, 108, 255, 0.14)",
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
                            bgcolor: "#FFFFFF",
                            color: "#0A6CFF",
                            px: 2,
                            py: 0.65,
                            borderRadius: "9999px",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            border: "1px solid rgba(10, 108, 255, 0.2)",
                            boxShadow: "0 4px 14px rgba(10, 108, 255, 0.08)",
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
                            fontSize: { sm: "2.6rem", md: "3.4rem", lg: "4.0rem" },
                            fontWeight: 900,
                            lineHeight: 1.08,
                            letterSpacing: "-0.04em",
                            color: "#0A1A4A",
                            mb: 2.2,
                        }}
                    >
                        Real sparks.
                        <Box component="span" sx={{ color: "#0A6CFF", display: "block" }}>
                            Feel connected.
                        </Box>
                    </Typography>

                    <Typography
                        sx={{
                            color: "#5B6475",
                            fontSize: "1.05rem",
                            fontWeight: 600,
                            lineHeight: 1.6,
                            mb: 4,
                            maxWidth: 480,
                        }}
                    >
                        Join thousands of genuine singles testing real-world chemistry through mutual likes, live browser video vibe checks, and secure conversations.
                    </Typography>

                    {/* Non-colliding Social Vibe Snippet */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.8,
                            bgcolor: "#FFFFFF",
                            p: 1.8,
                            borderRadius: "20px",
                            border: "1px solid rgba(10, 26, 74, 0.08)",
                            boxShadow: "0 10px 30px rgba(10, 108, 255, 0.10)",
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
                                    border: "2px solid #FFFFFF",
                                    bgcolor: "#8FA8FF",
                                    objectFit: "cover",
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
                                    border: "2px solid #FFFFFF",
                                    bgcolor: "#A98BFF",
                                    objectFit: "cover",
                                    ml: -1.4,
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.3 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0A1A4A" }}>
                                    Live Video Vibe Check
                                </Typography>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                            </Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: "#62748A" }}>
                                “Coffee & banter this weekend?” ☕
                            </Typography>
                        </Box>
                    </Box>

                    {/* Features checklist pills (Clean vertical stack with zero collisions) */}
                    <Stack spacing={1.5}>
                        {[
                            {
                                icon: <FavoriteIcon sx={{ color: "#F06C9B", fontSize: 18 }} />,
                                text: "Mutual match discovery — zero unsolicited cold spam",
                            },
                            {
                                icon: <VideocamIcon sx={{ color: "#0A6CFF", fontSize: 18 }} />,
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
                                    border: "1px solid rgba(10, 26, 74, 0.08)",
                                    boxShadow: "0 4px 12px rgba(10, 108, 255, 0.05)",
                                    borderRadius: "9999px",
                                    px: 2,
                                    py: 0.85,
                                    color: "#0A1A4A",
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
                <Typography variant="caption" sx={{ color: "#62748A", zIndex: 2, fontWeight: 600 }}>
                    © {new Date().getFullYear()} Engaze. All rights reserved. Strictly 18+ adult dating platform.
                </Typography>
            </Grid>

            {/* Right Form Card Section (Desktop + Mobile) */}
            <Grid
                item
                xs={12}
                sm={7}
                md={6}
                lg={5.5}
                sx={{
                    bgcolor: { xs: "#F7FAFE", sm: "#FFFFFF" },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    p: { xs: 2.5, sm: 4, md: 6, lg: 8 },
                }}
            >
                <Box
                    sx={{
                        maxWidth: 440,
                        width: "100%",
                        bgcolor: "#FFFFFF",
                        p: { xs: 3, sm: 4 },
                        borderRadius: { xs: "24px", sm: "28px" },
                        boxShadow: {
                            xs: "0 10px 30px rgba(10, 108, 255, 0.08)",
                            sm: "none",
                        },
                        border: {
                            xs: "1px solid rgba(10, 26, 74, 0.08)",
                            sm: "none",
                        },
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
                                textColor="#0A1A4A"
                                onClick={() => navigate("/")}
                            />
                            <Box
                                component={Link}
                                to="/"
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    color: "#0A6CFF",
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
                                bgcolor: "rgba(10, 108, 255, 0.08)",
                                color: "#0A6CFF",
                                px: 1.6,
                                py: 0.45,
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                letterSpacing: "0.04em",
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
                                color: "#0A1A4A",
                                fontSize: { xs: "1.75rem", sm: "2.1rem" },
                                letterSpacing: "-0.03em",
                                mb: 0.8,
                            }}
                        >
                            {formState === 0 ? "Welcome back!" : "Create account"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#62748A", fontSize: "0.90rem", fontWeight: 600, lineHeight: 1.5 }}>
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
                            bgcolor: "rgba(10, 26, 74, 0.04)",
                            border: "1px solid rgba(10, 26, 74, 0.08)",
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
                                background: formState === 0 ? "#0A1A4A" : "transparent",
                                color: formState === 0 ? "#FFFFFF" : "#62748A",
                                boxShadow: formState === 0 ? "0 4px 12px rgba(10, 26, 74, 0.15)" : "none",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: formState === 0 ? "#08153B" : "rgba(10, 26, 74, 0.05)",
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
                                background: formState === 1 ? "#0A6CFF" : "transparent",
                                color: formState === 1 ? "#FFFFFF" : "#62748A",
                                boxShadow: formState === 1 ? "0 4px 14px rgba(10, 108, 255, 0.25)" : "none",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: formState === 1 ? "#0857D0" : "rgba(10, 26, 74, 0.05)",
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
                                        color: "#0A1A4A",
                                        mb: 0.7,
                                    }}
                                >
                                    Full Name <Box component="span" sx={{ color: "#0A6CFF" }}>*</Box>
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
                                            border: "1.5px solid rgba(10, 26, 74, 0.14)",
                                            fontSize: "0.92rem",
                                            fontWeight: 600,
                                            color: "#0A1A4A",
                                            transition: "all 0.2s ease",
                                            "&:hover": { borderColor: "rgba(10, 108, 255, 0.5)" },
                                            "&.Mui-focused": {
                                                borderColor: "#0A6CFF",
                                                boxShadow: "0 0 0 4px rgba(10, 108, 255, 0.12)",
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
                                    color: "#0A1A4A",
                                    mb: 0.7,
                                }}
                            >
                                Username <Box component="span" sx={{ color: "#0A6CFF" }}>*</Box>
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
                                        border: "1.5px solid rgba(10, 26, 74, 0.14)",
                                        fontSize: "0.92rem",
                                        fontWeight: 600,
                                        color: "#0A1A4A",
                                        transition: "all 0.2s ease",
                                        "&:hover": { borderColor: "rgba(10, 108, 255, 0.5)" },
                                        "&.Mui-focused": {
                                            borderColor: "#0A6CFF",
                                            boxShadow: "0 0 0 4px rgba(10, 108, 255, 0.12)",
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
                                    color: "#0A1A4A",
                                    mb: 0.7,
                                }}
                            >
                                Password <Box component="span" sx={{ color: "#0A6CFF" }}>*</Box>
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
                                                sx={{ color: "#62748A", "&:hover": { color: "#0A6CFF" } }}
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
                                        border: "1.5px solid rgba(10, 26, 74, 0.14)",
                                        fontSize: "0.92rem",
                                        fontWeight: 600,
                                        color: "#0A1A4A",
                                        transition: "all 0.2s ease",
                                        "&:hover": { borderColor: "rgba(10, 108, 255, 0.5)" },
                                        "&.Mui-focused": {
                                            borderColor: "#0A6CFF",
                                            boxShadow: "0 0 0 4px rgba(10, 108, 255, 0.12)",
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
                                backgroundColor: "#0A6CFF",
                                color: "#FFFFFF",
                                borderRadius: "9999px",
                                fontWeight: 800,
                                fontSize: "0.95rem",
                                textTransform: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                                boxShadow: "0 6px 20px rgba(10, 108, 255, 0.28)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    backgroundColor: "#0857D0",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 8px 24px rgba(10, 108, 255, 0.35)",
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
                            <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(10, 26, 74, 0.10)" }} />
                            <Typography variant="caption" sx={{ px: 1.8, color: "#94A3B8", fontWeight: 800, letterSpacing: "1px" }}>
                                OR
                            </Typography>
                            <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(10, 26, 74, 0.10)" }} />
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
                                    color: "#0A1A4A",
                                    border: "1.5px solid rgba(10, 26, 74, 0.14)",
                                    borderRadius: "9999px",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    fontSize: "0.90rem",
                                    "&:hover": {
                                        backgroundColor: "#F7FAFE",
                                        borderColor: "#0A6CFF",
                                    },
                                }}
                            >
                                Continue with Google
                            </Button>
                        )}

                        <Typography
                            variant="caption"
                            sx={{
                                color: "#62748A",
                                textAlign: "center",
                                display: "block",
                                mt: 2.5,
                                fontWeight: 500,
                                lineHeight: 1.5,
                            }}
                        >
                            By continuing, you agree to Engaze's{" "}
                            <Box component={Link} to="/terms" sx={{ color: "#0A6CFF", fontWeight: 700, textDecoration: "none" }}>Terms of Service</Box>
                            {" "}and{" "}
                            <Box component={Link} to="/privacy" sx={{ color: "#0A6CFF", fontWeight: 700, textDecoration: "none" }}>Privacy Policy</Box>.
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
                                    color: "#0A6CFF",
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
