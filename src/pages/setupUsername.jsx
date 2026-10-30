import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Avatar,
    Stack,
    Chip,
    CircularProgress,
    InputAdornment,
    Alert,
    Fade,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import { AuthContext } from "../contexts/AuthContext";
import EngazeLogo from "../components/EngazeLogo";
import { BRAND_COLORS } from "../theme";

// Client-side quick syntax validation matching backend policy
function validateClientUsername(raw) {
    if (!raw) return { valid: false, error: "Please enter a username." };
    const trimmed = raw.trim();
    if (trimmed.length < 3) return { valid: false, error: "Username must be at least 3 characters." };
    if (trimmed.length > 20) return { valid: false, error: "Username cannot exceed 20 characters." };
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
        return { valid: false, error: "Only letters, numbers, underscores (_), dots (.), and hyphens (-) are allowed." };
    }
    if (!/[a-zA-Z0-9]/.test(trimmed)) {
        return { valid: false, error: "Username must contain at least one letter or number." };
    }
    if (/^[._-]/.test(trimmed) || /[._-]$/.test(trimmed)) {
        return { valid: false, error: "Username cannot start or end with a dot, underscore, or hyphen." };
    }
    if (/\.{2,}/.test(trimmed)) {
        return { valid: false, error: "Username cannot contain consecutive dots." };
    }
    return { valid: true, trimmed };
}

