import { createTheme } from "@mui/material/styles";

// ============================================================
// ENGAZE PREMIUM DESIGN SYSTEM THEME
// Authentic, romantic, modern, and trustworthy.
// Palette: Light Sky-Blue, Deep Navy & Vibrant Engaze Blue with soft coral & lavender accents
// ============================================================

export const BRAND_COLORS = {
    // Brand Gradients
    primaryGradient: "linear-gradient(135deg, #2589D8 0%, #1D6FB0 100%)",
    primaryGradientHover: "linear-gradient(135deg, #1E73B9 0%, #175B92 100%)",
    secondaryGradient: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    superLikeGradient: "linear-gradient(135deg, #00D2FF 0%, #0078FF 100%)",
    goldGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    engazePlusGradient: "linear-gradient(135deg, #2589D8 0%, #8B5CF6 100%)",
    darkGradient: "linear-gradient(180deg, #142B45 0%, #0D1D30 100%)",
    cardOverlay: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(20, 43, 69, 0.45) 65%, rgba(20, 43, 69, 0.92) 100%)",
    cardStackOverlay: "linear-gradient(180deg, rgba(20, 43, 69, 0.08) 0%, rgba(20, 43, 69, 0.75) 100%)",
    chatBubbleSent: "linear-gradient(135deg, #2589D8 0%, #1D6FB0 100%)",

    // Solid Accents
    coralPink: "#FF5A70",
    sunsetOrange: "#FF7A00",
    violet: "#8B5CF6",
    emerald: "#10B981",
    gold: "#F59E0B",
    amberGold: "#D97706",
    crimson: "#EF4444",
    superLike: "#00D2FF",
    verifiedBlue: "#2589D8",

    // Backgrounds & Surfaces (Engaze Light Canvas)
    bgDark: "#F7FAFE",
    backgroundDark: "#F7FAFE",
    surfaceDark: "#FFFFFF",
    surfaceDarkElevated: "#FFFFFF",
    surfaceDarkCard: "#FFFFFF",
    surfaceDarkBorder: "rgba(20, 43, 69, 0.08)",
    chatBubbleReceived: "#F1F5F9",

    // Neutral Text (Deep Navy & Slate)
    textPrimary: "#142B45",
    textSecondary: "#5A6B82",
    textMuted: "#8E9CAE",
    textDark: "#142B45",
    textDarkMuted: "#5A6B82",

    // Pop / Clean Border & Shadows
    hotPink: "#2589D8",
    electricPink: "#FF5A70",
    inkBlack: "#142B45",
    creamBg: "#FFFDF9",
    creamSurface: "#FFFFFF",
    blushBg: "#FFF5F6",
    blushSurface: "#FFFFFF",
    sunYellow: "#FFD233",
    skyCyan: "#24C5F7",
    borderDark: "1px solid rgba(20, 43, 69, 0.12)",
    shadowPop: "0 4px 14px rgba(20, 43, 69, 0.06)",
    shadowPopLg: "0 10px 30px rgba(20, 43, 69, 0.08)",
    shadowPopXl: "0 18px 48px rgba(20, 43, 69, 0.12)",

    // Engaze Original Sky-Blue & Deep Navy Identity
    skyBlue: "#EAF6FF",
    brandBlue: "#2589D8",
    brandBlueHover: "#1E73B9",
    deepNavy: "#142B45",
    accentLavender: "#B8A7FF",
    softCoral: "#FF8F9C",
    pureWhite: "#FFFFFF",
    secondaryBg: "#F7FAFE",
    mutedNavy: "#62748A",
    borderNavySubtle: "1px solid rgba(20, 43, 69, 0.08)",
    borderNavyLight: "1.5px solid rgba(20, 43, 69, 0.12)",
    shadowSoftNavy: "0 8px 28px rgba(20, 43, 69, 0.06)",
    shadowElevatedNavy: "0 14px 40px rgba(20, 43, 69, 0.1)",
    blueGradient: "linear-gradient(135deg, #2589D8 0%, #1D6FB0 100%)",
    blueGradientHover: "linear-gradient(135deg, #1E73B9 0%, #175B92 100%)",
};

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: BRAND_COLORS.brandBlue,
            light: "#54A8E8",
            dark: BRAND_COLORS.brandBlueHover,
            contrastText: "#FFFFFF",
        },
        secondary: {
            main: BRAND_COLORS.softCoral,
            light: "#FFAAB5",
            dark: "#E56776",
            contrastText: "#FFFFFF",
        },
        background: {
            default: "#F7FAFE",
            paper: "#FFFFFF",
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
            color: BRAND_COLORS.deepNavy,
        },
        h2: {
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: BRAND_COLORS.deepNavy,
        },
        h3: {
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: BRAND_COLORS.deepNavy,
        },
        h4: {
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: BRAND_COLORS.deepNavy,
        },
        h5: {
            fontWeight: 600,
            color: BRAND_COLORS.deepNavy,
        },
        h6: {
            fontWeight: 600,
            color: BRAND_COLORS.deepNavy,
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
                    borderRadius: 9999,
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
                    background: BRAND_COLORS.brandBlue,
                    backgroundColor: BRAND_COLORS.brandBlue,
                    backgroundImage: "none",
                    boxShadow: "0 4px 20px rgba(37, 137, 216, 0.32)",
                    "&:hover": {
                        background: BRAND_COLORS.brandBlueHover,
                        backgroundColor: BRAND_COLORS.brandBlueHover,
                        backgroundImage: "none",
                        boxShadow: "0 6px 24px rgba(37, 137, 216, 0.42)",
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    borderRadius: 24,
                    backgroundImage: "none",
                    boxShadow: "0 8px 24px rgba(20, 43, 69, 0.04)",
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
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 16,
                        backgroundColor: "#FFFFFF",
                        "&:hover fieldset": {
                            borderColor: "rgba(37, 137, 216, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: BRAND_COLORS.brandBlue,
                            boxShadow: "0 0 0 3px rgba(37, 137, 216, 0.15)",
                        },
                    },
                },
            },
        },
    },
});

export default theme;
