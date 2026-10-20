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
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import ProfilePage from "./profile";

// Mock URL.createObjectURL and URL.revokeObjectURL in jsdom
if (typeof window.URL.createObjectURL === "undefined") {
    window.URL.createObjectURL = jest.fn(() => "blob:http://localhost/test-photo-preview");
}
if (typeof window.URL.revokeObjectURL === "undefined") {
    window.URL.revokeObjectURL = jest.fn();
}

describe("Profile Photo Upload UI Integration Tests (Prompt 14.3)", () => {
    const mockUser = {
        name: "Test User",
        username: "testuser",
        bio: "Test bio for profile",
        photos: ["https://images.unsplash.com/photo-existing-1"],
        gender: "other",
        interests: ["Music 🎵"],
        datingPreferences: {
            interestedIn: ["everyone"],
            ageRange: { min: 20, max: 35 },
        },
        isProfileComplete: true,
    };

    const createMockAuthContext = (overrides = {}) => ({
        userData: mockUser,
        token: "mock.jwt.token",
        loading: false,
        isAuthenticated: true,
        getProfile: jest.fn().mockResolvedValue(mockUser),
        updateProfile: jest.fn().mockResolvedValue({ success: true, profile: mockUser }),
        requestPhotoUploadUrl: jest.fn(),
        uploadPhotoBinary: jest.fn(),
        confirmPhotoUpload: jest.fn(),
        deleteProfilePhoto: jest.fn(),
        ...overrides,
    });

    const renderProfilePage = (authContextValue) => {
        return render(
            <MemoryRouter initialEntries={["/profile"]}>
                <AuthContext.Provider value={authContextValue}>
                    <ProfilePage />
                </AuthContext.Provider>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders photo upload UI with 6 slots, replace/remove buttons, and device upload trigger", async () => {
        const authContext = createMockAuthContext();
        renderProfilePage(authContext);

        // Wait for profile loading
        expect(await screen.findByText(/Profile Photos/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload Photo from Device/i)).toBeInTheDocument();

        // Slot 1 should have the existing photo with "Main" chip and replace/remove buttons
        expect(screen.getByLabelText(/Replace photo in slot 1/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Remove photo 1/i)).toBeInTheDocument();

        // Empty slots 2..6 should have accessible upload triggers
        expect(screen.getByLabelText(/Upload photo to slot 2/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Upload photo to slot 6/i)).toBeInTheDocument();
    });

    test("selecting valid file shows pending upload preview card with filename, size, and cancel button", async () => {
        const authContext = createMockAuthContext();
        renderProfilePage(authContext);

        await screen.findByText(/Profile Photos/i);

        const fileInput = screen.getByLabelText(/Upload profile photo file/i);
        const validFile = new File(["dummy binary image content"], "my-avatar.jpg", {
            type: "image/jpeg",
        });

        fireEvent.change(fileInput, { target: { files: [validFile] } });

        // Pending upload card must appear
        expect(await screen.findByText(/Pending Photo Upload/i)).toBeInTheDocument();
        expect(screen.getByText("my-avatar.jpg")).toBeInTheDocument();
        expect(screen.getByTestId("cancel-pending-photo-btn")).toBeInTheDocument();
        expect(screen.getByTestId("upload-pending-photo-btn")).toBeInTheDocument();

        // Canceling dismisses the preview without modifying existing photos
        fireEvent.click(screen.getByTestId("cancel-pending-photo-btn"));
        await waitFor(() => {
            expect(screen.queryByText(/Pending Photo Upload/i)).not.toBeInTheDocument();
        });
    });

    test("rejects invalid format file and displays error message", async () => {
        const authContext = createMockAuthContext();
        renderProfilePage(authContext);

        await screen.findByText(/Profile Photos/i);

        const fileInput = screen.getByLabelText(/Upload profile photo file/i);
        const badFile = new File(["not an image"], "document.pdf", {
            type: "application/pdf",
        });

        fireEvent.change(fileInput, { target: { files: [badFile] } });

        // Should display alert and not show pending upload preview
        expect(await screen.findByText(/Unsupported image format/i)).toBeInTheDocument();
        expect(screen.queryByText(/Pending Photo Upload/i)).not.toBeInTheDocument();
    });

    test("HTTP 503 storage-unavailable response displays clear explanation without fake success", async () => {
        const authContext = createMockAuthContext({
            requestPhotoUploadUrl: jest.fn().mockRejectedValue({
                status: 503,
                code: "STORAGE_UNAVAILABLE",
                message: "Photo storage service is temporarily unavailable. Cloud storage provider is not configured.",
            }),
        });

        renderProfilePage(authContext);
        await screen.findByText(/Profile Photos/i);

        const fileInput = screen.getByLabelText(/Upload profile photo file/i);
        const validFile = new File(["valid-image-bytes"], "portrait.png", {
            type: "image/png",
        });

        fireEvent.change(fileInput, { target: { files: [validFile] } });
        expect(await screen.findByText(/Pending Photo Upload/i)).toBeInTheDocument();

        // Click Upload Photo
        const uploadButton = screen.getByTestId("upload-pending-photo-btn");
        fireEvent.click(uploadButton);

        // Verification: clear message shown, no fake success, storage upload not invoked
        const alerts = await screen.findAllByText(
            /Profile photo uploads are currently unavailable because cloud storage has not been configured/i
        );
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0]).toBeInTheDocument();
        expect(authContext.uploadPhotoBinary).not.toHaveBeenCalled();
        expect(authContext.confirmPhotoUpload).not.toHaveBeenCalled();

        // Existing photo remains preserved in slot 1
        expect(screen.getByLabelText(/Replace photo in slot 1/i)).toBeInTheDocument();
    });

    test("successful upload flow updates photo slots after backend confirmation", async () => {
        const newPhotoUrl = "https://mock.storage/media/new-confirmed-photo.jpg";
        const authContext = createMockAuthContext({
            requestPhotoUploadUrl: jest.fn().mockResolvedValue({
                data: {
                    provider: "dev-mock",
                    uploadUrl: "https://mock.storage/upload/test",
                    uploadToken: "mock.token.123",
                    key: "profile-photos/user/test.jpg",
                },
            }),
            uploadPhotoBinary: jest.fn().mockResolvedValue({ ok: true }),
            confirmPhotoUpload: jest.fn().mockResolvedValue({
                data: {
                    success: true,
                    photos: [mockUser.photos[0], newPhotoUrl],
                    publicUrl: newPhotoUrl,
                },
            }),
        });

        renderProfilePage(authContext);
        await screen.findByText(/Profile Photos/i);

        const fileInput = screen.getByLabelText(/Upload profile photo file/i);
        const validFile = new File(["image-bytes"], "new-pic.webp", {
            type: "image/webp",
        });

        fireEvent.change(fileInput, { target: { files: [validFile] } });
        expect(await screen.findByText(/Pending Photo Upload/i)).toBeInTheDocument();

        // Click Upload Photo
        const uploadButton = screen.getByTestId("upload-pending-photo-btn");
        fireEvent.click(uploadButton);

        // Success snackbar must appear
        expect(await screen.findByText(/Profile photo uploaded and verified successfully!/i)).toBeInTheDocument();

        // Both photos must now be rendered
        expect(screen.getByLabelText(/Replace photo in slot 1/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Replace photo in slot 2/i)).toBeInTheDocument();
    });

    test("removing a photo calls deleteProfilePhoto and updates state", async () => {
        const authContext = createMockAuthContext({
            deleteProfilePhoto: jest.fn().mockResolvedValue({
                success: true,
                photos: [],
            }),
        });

        renderProfilePage(authContext);
        await screen.findByText(/Profile Photos/i);

        // Click remove photo 1
        const removeButton = screen.getByLabelText(/Remove photo 1/i);
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(authContext.deleteProfilePhoto).toHaveBeenCalledWith(0);
        });
        expect(await screen.findByText(/Profile photo removed successfully/i)).toBeInTheDocument();
    });
});