export default function SetupUsernamePage() {
    const navigate = useNavigate();
    const { userData, isAuthenticated, loading: authLoading, checkUsernameAvailability, setupUsername } = useContext(AuthContext);

    const [usernameInput, setUsernameInput] = useState("");
    const [status, setStatus] = useState("idle"); // idle | checking | available | unavailable | invalid
    const [statusMessage, setStatusMessage] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const debounceTimerRef = useRef(null);

    // Initial default candidate from Google name/email
    useEffect(() => {
        if (userData && !usernameInput) {
            const raw = userData.email ? userData.email.split("@")[0] : userData.name;
            const cleaned = (raw || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .slice(0, 15);
            if (cleaned.length >= 3) {
                setUsernameInput(cleaned);
            }
        }
    }, [userData, usernameInput]);

    // Redirection safeguards
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate("/auth", { replace: true });
            } else if (userData?.usernameSetupCompleted === true) {
                navigate("/home", { replace: true });
            }
        }
    }, [authLoading, isAuthenticated, userData, navigate]);

    // Debounced real-time availability checking
    const performAvailabilityCheck = useCallback(async (candidate) => {
        const clientVal = validateClientUsername(candidate);
        if (!clientVal.valid) {
            setStatus("invalid");
            setStatusMessage(clientVal.error);
            setSuggestions([]);
            return;
        }

        setStatus("checking");
        setStatusMessage("Checking availability...");

        try {
            const res = await checkUsernameAvailability(clientVal.trimmed);
            if (res.available) {
                setStatus("available");
                setStatusMessage(res.message || `@${clientVal.trimmed} is available!`);
                setSuggestions([]);
            } else {
                setStatus("unavailable");
                setStatusMessage(res.message || `@${clientVal.trimmed} is already taken.`);
                if (res.suggestions && res.suggestions.length > 0) {
                    setSuggestions(res.suggestions);
                }
            }
        } catch (err) {
            setStatus("invalid");
            setStatusMessage(err.message || "Failed to check availability");
        }
    }, [checkUsernameAvailability]);

    // Auto-check candidate when initial candidate is populated
    useEffect(() => {
        if (usernameInput && status === "idle") {
            performAvailabilityCheck(usernameInput);
        }
    }, [usernameInput, status, performAvailabilityCheck]);

    const handleInputChange = (e) => {
        const value = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, "");
        setUsernameInput(value);
        setSubmitError("");

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!value.trim()) {
            setStatus("idle");
            setStatusMessage("");
            setSuggestions([]);
            return;
        }

        debounceTimerRef.current = setTimeout(() => {
            performAvailabilityCheck(value);
        }, 320);
    };

    const handleSelectSuggestion = (suggestion) => {
        setUsernameInput(suggestion);
        setSubmitError("");
        performAvailabilityCheck(suggestion);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitError("");

        const clientVal = validateClientUsername(usernameInput);
        if (!clientVal.valid) {
            setSubmitError(clientVal.error);
            return;
        }

        setSubmitting(true);
        try {
            await setupUsername(clientVal.trimmed);
            navigate("/home", { replace: true });
        } catch (err) {
            setSubmitError(err.message || "Failed to set up username. Please try again.");
            if (err.suggestions && err.suggestions.length > 0) {
                setSuggestions(err.suggestions);
                setStatus("unavailable");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const profilePic = userData?.photos?.[0] || null;
    const displayName = userData?.name || "there";

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 2, sm: 3 },
                bgcolor: "#0A111C",
                background: "radial-gradient(ellipse 90% 85% at 50% 20%, #121C2D 0%, #0A111C 65%, #070B13 100%)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Header branding */}
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <EngazeLogo size={36} fontSize="1.45rem" />
            </Box>

            <Fade in timeout={400}>
                <Card
                    elevation={0}
                    sx={{
                        maxWidth: 480,
                        width: "100%",
                        borderRadius: { xs: "22px", sm: "28px" },
                        p: { xs: 3, sm: 4.5 },
                        bgcolor: "#121C2D !important",
                        background: "#121C2D !important",
                        backdropFilter: "none !important",
                        filter: "none !important",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.55), 0 2px 10px rgba(0, 0, 0, 0.3)",
                        textAlign: "center",
                    }}
                >
                    {/* User Google Greeting Pill */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1.2,
                            px: 2,
                            py: 0.8,
                            borderRadius: "9999px",
                            bgcolor: "rgba(37, 137, 216, 0.12)",
                            border: "1px solid rgba(37, 137, 216, 0.32)",
                            mb: 2.5,
                        }}
                    >
                        <Avatar
                            src={profilePic}
                            alt={displayName}
                            sx={{ width: 28, height: 28, bgcolor: BRAND_COLORS.brandBlue, fontSize: 14 }}
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#F8FAFC" }}>
                            Hi, {displayName}
                        </Typography>
                        <SparklesIcon sx={{ fontSize: 16, color: "#38BDF8" }} />
                    </Box>

                    <Typography
                        variant="h5"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            color: "#F8FAFC",
                            letterSpacing: "-0.02em",
                            mb: 1,
                        }}
                    >
                        Choose your @username
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#94A3B8",
                            lineHeight: 1.6,
                            mb: 3.5,
                            fontWeight: 500,
                        }}
                    >
                        Pick a unique username for your Engaze profile. You will be able to update it once every 14 days.
                    </Typography>

                    {submitError && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px", textAlign: "left" }}>
                            {submitError}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            fullWidth
                            autoFocus
                            placeholder="username"
                            value={usernameInput}
                            onChange={handleInputChange}
                            error={status === "unavailable" || status === "invalid"}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AlternateEmailRoundedIcon sx={{ color: BRAND_COLORS.brandBlue, fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {status === "checking" && <CircularProgress size={18} sx={{ color: BRAND_COLORS.brandBlue }} />}
                                        {status === "available" && <CheckCircleRoundedIcon sx={{ color: "#10B981", fontSize: 22 }} />}
                                        {(status === "unavailable" || status === "invalid") && (
                                            <CancelRoundedIcon sx={{ color: "#EF4444", fontSize: 22 }} />
                                        )}
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "14px",
                                    bgcolor: "#0A111C",
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: "#F8FAFC",
                                    "& input": {
                                        color: "#F8FAFC !important",
                                        WebkitTextFillColor: "#F8FAFC !important",
                                        caretColor: BRAND_COLORS.brandBlue,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        "&::placeholder": {
                                            color: "#64748B !important",
                                            opacity: 1,
                                        },
                                    },
                                    "& fieldset": {
                                        borderColor: status === "available" ? "#10B981" : "rgba(255, 255, 255, 0.16)",
                                        borderWidth: status === "available" ? 2 : 1.5,
                                    },
                                    "&:hover fieldset": {
                                        borderColor: status === "available" ? "#10B981" : BRAND_COLORS.brandBlue,
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: status === "available" ? "#10B981" : BRAND_COLORS.brandBlue,
                                        borderWidth: 2,
                                    },
                                },
                            }}
                        />

                        {/* Real-time feedback status */}
                        {statusMessage && (
                            <Box sx={{ mt: 1.2, textAlign: "left" }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 600,
                                        color:
                                            status === "available"
                                                ? "#10B981"
                                                : status === "unavailable" || status === "invalid"
                                                ? "#F87171"
                                                : "#94A3B8",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                    }}
                                >
                                    {statusMessage}
                                </Typography>
                            </Box>
                        )}

                        {/* Alternative Username Suggestions */}
                        {suggestions.length > 0 && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(255, 255, 255, 0.04)", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "left" }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "#F8FAFC", display: "block", mb: 1 }}>
                                    ✨ Available alternatives:
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {suggestions.map((sug) => (
                                        <Chip
                                            key={sug}
                                            label={`@${sug}`}
                                            onClick={() => handleSelectSuggestion(sug)}
                                            clickable
                                            size="small"
                                            sx={{
                                                bgcolor: "#18253A",
                                                border: "1px solid rgba(37, 137, 216, 0.35)",
                                                color: "#38BDF8",
                                                fontWeight: 600,
                                                "&:hover": {
                                                    bgcolor: BRAND_COLORS.brandBlue,
                                                    color: "#FFFFFF",
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={submitting || status === "checking" || status === "unavailable" || status === "invalid" || !usernameInput.trim()}
                            endIcon={submitting ? <CircularProgress size={18} sx={{ color: "#FFFFFF" }} /> : <ArrowForwardRoundedIcon />}
                            sx={{
                                mt: 3.5,
                                py: 1.5,
                                borderRadius: "14px",
                                fontWeight: 700,
                                fontSize: 16,
                                textTransform: "none",
                                background: BRAND_COLORS.brandBlue,
                                boxShadow: "0 10px 25px rgba(37, 137, 216, 0.35)",
                                "&:hover": {
                                    background: BRAND_COLORS.brandBlueHover,
                                    boxShadow: "0 12px 28px rgba(37, 137, 216, 0.45)",
                                },
                                "&.Mui-disabled": {
                                    background: "rgba(255, 255, 255, 0.08)",
                                    color: "rgba(255, 255, 255, 0.28)",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            {submitting ? "Claiming Username..." : "Claim Username & Continue"}
                        </Button>
                    </Box>
                </Card>
            </Fade>
        </Box>
    );
}
