import * as React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { AuthContext } from "../contexts/AuthContext";
import { BRAND_COLORS } from "../theme";
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
                // handleRegister in AuthContext persists the session and automatically routes to /home
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
                bgcolor: BRAND_COLORS.backgroundDark,
                overflow: "hidden",
            }}
        >
            <CssBaseline />

            {/* Left Hero Graphic Section (Desktop) */}
            <Grid
                item
                xs={false}
                sm={4}
                md={7}
                sx={{
                    position: "relative",
                    background: "radial-gradient(circle at 30% 30%, #1E1235 0%, #0B0D17 80%)",
                    display: { xs: "none", sm: "flex" },
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: { sm: 4, md: 8 },
                    overflow: "hidden",
                }}
            >
                {/* Background decorative glow orbs */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "-15%",
                        left: "-10%",
                        width: 500,
                        height: 500,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(253, 58, 115, 0.25) 0%, rgba(253, 58, 115, 0) 70%)",
                        filter: "blur(40px)",
                        pointerEvents: "none",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: "-10%",
                        right: "-5%",
                        width: 450,
                        height: 450,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0) 70%)",
                        filter: "blur(50px)",
                        pointerEvents: "none",
                    }}
                />

                {/* Top Brand Logo */}
                <EngazeLogo
                    size={36}
                    fontSize="1.6rem"
                    onClick={() => navigate("/")}
                    sx={{ zIndex: 2 }}
                />

                {/* Central Value Copy */}
                <Box sx={{ maxWidth: 540, my: "auto", zIndex: 2 }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.15,
                            color: "#FFFFFF",
                            mb: 2.5,
                        }}
                    >
                        Where real connections{" "}
                        <span
                            style={{
                                background: BRAND_COLORS.primaryGradient,
                                WebkitBackgroundClip: "text",
                                WebkitFillColor: "transparent",
                            }}
                        >
                            spark
                        </span>
                        .
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: BRAND_COLORS.textSecondary,
                            fontSize: "1.1rem",
                            lineHeight: 1.6,
                            mb: 5,
                        }}
                    >
                        Join thousands of members discovering mutual matches, engaging in real-time chat, and enjoying spontaneous 1-on-1 video calls.
                    </Typography>

                    {/* Features checklist */}
                    <Stack spacing={2.2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "10px",
                                    bgcolor: "rgba(253, 58, 115, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <FavoriteIcon sx={{ color: BRAND_COLORS.coralPink, fontSize: 18 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                                Mutual Match Discovery with Zero Unwanted Spam
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "10px",
                                    bgcolor: "rgba(139, 92, 246, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <VideocamIcon sx={{ color: BRAND_COLORS.violet, fontSize: 18 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                                Fast, Encrypted 1-to-1 Video Matchmaking
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "10px",
                                    bgcolor: "rgba(16, 185, 129, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ShieldOutlinedIcon sx={{ color: "#10B981", fontSize: 18 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                                Adult 18+ Profiles & Privacy-First Security
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>

                {/* Footer caption */}
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.4)", zIndex: 2 }}>
                    © {new Date().getFullYear()} Engaze.com. All rights reserved.
                </Typography>
            </Grid>

            {/* Right Form Card Section */}
            <Grid
                item
                xs={12}
                sm={8}
                md={5}
                component={Paper}
                elevation={0}
                square
                sx={{
                    bgcolor: BRAND_COLORS.surfaceDark,
                    borderLeft: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    p: { xs: 2.2, sm: 5, md: 7 },
                }}
            >
                <Box sx={{ maxWidth: 420, width: "100%", mx: "auto" }}>
                    {/* Mobile Logo Header */}
                    <Box
                        sx={{
                            display: { xs: "flex", sm: "none" },
                            justifyContent: "center",
                            mb: 4,
                        }}
                    >
                        <EngazeLogo
                            size={32}
                            fontSize="1.4rem"
                            onClick={() => navigate("/")}
                        />
                    </Box>

                    {/* Form Title & Switcher */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", mb: 1, letterSpacing: "-0.02em" }}>
                            {formState === 0 ? "Welcome Back" : "Create Account"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                            {formState === 0
                                ? "Enter your credentials to access your matches and chats."
                                : "Start your journey to meaningful connections today."}
                        </Typography>
                    </Box>

                    {/* Segmented Tab Switcher */}
                    <Box
                        sx={{
                            display: "flex",
                            p: 0.6,
                            borderRadius: "14px",
                            bgcolor: "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
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
                                borderRadius: "10px",
                                fontWeight: 700,
                                textTransform: "none",
                                background: formState === 0 ? BRAND_COLORS.primaryGradient : "transparent",
                                color: formState === 0 ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                boxShadow: formState === 0 ? "0 4px 15px rgba(253, 58, 115, 0.3)" : "none",
                                "&:hover": {
                                    background: formState === 0 ? BRAND_COLORS.primaryGradient : "rgba(255, 255, 255, 0.04)",
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
                                borderRadius: "10px",
                                fontWeight: 700,
                                textTransform: "none",
                                background: formState === 1 ? BRAND_COLORS.primaryGradient : "transparent",
                                color: formState === 1 ? "#FFFFFF" : BRAND_COLORS.textSecondary,
                                boxShadow: formState === 1 ? "0 4px 15px rgba(253, 58, 115, 0.3)" : "none",
                                "&:hover": {
                                    background: formState === 1 ? BRAND_COLORS.primaryGradient : "rgba(255, 255, 255, 0.04)",
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
                                        borderRadius: "14px",
                                        bgcolor: "rgba(255, 255, 255, 0.04)",
                                    },
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
                                    borderRadius: "14px",
                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                },
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
                                            sx={{ color: BRAND_COLORS.textSecondary }}
                                        >
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "14px",
                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                },
                            }}
                        />

                        {error && (
                            <Alert
                                severity="error"
                                variant="filled"
                                sx={{
                                    mt: 2.5,
                                    borderRadius: "12px",
                                    fontSize: "0.88rem",
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="button"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3.5,
                                mb: 2,
                                py: 1.5,
                                borderRadius: "14px",
                                background: BRAND_COLORS.primaryGradient,
                                fontWeight: 800,
                                fontSize: "1rem",
                                boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                            }}
                            onClick={handleAuth}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {loading ? "Authenticating..." : formState === 0 ? "Sign In to Engaze" : "Create My Account"}
                        </Button>

                        {/* Divider OR */}
                        <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
                            <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255, 255, 255, 0.12)" }} />
                            <Typography variant="caption" sx={{ px: 2, color: BRAND_COLORS.textSecondary, fontWeight: 700, letterSpacing: "1px" }}>
                                OR
                            </Typography>
                            <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255, 255, 255, 0.12)" }} />
                        </Box>

                        {/* Continue with Google */}
                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
<Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="filled_black"
                                    size="large"
                                    shape="rectangular"
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
                                    borderRadius: "14px",
                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    fontSize: "0.95rem",
                                    "&:hover": {
                                        borderColor: BRAND_COLORS.coralPink,
                                        backgroundColor: "rgba(253, 58, 115, 0.08)",
                                    },
                                }}
                            >
                                Continue with Google
                            </Button>
                        )}

                        <Typography
                            variant="caption"
                            sx={{
                                color: BRAND_COLORS.textSecondary,
                                textAlign: "center",
                                display: "block",
                                mt: 2,
                            }}
                        >
                            By continuing, you agree to Engaze's Terms of Service & Privacy Policy.
                        </Typography>
                    </Box>
                </Box>
            </Grid>

        </Grid>
    );
}