import React from "react";
import { Box, Typography } from "@mui/material";
import { BRAND_COLORS } from "../theme";

/**
 * EngazeLogo Component
 * Official Engaze Brand Logo & Wordmark
 *
 * @param {Object} props
 * @param {number} [props.size=32] - Icon size in px
 * @param {boolean} [props.showWordmark=true] - Whether to display the text wordmark
 * @param {string} [props.fontSize="1.35rem"] - Font size for the wordmark
 * @param {Function} [props.onClick] - Optional click handler
 * @param {Object} [props.sx] - Optional MUI Box sx props
 */
export default function EngazeLogo({
    size = 32,
    showWordmark = true,
    fontSize = "1.35rem",
    onClick,
    sx = {},
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.2,
                cursor: onClick ? "pointer" : "default",
                userSelect: "none",
                transition: onClick ? "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
                "&:hover": onClick ? { transform: "scale(1.02)" } : {},
                "&:active": onClick ? { transform: "scale(0.98)" } : {},
                ...sx,
            }}
        >
            {/* Vector Brand Icon */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block", flexShrink: 0 }}
            >
                <defs>
                    <linearGradient id="engazeLogoGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FD3A73" />
                        <stop offset="50%" stopColor="#FF5E7E" />
                        <stop offset="100%" stopColor="#FF7A00" />
                    </linearGradient>
                    <filter id="engazeLogoShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#FD3A73" floodOpacity="0.45" />
                    </filter>
                </defs>

                {/* Engaze Stylized Heart & Spark Mark */}
                <path
                    d="M24 42.5C23.2 42.5 22.4 42.1 21.8 41.4C11.5 31.2 5.5 24.8 5.5 16.5C5.5 9.8 10.8 4.5 17.5 4.5C21.4 4.5 25.1 6.3 27.5 9.3C29.9 6.3 33.6 4.5 37.5 4.5C44.2 4.5 49.5 9.8 49.5 16.5C49.5 24.8 43.5 31.2 33.2 41.4C32.6 42.1 31.8 42.5 31 42.5H24Z"
                    transform="translate(-2.5, 0)"
                    fill="url(#engazeLogoGradient)"
                    filter="url(#engazeLogoShadow)"
                />
                {/* Modern Inner Gaze Spark */}
                <circle cx="21" cy="18" r="3.2" fill="#FFFFFF" fillOpacity="0.95" />
            </svg>

            {/* Official Typography Wordmark */}
            {showWordmark && (
                <Typography
                    component="span"
                    sx={{
                        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: 900,
                        fontSize: fontSize,
                        letterSpacing: "-0.025em",
                        lineHeight: 1,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    Engaze
                    <Box
                        component="span"
                        sx={{
                            color: BRAND_COLORS.coralPink,
                            ml: "1px",
                            display: "inline-block",
                        }}
                    >
                        .
                    </Box>
                </Typography>
            )}
        </Box>
    );
}

