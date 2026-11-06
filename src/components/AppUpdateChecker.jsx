import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { App } from "@capacitor/app";
import axios from "axios";
import server from "../environment";
import versionInfo from "../version.json";

/**
 * Compare two semver strings (e.g. "1.0.3" > "1.0.2")
 */
export function isVersionNewer(current, latest) {
    if (!latest || !current) return false;
    const cleanCurrent = String(current).replace(/^v/i, "").trim();
    const cleanLatest = String(latest).replace(/^v/i, "").trim();
    const cParts = cleanCurrent.split(".").map(Number);
    const lParts = cleanLatest.split(".").map(Number);
    for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
        const c = cParts[i] || 0;
        const l = lParts[i] || 0;
        if (l > c) return true;
        if (l < c) return false;
    }
    return false;
}

/**
 * Returns installed version name and version code from native PackageManager
 * or fallback to centralized version.json
 */
export async function getInstalledVersionInfo() {
    let installedVersion = versionInfo.versionName || "1.0.3";
    let installedVersionCode = versionInfo.versionCode || 4;

    try {
        if (Capacitor.isNativePlatform()) {
            const info = await App.getInfo();
            if (info?.version) installedVersion = info.version;
            if (info?.build) {
                const parsedBuild = parseInt(info.build, 10);
                if (!isNaN(parsedBuild) && parsedBuild > 0) {
                    installedVersionCode = parsedBuild;
                }
            }
        }
    } catch (err) {
        console.warn("[AppUpdateChecker] App.getInfo() fallback to version.json:", err?.message);
    }

    return { installedVersion, installedVersionCode };
}

export default function AppUpdateChecker() {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [installedVerName, setInstalledVerName] = useState(versionInfo.versionName || "1.0.3");

    const lastCheckTimeRef = useRef(0);
    const retryCountRef = useRef(0);

    const checkForUpdate = useCallback(async (isResume = false) => {
        // Enforce 5-minute debounce on resume checks to avoid spamming the backend
        const now = Date.now();
        if (isResume && now - lastCheckTimeRef.current < 5 * 60 * 1000) {
            return;
        }

        try {
            const { installedVersion, installedVersionCode } = await getInstalledVersionInfo();
            setInstalledVerName(installedVersion);

            const res = await axios.get(`${server}/api/v1/app-version`, {
                timeout: 12000,
                headers: {
                    "Cache-Control": "no-cache, no-store",
                    Pragma: "no-cache",
                },
            });

            lastCheckTimeRef.current = Date.now();
            retryCountRef.current = 0;

            if (!res.data || !res.data.success) return;

            const {
                latestVersion,
                latestVersionCode,
                minSupportedVersionCode,
                forceUpdate,
                apkDownloadUrl,
                releaseNotes,
            } = res.data;

            const targetCode = parseInt(latestVersionCode, 10) || 0;
            const hasNewerVersion = (targetCode > 0 && targetCode > installedVersionCode) ||
                isVersionNewer(installedVersion, latestVersion);

            if (hasNewerVersion) {
                const isForced = Boolean(forceUpdate) ||
                    (minSupportedVersionCode && installedVersionCode < parseInt(minSupportedVersionCode, 10));

                setUpdateInfo({
                    latestVersion: latestVersion || "Latest",
                    apkDownloadUrl: apkDownloadUrl || "https://github.com/CrysPy-SAM/Engaze.com-frontend/releases/latest/download/Engaze.apk",
                    releaseNotes: releaseNotes || "Performance enhancements, bug fixes, and reliability improvements.",
                    isForced,
                });
                setDialogOpen(true);
            }
        } catch (err) {
            console.log("[AppUpdateChecker] Update check skipped:", err?.message);
            // Retry on initial cold-start / network failure up to 3 times
            if (!isResume && retryCountRef.current < 3) {
                retryCountRef.current += 1;
                const backoffDelay = retryCountRef.current * 4000;
                setTimeout(() => checkForUpdate(false), backoffDelay);
            }
        }
    }, []);

    // Initial check on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            checkForUpdate(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [checkForUpdate]);

    // Re-check when app returns from background to foreground
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let listenerPromise = null;
        try {
            listenerPromise = App.addListener("appStateChange", ({ isActive }) => {
                if (isActive) {
                    checkForUpdate(true);
                }
            });
        } catch (err) {
            console.warn("[AppUpdateChecker] Failed to attach appStateChange listener:", err);
        }

        return () => {
            if (listenerPromise && typeof listenerPromise.then === "function") {
                listenerPromise.then((handle) => {
                    if (handle && typeof handle.remove === "function") {
                        handle.remove();
                    }
                }).catch(() => {});
            }
        };
    }, [checkForUpdate]);

    if (!updateInfo) return null;

    const handleUpdateClick = () => {
        let url = updateInfo?.apkDownloadUrl || "https://github.com/CrysPy-SAM/Engaze.com-frontend/releases/latest/download/Engaze.apk";
        if (!url.startsWith("https://")) {
            url = "https://github.com/CrysPy-SAM/Engaze.com-frontend/releases/latest/download/Engaze.apk";
        }

        // 1. Native bridge to open system browser directly
        if (window.EngazeNativeNotifications && typeof window.EngazeNativeNotifications.openBrowser === "function") {
            try {
                window.EngazeNativeNotifications.openBrowser(url);
                return;
            } catch (err) {
                console.warn("[AppUpdateChecker] EngazeNativeNotifications.openBrowser failed:", err);
            }
        }

        // 2. Direct browser intent fallback
        try {
            window.open(url, "_system");
        } catch {
            window.location.href = url;
        }
    };

    return (
        <Dialog
            open={dialogOpen}
            onClose={() => {
                if (!updateInfo.isForced) {
                    setDialogOpen(false);
                }
            }}
            disableEscapeKeyDown={updateInfo.isForced}
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    borderRadius: "28px",
                    bgcolor: "#121C2D",
                    border: "1.5px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
                    p: { xs: 2.5, sm: 3.5 },
                    maxWidth: 390,
                    width: "92%",
                    mx: "auto",
                    color: "#FFFFFF",
                },
            }}
        >
            <DialogContent sx={{ p: 0, textAlign: "center" }}>
                {/* Glowing Update Badge */}
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
                    label={`v${installedVerName} → v${updateInfo.latestVersion}`}
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
                    {updateInfo.isForced ? "Required Update" : "Update Available!"}
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

                {/* Actions */}
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

                    {!updateInfo.isForced && (
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
