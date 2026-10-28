import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * EngazeLogo Component
 * Official Engaze Brand Logo & Wordmark
 *
 * Visual Identity:
 * - Two stylized figures connecting into an open glowing heart
 * - Center play button symbolizing real-time live video calls & dates
 * - Gradient transition from electric violet (#6C5CE7) to coral pink (#FD79A8 / #FF7675)
 * - Modern typography with floating heart accent above 'e'
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
    textColor = "#FFFFFF",
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
            {/* Vector Brand Heart + Video Play Mark */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block", flexShrink: 0 }}
            >
                <defs>
                    <linearGradient id="compLogoLeftGrad" x1="12" y1="12" x2="34" y2="52" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#8A63F8" />
                        <stop offset="40%" stopColor="#6C5CE7" />
                        <stop offset="100%" stopColor="#4834D4" />
                    </linearGradient>
                    <linearGradient id="compLogoRightGrad" x1="30" y1="14" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FD79A8" />
                        <stop offset="50%" stopColor="#FF5E7E" />
                        <stop offset="100%" stopColor="#FF7675" />
                    </linearGradient>
                    <linearGradient id="compLogoLeftHead" x1="18" y1="13" x2="26" y2="21" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#A29BFE" />
                        <stop offset="100%" stopColor="#6C5CE7" />
                    </linearGradient>
                    <linearGradient id="compLogoRightHead" x1="38" y1="15" x2="46" y2="23" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFAAA6" />
                        <stop offset="100%" stopColor="#FF5E7E" />
                    </linearGradient>
                    <linearGradient id="compLogoPlayGrad" x1="28" y1="29" x2="38" y2="36" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#F1F2F6" />
                    </linearGradient>
                    <filter id="compLogoShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
                        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#6C5CE7" floodOpacity="0.4" />
                    </filter>
                </defs>

                <g filter="url(#compLogoShadow)">
                    {/* Left Violet Figure */}
                    <path
                        d="M22 23 C15 23 11 29 11 36 C11 44 21 50 32 55 C24 49 17 43 17 36 C17 31 20 27 25 27 C29 27 32 30 33 33 C31 27 28 23 22 23 Z"
                        fill="url(#compLogoLeftGrad)"
                    />
                    {/* Right Pink Figure */}
                    <path
                        d="M42 25 C48 25 53 30 53 37 C53 45 42 51 32 55 C40 50 47 44 47 37 C47 32 44 28 39 28 C35 28 32 31 31 34 C33 29 36 25 42 25 Z"
                        fill="url(#compLogoRightGrad)"
                    />
                    {/* Tip */}
                    <path
                        d="M28 50 C31 52 33 53 32 55 C31 53 29 52 28 50 Z"
                        fill="#FD79A8"
                    />
                    {/* Glowing Heads */}
                    <circle cx="22" cy="17" r="4.2" fill="url(#compLogoLeftHead)" />
                    <circle cx="42" cy="19" r="4.2" fill="url(#compLogoRightHead)" />
                    {/* Center Play Button */}
                    <path
                        d="M29 30.5 C29 29.5 30.1 28.9 31 29.4 L37.8 33.4 C38.6 33.9 38.6 35.1 37.8 35.6 L31 39.6 C30.1 40.1 29 39.5 29 38.5 Z"
                        fill="url(#compLogoPlayGrad)"
                    />
                    {/* Sparkle */}
                    <path
                        d="M10 20 Q10 23 7 23 Q10 23 10 26 Q10 23 13 23 Q10 23 10 20 Z"
                        fill="#FD79A8"
                        opacity="0.85"
                    />
                </g>
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
                        color: textColor,
                        display: "inline-flex",
                        alignItems: "center",
                        position: "relative",
                    }}
                >
                    engaze
                    {/* Floating Heart Accent */}
                    <Box
                        component="span"
                        aria-hidden="true"
                        sx={{
                            display: "inline-block",
                            width: "7px",
                            height: "7px",
                            ml: "2px",
                            mb: "8px",
                            background: "linear-gradient(135deg, #FD79A8 0%, #FF7675 100%)",
                            clipPath: "path('M 3.5 1 C 3 0 2 0 1.5 0.5 C 0.5 1.5 0.5 3 2 4.5 L 3.5 6 L 5 4.5 C 6.5 3 6.5 1.5 5.5 0.5 C 5 0 4 0 3.5 1 Z')",
                            transform: "scale(1.2) rotate(10deg)",
                        }}
                    />
                </Typography>
            )}
        </Box>
    );
}
