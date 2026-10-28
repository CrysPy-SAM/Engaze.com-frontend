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
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import EngazeLogo from "../components/EngazeLogo";

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
                bgcolor: "#FFFDF9",
                overflow: "hidden",
            }}
        >
            <CssBaseline />

            {/* Left Hero Storytelling Panel (Desktop) */}
            <Grid
                item
                xs={false}
                sm={5}
                md={6}
                lg={7}
                sx={{
                    position: "relative",
                    backgroundColor: "#FD2E7A",
                    color: "#FFFFFF",
                    display: { xs: "none", sm: "flex" },
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: { sm: 4, md: 7, lg: 9 },
                    overflow: "hidden",
                    borderRight: "3px solid #0D0E15",
                }}
            >
                {/* Top Brand Logo */}
                <Box sx={{ zIndex: 3 }}>
                    <EngazeLogo
                        size={36}
                        fontSize="1.6rem"
                        textColor="#FFFFFF"
                        onClick={() => navigate("/")}
                    />
                </Box>

                {/* Floating Conversational Bubbles (Neo-Pop) */}
                <Box
                    className="pop-bubble"
                    sx={{
                        position: "absolute",
                        top: "16%",
                        right: "8%",
                        backgroundColor: "#FFD233",
                        color: "#0D0E15",
                        zIndex: 2,
                    }}
                >
                    <span>Free tonight for a video date? 📹</span>
                </Box>

                <Box
                    className="pop-bubble"
                    sx={{
                        position: "absolute",
                        bottom: "22%",
                        left: "6%",
                        backgroundColor: "#24C5F7",
                        color: "#0D0E15",
                        zIndex: 2,
                    }}
                >
                    <span>Instant match unlocked! ✨</span>
                </Box>

                {/* Central Value Copy & Visual Highlights */}
                <Box sx={{ maxWidth: 580, my: "auto", zIndex: 2, position: "relative" }}>
                    <Box
                        sx={{
                            display: "inline-block",
                            backgroundColor: "#0D0E15",
                            color: "#FFFFFF",
                            px: 2,
                            py: 0.6,
                            borderRadius: "9999px",
                            fontSize: "0.78rem",
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            mb: 3,
                        }}
                    >
                        THE ENGAZE THIRD SPACE
                    </Box>

                    <Typography
                        variant="h2"
                        sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: { sm: "2.8rem", md: "3.8rem", lg: "4.5rem" },
                            fontWeight: 900,
                            lineHeight: 1.05,
                            letterSpacing: "-0.04em",
                            color: "#FFFFFF",
                            mb: 2.5,
                        }}
                    >
                        Real sparks.
                        <Box component="span" sx={{ color: "#0D0E15", display: "block" }}>
                            Feel heard.
                        </Box>
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: "#FFFFFF",
                            fontSize: "1.15rem",
                            fontWeight: 600,
                            lineHeight: 1.6,
                            mb: 4.5,
                            maxWidth: 500,
                        }}
                    >
                        Join genuine singles testing real-world vibes through mutual likes, real-time messaging, and secure 1-on-1 video dates.
                    </Typography>

                    {/* Features checklist pills */}
                    <Stack spacing={2}>
                        {[
                            {
                                icon: <FavoriteIcon sx={{ color: "#FD2E7A", fontSize: 18 }} />,
                                text: "Mutual match discovery — zero unsolicited cold spam",
                            },
                            {
                                icon: <VideocamIcon sx={{ color: "#7C5CFC", fontSize: 18 }} />,
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
                                    gap: 1.5,
                                    backgroundColor: "rgba(255, 255, 255, 0.92)",
                                    border: "2px solid #0D0E15",
                                    boxShadow: "3px 3px 0px #0D0E15",
                                    borderRadius: "9999px",
                                    px: 2.2,
                                    py: 1,
                                    color: "#0D0E15",
                                    fontWeight: 800,
                                    fontSize: "0.9rem",
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
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.8)", zIndex: 2, fontWeight: 700 }}>
                    © {new Date().getFullYear()} Engaze. All rights reserved. Strictly 18+ adult dating platform.
                </Typography>
            </Grid>

            {/* Right Form Card Section */}
            <Grid
                item
                xs={12}
                sm={7}
                md={6}
                lg={5}
                sx={{
                    bgcolor: "#FFFDF9",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    p: { xs: 3, sm: 5, md: 7, lg: 8 },
                }}
            >
                <Box sx={{ maxWidth: 440, width: "100%", mx: "auto" }}>
                    {/* Mobile Logo Header */}
                    <Box
                        sx={{
                            display: { xs: "flex", sm: "none" },
                            justifyContent: "center",
                            mb: 4,
                        }}
                    >
                        <EngazeLogo
                            size={34}
                            fontSize="1.5rem"
                            textColor="#0D0E15"
                            onClick={() => navigate("/")}
                        />
                    </Box>

                    {/* Form Title & Switcher */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 900,
                                color: "#0D0E15",
                                fontSize: { xs: "2rem", md: "2.4rem" },
                                letterSpacing: "-0.03em",
                                mb: 1,
                            }}
                        >
                            {formState === 0 ? "Welcome back!" : "Create account"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#4B4E63", fontSize: "0.95rem", fontWeight: 600 }}>
                            {formState === 0
                                ? "Enter your credentials to access your matches and live video dates."
                                : "Join Engaze today to find genuine connections with mutual likes."}
                        </Typography>
                    </Box>

                    {/* Tactile Neo-Pop Segmented Tab Switcher */}
                    <Box
                        sx={{
                            display: "flex",
                            p: 0.6,
                            borderRadius: "9999px",
                            bgcolor: "#FFFFFF",
                            border: "2.5px solid #0D0E15",
                            boxShadow: "3px 3px 0px #0D0E15",
                            mb: 3.5,
                        }}
                    >
                        <Button
                            fullWidth
                            onClick={() => {
                                setFormState(0);
                                setError("");
                            }}
                            sx={{
                                py: 1.1,
                                borderRadius: "9999px",
                                fontWeight: 900,
                                fontSize: "0.92rem",
                                textTransform: "none",
                                background: formState === 0 ? "#0D0E15" : "transparent",
                                color: formState === 0 ? "#FFFFFF" : "#0D0E15",
                                "&:hover": {
                                    background: formState === 0 ? "#1C1D2B" : "rgba(13, 14, 21, 0.05)",
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
                                py: 1.1,
                                borderRadius: "9999px",
                                fontWeight: 900,
                                fontSize: "0.92rem",
                                textTransform: "none",
                                background: formState === 1 ? "#FD2E7A" : "transparent",
                                color: formState === 1 ? "#FFFFFF" : "#0D0E15",
                                "&:hover": {
                                    background: formState === 1 ? "#E61C68" : "rgba(13, 14, 21, 0.05)",
                                },
                            }}
                        >
                            Sign Up
                        </Button>
                    </Box>

                    {/* Form Inputs */}
                    <Box component="form" noValidate sx={{ width: "100%" }}>
                        {formState === 1 && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="name"
                                label="Full Name"
                                name="name"
                                value={name}
                                autoComplete="name"
                                autoFocus={formState === 1}
                                onChange={(e) => setName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                placeholder="Alex Morgan"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "16px",
                                        bgcolor: "#FFFFFF",
                                        border: "2px solid #0D0E15",
                                        fontWeight: 700,
                                        "&:hover fieldset": { borderColor: "transparent" },
                                        "&.Mui-focused fieldset": { borderColor: "transparent" },
                                    },
                                    "& fieldset": { border: "none" },
                                }}
                            />
                        )}

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            value={username}
                            autoComplete="username"
                            autoFocus={formState === 0}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            placeholder="alex_m"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "16px",
                                    bgcolor: "#FFFFFF",
                                    border: "2px solid #0D0E15",
                                    fontWeight: 700,
                                    "&:hover fieldset": { borderColor: "transparent" },
                                    "&.Mui-focused fieldset": { borderColor: "transparent" },
                                },
                                "& fieldset": { border: "none" },
                            }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
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
                                            sx={{ color: "#0D0E15" }}
                                        >
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "16px",
                                    bgcolor: "#FFFFFF",
                                    border: "2px solid #0D0E15",
                                    fontWeight: 700,
                                    "&:hover fieldset": { borderColor: "transparent" },
                                    "&.Mui-focused fieldset": { borderColor: "transparent" },
                                },
                                "& fieldset": { border: "none" },
                            }}
                        />

                        {error && (
                            <Alert
                                severity="error"
                                variant="filled"
                                sx={{
                                    mt: 2.5,
                                    borderRadius: "14px",
                                    fontWeight: 700,
                                    fontSize: "0.88rem",
                                    backgroundColor: "#EF4444",
                                    border: "2px solid #0D0E15",
                                    boxShadow: "2px 2px 0px #0D0E15",
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="button"
                            fullWidth
                            className="pop-pill"
                            variant="contained"
                            sx={{
                                mt: 3.5,
                                mb: 2,
                                py: 1.6,
                                backgroundColor: "#FD2E7A",
                                color: "#FFFFFF",
                                fontWeight: 900,
                                fontSize: "1.05rem",
                                textTransform: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1.2,
                                "&:hover": { backgroundColor: "#E61C68" },
                            }}
                            onClick={handleAuth}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            <span>{loading ? "Authenticating..." : formState === 0 ? "Sign In to Engaze" : "Create My Account"}</span>
                            {!loading && <ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />}
                        </Button>

                        {/* Divider OR */}
                        <Box sx={{ display: "flex", alignItems: "center", my: 2.5 }}>
                            <Box sx={{ flex: 1, height: "1.5px", bgcolor: "#E5E7EB" }} />
                            <Typography variant="caption" sx={{ px: 2, color: "#6B7280", fontWeight: 800, letterSpacing: "1px" }}>
                                OR
                            </Typography>
                            <Box sx={{ flex: 1, height: "1.5px", bgcolor: "#E5E7EB" }} />
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
                                className="pop-pill"
                                startIcon={
                                    <svg width="20" height="20" viewBox="0 0 24 24">
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
                                    py: 1.3,
                                    backgroundColor: "#FFFFFF",
                                    color: "#0D0E15",
                                    fontWeight: 800,
                                    textTransform: "none",
                                    fontSize: "0.95rem",
                                    "&:hover": {
                                        backgroundColor: "#F9FAFB",
                                    },
                                }}
                            >
                                Continue with Google
                            </Button>
                        )}

                        <Typography
                            variant="caption"
                            sx={{
                                color: "#6B7280",
                                textAlign: "center",
                                display: "block",
                                mt: 3,
                                fontWeight: 500,
                                lineHeight: 1.5,
                            }}
                        >
                            By continuing, you agree to Engaze's{" "}
                            <Box component={Link} to="/terms" sx={{ color: "#FD2E7A", fontWeight: 700, textDecoration: "none" }}>Terms of Service</Box>
                            {" "}and{" "}
                            <Box component={Link} to="/privacy" sx={{ color: "#FD2E7A", fontWeight: 700, textDecoration: "none" }}>Privacy Policy</Box>.
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: "#9CA3AF",
                                textAlign: "center",
                                display: "block",
                                mt: 1.5,
                                fontWeight: 500,
                            }}
                        >
                            Need assistance with your account?{" "}
                            <Box
                                component="a"
                                href="mailto:support@engaze.date"
                                aria-label="Email Customer Support at support@engaze.date"
                                sx={{
                                    color: "#FD2E7A",
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
