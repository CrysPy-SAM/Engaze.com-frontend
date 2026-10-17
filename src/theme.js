import { createTheme } from "@mui/material/styles";

// ============================================================
// ENGAZE PREMIUM DESIGN SYSTEM THEME
// Romantic, confident, modern, and visually engaging.
// Palette: Midnight charcoal/plum foundation + Coral-Pink & Sunset Violet gradients
// ============================================================

export const BRAND_COLORS = {
    // Brand Gradients
    primaryGradient: "linear-gradient(135deg, #FD3A73 0%, #FF655B 50%, #FF7A00 100%)",
    primaryGradientHover: "linear-gradient(135deg, #E62A62 0%, #F5554B 50%, #E66800 100%)",
    secondaryGradient: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    superLikeGradient: "linear-gradient(135deg, #00D2FF 0%, #0078FF 100%)",
    goldGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    darkGradient: "linear-gradient(180deg, rgba(11, 13, 23, 0.95) 0%, rgba(19, 22, 37, 0.98) 100%)",
    cardOverlay: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(11, 13, 23, 0.5) 60%, rgba(11, 13, 23, 0.92) 85%, #0B0D17 100%)",
    cardStackOverlay: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11, 13, 23, 0.8) 100%)",

    // Solid Accents
    coralPink: "#FD3A73",
    sunsetOrange: "#FF7A00",
    violet: "#8B5CF6",
    emerald: "#10B981",
    gold: "#F59E0B",
    crimson: "#EF4444",
    superLike: "#00D2FF",

    // Backgrounds & Surfaces (Dark & Light)
    bgDark: "#0B0D17",
    backgroundDark: "#0B0D17",
    surfaceDark: "#131625",
    surfaceDarkElevated: "#1C2035",
    surfaceDarkCard: "#1C2035",
    surfaceDarkBorder: "rgba(255, 255, 255, 0.08)",

    // Neutral Text
    textPrimary: "#FFFFFF",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
};

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: BRAND_COLORS.coralPink,
            light: "#FF6584",
            dark: "#E62A62",
            contrastText: "#FFFFFF",
        },
        secondary: {
            main: BRAND_COLORS.sunsetOrange,
            light: "#FFA040",
            dark: "#E66800",
            contrastText: "#FFFFFF",
        },
        background: {
            default: BRAND_COLORS.bgDark,
            paper: BRAND_COLORS.surfaceDark,
        },
        text: {
            primary: BRAND_COLORS.textPrimary,
            secondary: BRAND_COLORS.textSecondary,
        },
        error: {
            main: BRAND_COLORS.crimson,
        },
        success: {
            main: BRAND_COLORS.emerald,
        },
    },
    typography: {
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Plus Jakarta Sans"',
            '"Inter"',
            '"Segoe UI"',
            "Roboto",
            "sans-serif",
        ].join(","),
        h1: {
            fontWeight: 800,
            letterSpacing: "-0.025em",
        },
        h2: {
            fontWeight: 800,
            letterSpacing: "-0.02em",
        },
        h3: {
            fontWeight: 700,
            letterSpacing: "-0.015em",
        },
        h4: {
            fontWeight: 700,
            letterSpacing: "-0.01em",
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            fontWeight: 700,
            textTransform: "none",
            letterSpacing: "0.01em",
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 9999, // Pill by default
                    padding: "10px 24px",
                    fontSize: "0.95rem",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                        transform: "translateY(-1px)",
                    },
                    "&:active": {
                        transform: "translateY(0px)",
                    },
                },
                containedPrimary: {
                    background: BRAND_COLORS.primaryGradient,
                    boxShadow: "0 4px 20px rgba(253, 58, 115, 0.35)",
                    "&:hover": {
                        background: BRAND_COLORS.primaryGradientHover,
                        boxShadow: "0 6px 24px rgba(253, 58, 115, 0.5)",
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: BRAND_COLORS.surfaceDark,
                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    borderRadius: 24,
                    backgroundImage: "none",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 9999,
                    fontWeight: 600,
                    backdropFilter: "blur(8px)",
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        "&:hover fieldset": {
                            borderColor: "rgba(253, 58, 115, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: BRAND_COLORS.coralPink,
                            boxShadow: "0 0 0 3px rgba(253, 58, 115, 0.15)",
                        },
                    },
                },
            },
        },
    },
});

export default theme;

