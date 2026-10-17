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
    Snackbar,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    Stack,
} from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VideocamIcon from "@mui/icons-material/Videocam";

export default function Authentication() {
    const navigate = useNavigate();
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0); // 0 = Sign In, 1 = Sign Up
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

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
                let result = await handleRegister(name, username, password);
                setUsername("");
                setName("");
                setPassword("");
                setMessage(result || "Account created successfully! Please sign in.");
                setOpen(true);
                setError("");
                setFormState(0);
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
                <Box
                    onClick={() => navigate("/")}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        cursor: "pointer",
                        zIndex: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "14px",
                            background: BRAND_COLORS.primaryGradient,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                        }}
                    >
                        <WhatshotIcon sx={{ color: "#fff", fontSize: 26 }} />
                    </Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: "-0.03em",
                            color: "#FFFFFF",
                        }}
                    >
                        ENGAZE<span style={{ color: BRAND_COLORS.coralPink }}>.</span>
                    </Typography>
                </Box>

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
                                <VerifiedUserIcon sx={{ color: "#10B981", fontSize: 18 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                                Verified Member Profiles & Privacy-First Security
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
                            alignItems: "center",
                            gap: 1.2,
                            mb: 4,
                            justifyContent: "center",
                        }}
                        onClick={() => navigate("/")}
                    >
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: "12px",
                                background: BRAND_COLORS.primaryGradient,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <WhatshotIcon sx={{ color: "#fff", fontSize: 22 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF" }}>
                            ENGAZE<span style={{ color: BRAND_COLORS.coralPink }}>.</span>
                        </Typography>
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

            {/* Success Toast */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpen(false)}
                    severity="success"
                    variant="filled"
                    sx={{ width: "100%", borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </Grid>
    );
}