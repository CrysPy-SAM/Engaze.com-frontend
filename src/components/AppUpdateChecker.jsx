import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Stack,
    Chip,
    Fade,
} from "@mui/material";
import SystemUpdateRoundedIcon from "@mui/icons-material/SystemUpdateRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { Capacitor } from "@capacitor/core";
import axios from "axios";
import server from "../environment";

// Current installed version of this client bundle
export const CURRENT_APP_VERSION = "1.0.0";
export const CURRENT_VERSION_CODE = 1;

/**
 * Compare two semver strings (e.g. "1.0.1" > "1.0.0")
 */
function isVersionNewer(current, latest) {
    if (!latest || !current) return false;
    const cParts = current.split(".").map(Number);
    const lParts = latest.split(".").map(Number);
    for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
        const c = cParts[i] || 0;
        const l = lParts[i] || 0;
        if (l > c) return true;
        if (l < c) return false;
    }
    return false;
}

export default function AppUpdateChecker() {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        // Only trigger update check inside installed native mobile app
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        let isMounted = true;

        const checkForUpdate = async () => {
            try {
                const res = await axios.get(`${server}/api/v1/app-version`, { timeout: 10000 });
                if (!isMounted || !res.data) return;

                const { latestVersion, latestVersionCode, forceUpdate, apkDownloadUrl, releaseNotes } = res.data;

                // Check by version code or semver string
                const hasNewerVersion = (latestVersionCode && latestVersionCode > CURRENT_VERSION_CODE) ||
                    isVersionNewer(CURRENT_APP_VERSION, latestVersion);

                if (hasNewerVersion) {
                    setUpdateInfo({
                        latestVersion: latestVersion || "Latest",
                        apkDownloadUrl: apkDownloadUrl || "https://www.engaze.date",
                        releaseNotes: releaseNotes || "Performance enhancements and bug fixes.",
                        forceUpdate: Boolean(forceUpdate),
                    });
                    setDialogOpen(true);
                }
            } catch (err) {
                // Silently ignore if offline or server temporarily unreachable
                console.log("[AppUpdateChecker] Update check skipped:", err?.message);
            }
        };

        // Check after initial app mount
        const timer = setTimeout(checkForUpdate, 2000);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    if (!updateInfo) return null;

    const handleUpdateClick = () => {
        if (updateInfo.apkDownloadUrl) {
            window.open(updateInfo.apkDownloadUrl, "_system");
        }
    };

    return (
        <Dialog
            open={dialogOpen}
            onClose={() => {
                if (!updateInfo.forceUpdate) {
                    setDialogOpen(false);
                }
            }}
            disableEscapeKeyDown={updateInfo.forceUpdate}
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    borderRadius: "28px",
                    bgcolor: "#121C2D",
                    border: "1.5px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7)",
                    p: { xs: 2.5, sm: 3.5 },
                    maxWidth: 380,
                    width: "90%",
                    mx: "auto",
                    color: "#FFFFFF",
                },
            }}
        >
            <DialogContent sx={{ p: 0, textAlign: "center" }}>
                {/* Glowing Update Icon Badge */}
                <Box
                    sx={{
                        width: 68,
                        height: 68,
                        borderRadius: "50%",
                        bgcolor: "rgba(253, 58, 115, 0.12)",
                        border: "1px solid rgba(253, 58, 115, 0.35)",
                        boxShadow: "0 8px 24px rgba(253, 58, 115, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                    }}
                >
                    <SystemUpdateRoundedIcon sx={{ fontSize: 34, color: "#FD3A73" }} />
                </Box>

                <Chip
                    icon={<RocketLaunchRoundedIcon sx={{ fontSize: "14px !important", color: "#2589D8 !important" }} />}
                    label={`Version ${updateInfo.latestVersion} Available`}
                    size="small"
                    sx={{
                        mb: 1.5,
                        bgcolor: "rgba(37, 137, 216, 0.12)",
                        color: "#2589D8",
                        border: "1px solid rgba(37, 137, 216, 0.3)",
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        letterSpacing: "0.04em",
                    }}
                />

                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "#FFFFFF",
                        mb: 1,
                        fontSize: "1.35rem",
                    }}
                >
                    Update Available!
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: "#94A3B8",
                        fontSize: "0.88rem",
                        lineHeight: 1.5,
                        mb: 2.5,
                    }}
                >
                    {updateInfo.releaseNotes}
                </Typography>

                <Stack spacing={1.2}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleUpdateClick}
                        sx={{
                            height: 50,
                            borderRadius: "9999px",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            textTransform: "none",
                            background: "linear-gradient(135deg, #FD3A73 0%, #FF7A00 100%)",
                            boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                            color: "#FFFFFF",
                            "&:active": {
                                transform: "scale(0.98)",
                            },
                        }}
                    >
                        Update Now
                    </Button>

                    {!updateInfo.forceUpdate && (
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => setDialogOpen(false)}
                            sx={{
                                color: "#94A3B8",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                textTransform: "none",
                                "&:hover": {
                                    color: "#FFFFFF",
                                    bgcolor: "rgba(255, 255, 255, 0.05)",
                                },
                            }}
                        >
                            Maybe Later
                        </Button>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

