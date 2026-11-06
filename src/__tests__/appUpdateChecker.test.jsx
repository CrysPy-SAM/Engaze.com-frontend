jest.mock("axios", () => ({
    create: () => ({
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    }),
    put: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import AppUpdateChecker, { isVersionNewer, getInstalledVersionInfo } from "../components/AppUpdateChecker";

describe("AppUpdateChecker Component and Helpers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete window.EngazeNativeNotifications;
        delete window.open;
    });

    describe("isVersionNewer", () => {
        it("returns true when remote version is higher", () => {
            expect(isVersionNewer("1.0.3", "1.0.4")).toBe(true);
            expect(isVersionNewer("1.0.3", "1.1.0")).toBe(true);
            expect(isVersionNewer("1.0.3", "2.0.0")).toBe(true);
            expect(isVersionNewer("v1.0.3", "v1.0.4")).toBe(true);
        });

        it("returns false when remote version is equal or lower", () => {
            expect(isVersionNewer("1.0.3", "1.0.3")).toBe(false);
            expect(isVersionNewer("1.0.4", "1.0.3")).toBe(false);
            expect(isVersionNewer("2.0.0", "1.9.9")).toBe(false);
            expect(isVersionNewer("v1.0.3", "1.0.3")).toBe(false);
        });

        it("handles missing or empty arguments safely", () => {
            expect(isVersionNewer(null, "1.0.0")).toBe(false);
            expect(isVersionNewer("1.0.0", null)).toBe(false);
            expect(isVersionNewer("", "")).toBe(false);
        });
    });

    describe("getInstalledVersionInfo", () => {
        it("returns default/json version info when not on native device", async () => {
            const info = await getInstalledVersionInfo();
            expect(info).toHaveProperty("installedVersion");
            expect(info).toHaveProperty("installedVersionCode");
            expect(typeof info.installedVersion).toBe("string");
            expect(typeof info.installedVersionCode).toBe("number");
        });
    });

    describe("Update Dialog UI and Browser Delegation", () => {
        it("shows update popup when a newer version is reported by backend and opens browser on click", async () => {
            axios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    latestVersion: "9.9.9",
                    latestVersionCode: 999,
                    forceUpdate: false,
                    apkDownloadUrl: "https://github.com/CrysPy-SAM/Engaze.com-frontend/releases/latest/download/Engaze.apk",
                    releaseNotes: "New test features and improvements.",
                },
            });

            const openBrowserMock = jest.fn();
            window.EngazeNativeNotifications = {
                openBrowser: openBrowserMock,
            };

            render(<AppUpdateChecker />);

            await waitFor(() => {
                expect(screen.getByText("Update Available!")).toBeInTheDocument();
            }, { timeout: 3500 });

            expect(screen.getByText("New test features and improvements.")).toBeInTheDocument();
            expect(screen.getByText("Maybe Later")).toBeInTheDocument();

            const updateButton = screen.getByText("Update Now");
            fireEvent.click(updateButton);

            expect(openBrowserMock).toHaveBeenCalledWith(
                "https://github.com/CrysPy-SAM/Engaze.com-frontend/releases/latest/download/Engaze.apk"
            );
        });

        it("falls back to window.open when native bridge is unavailable", async () => {
            axios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    latestVersion: "9.9.9",
                    latestVersionCode: 999,
                    forceUpdate: false,
                    apkDownloadUrl: "https://example.com/Engaze.apk",
                    releaseNotes: "Browser fallback test.",
                },
            });

            const windowOpenMock = jest.fn();
            window.open = windowOpenMock;

            render(<AppUpdateChecker />);

            await waitFor(() => {
                expect(screen.getByText("Update Available!")).toBeInTheDocument();
            }, { timeout: 3500 });

            const updateButton = screen.getByText("Update Now");
            fireEvent.click(updateButton);

            expect(windowOpenMock).toHaveBeenCalledWith("https://example.com/Engaze.apk", "_system");
        });

        it("renders as forced update without 'Maybe Later' when forceUpdate is true", async () => {
            axios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    latestVersion: "9.9.9",
                    latestVersionCode: 999,
                    forceUpdate: true,
                    apkDownloadUrl: "https://example.com/Engaze.apk",
                    releaseNotes: "Critical mandatory security update.",
                },
            });

            render(<AppUpdateChecker />);

            await waitFor(() => {
                expect(screen.getByText("Required Update")).toBeInTheDocument();
            }, { timeout: 3500 });

            expect(screen.queryByText("Maybe Later")).not.toBeInTheDocument();
        });
    });
});
