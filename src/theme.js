import { createTheme } from "@mui/material/styles";

// ============================================================
// ENGAZE PREMIUM DESIGN SYSTEM THEME
// Authentic, romantic, modern, and trustworthy.
// Authenticated App Palette: Deep Midnight Navy (#0A111C) + Midnight Slate Surfaces (#121C2D)
// with Vibrant Engaze Blue (#2589D8), Soft Coral (#FF5A70), and Crisp White Typography (#F8FAFC).
// ============================================================

export const BRAND_COLORS = {
    // Brand Gradients
    primaryGradient: "linear-gradient(135deg, #2589D8 0%, #1D6FB0 100%)",
    primaryGradientHover: "linear-gradient(135deg, #1E73B9 0%, #175B92 100%)",
    secondaryGradient: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    superLikeGradient: "linear-gradient(135deg, #00D2FF 0%, #0078FF 100%)",
    goldGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    engazePlusGradient: "linear-gradient(135deg, #2589D8 0%, #8B5CF6 100%)",
    darkGradient: "linear-gradient(180deg, #121C2D 0%, #0A111C 100%)",
    cardOverlay: "linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(10, 17, 28, 0.5) 60%, rgba(10, 17, 28, 0.95) 100%)",
    cardStackOverlay: "linear-gradient(180deg, rgba(10, 17, 28, 0.15) 0%, rgba(10, 17, 28, 0.85) 100%)",
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

    // Backgrounds & Surfaces (Engaze Deep Midnight Navy System)
    bgDark: "#0A111C",
    backgroundDark: "#0A111C",
    surfaceDark: "#121C2D",
    surfaceDarkElevated: "#18253A",
    surfaceDarkCard: "#121C2D",
    surfaceDarkBorder: "rgba(255, 255, 255, 0.08)",
    chatBubbleReceived: "#18253A",

    // Neutral Text (Crisp White & Slate)
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textDark: "#F8FAFC",
    textDarkMuted: "#94A3B8",

    // Pop / Clean Border & Shadows
    hotPink: "#2589D8",
    electricPink: "#FF5A70",
    inkBlack: "#0A111C",
    creamBg: "#0A111C",
    creamSurface: "#121C2D",
    blushBg: "#0D1524",
    blushSurface: "#121C2D",
    sunYellow: "#FFD233",
    skyCyan: "#24C5F7",
    borderDark: "1px solid rgba(255, 255, 255, 0.08)",
    shadowPop: "0 4px 14px rgba(0, 0, 0, 0.25)",
    shadowPopLg: "0 10px 30px rgba(0, 0, 0, 0.35)",
    shadowPopXl: "0 18px 48px rgba(0, 0, 0, 0.45)",

    // Engaze Sky-Blue & Deep Navy Identity Tokens
    skyBlue: "#EAF6FF",
    brandBlue: "#2589D8",
    brandBlueHover: "#1E73B9",
    deepNavy: "#F8FAFC",
    accentLavender: "#B8A7FF",
    softCoral: "#FF8F9C",
    pureWhite: "#FFFFFF",
    secondaryBg: "#0D1524",
    mutedNavy: "#94A3B8",
    borderNavySubtle: "1px solid rgba(255, 255, 255, 0.08)",
    borderNavyLight: "1.5px solid rgba(37, 137, 216, 0.25)",
    shadowSoftNavy: "0 8px 28px rgba(0, 0, 0, 0.3)",
    shadowElevatedNavy: "0 14px 40px rgba(0, 0, 0, 0.4)",
    blueGradient: "linear-gradient(135deg, #2589D8 0%, #1D6FB0 100%)",
    blueGradientHover: "linear-gradient(135deg, #1E73B9 0%, #175B92 100%)",
};

const theme = createTheme({
    palette: {
        mode: "dark",
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
            default: "#0A111C",
            paper: "#121C2D",
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
            color: "#F8FAFC",
        },
        h2: {
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#F8FAFC",
        },
        h3: {
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: "#F8FAFC",
        },
        h4: {
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#F8FAFC",
        },
        h5: {
            fontWeight: 600,
            color: "#F8FAFC",
        },
        h6: {
            fontWeight: 600,
            color: "#F8FAFC",
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
                    backgroundColor: "#121C2D",
                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    borderRadius: 24,
                    backgroundImage: "none",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    backgroundColor: "#121C2D",
                    color: "#F8FAFC",
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#121C2D",
                    backgroundImage: "none",
                    color: "#F8FAFC",
                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    borderRadius: 24,
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.55)",
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#121C2D !important",
                    backgroundImage: "none !important",
                    color: "#F8FAFC !important",
                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    borderRadius: 20,
                    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
                },
            },
        },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#121C2D !important",
                    backgroundImage: "none !important",
                    color: "#F8FAFC !important",
                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                    borderRadius: 20,
                    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: "#F8FAFC",
                    "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                    },
                },
            },
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: "#F8FAFC",
                },
                secondary: {
                    color: BRAND_COLORS.textSecondary,
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
                        backgroundColor: "#142034",
                        color: "#F8FAFC",
                        "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.1)",
                        },
                        "&:hover fieldset": {
                            borderColor: "rgba(37, 137, 216, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: BRAND_COLORS.brandBlue,
                            boxShadow: "0 0 0 3px rgba(37, 137, 216, 0.25)",
                        },
                    },
                },
            },
        },
    },
});

export default theme;
