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
import SetupUsernamePage from "../pages/setupUsername";
import { AuthContext } from "../contexts/AuthContext";

describe("Frontend Username Management Flow", () => {
    const mockUserDataNew = {
        _id: "user_test_123",
        name: "Satyam Mishra",
        email: "satyam@gmail.com",
        username: "temp_handle_123",
        usernameSetupCompleted: false,
        photos: ["https://example.com/avatar.jpg"],
    };

    const mockAuthContext = (overrides = {}) => ({
        userData: mockUserDataNew,
        isAuthenticated: true,
        loading: false,
        checkUsernameAvailability: jest.fn().mockResolvedValue({
            success: true,
            available: true,
            message: "Username is available!",
        }),
        setupUsername: jest.fn().mockResolvedValue({
            success: true,
            user: { ...mockUserDataNew, username: "satyam_dev", usernameSetupCompleted: true },
        }),
        getUsernameEligibility: jest.fn().mockResolvedValue({
            success: true,
            canChange: true,
            usernameLastChangedAt: null,
            nextEligibleAt: null,
            cooldownDaysRemaining: 0,
        }),
        updateUsername: jest.fn().mockResolvedValue({
            success: true,
            username: "satyam_new",
        }),
        ...overrides,
    });

    test("renders initial greeting and username input with candidate", async () => {
        const ctx = mockAuthContext();
        render(
            <MemoryRouter>
                <AuthContext.Provider value={ctx}>
                    <SetupUsernamePage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(screen.getByText(/Hi, Satyam Mishra/i)).toBeInTheDocument();
        expect(screen.getByText(/Choose your @username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText("username")).toBeInTheDocument();
    });

    test("performs real-time debounced availability check and shows available feedback", async () => {
        const checkMock = jest.fn().mockResolvedValue({
            success: true,
            available: true,
            message: "Username is available!",
        });
        const ctx = mockAuthContext({ checkUsernameAvailability: checkMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={ctx}>
                    <SetupUsernamePage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText("username");
        fireEvent.change(input, { target: { value: "satyam_vibe" } });

        await waitFor(() => {
            expect(checkMock).toHaveBeenCalledWith("satyam_vibe");
        });

        await waitFor(() => {
            expect(screen.getByText(/Username is available!/i)).toBeInTheDocument();
        });
    });

    test("displays taken error and suggestions when username is unavailable", async () => {
        const checkMock = jest.fn().mockResolvedValue({
            success: true,
            available: false,
            message: "Username is already taken.",
            suggestions: ["satyam_1", "satyam_official"],
        });
        const ctx = mockAuthContext({ checkUsernameAvailability: checkMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={ctx}>
                    <SetupUsernamePage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText("username");
        fireEvent.change(input, { target: { value: "satyam_taken" } });

        await waitFor(() => {
            expect(checkMock).toHaveBeenCalledWith("satyam_taken");
        }, { timeout: 2000 });

        await waitFor(() => {
            expect(screen.getByText(/Username is already taken./i)).toBeInTheDocument();
            expect(screen.getByText(/@satyam_1/i)).toBeInTheDocument();
            expect(screen.getByText(/@satyam_official/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    test("clicking an alternative suggestion chip fills the input and re-checks", async () => {
        const checkMock = jest.fn()
            .mockResolvedValueOnce({
                success: true,
                available: false,
                message: "Username is already taken.",
                suggestions: ["satyam_1"],
            })
            .mockResolvedValueOnce({
                success: true,
                available: true,
                message: "Username is available!",
            });

        const ctx = mockAuthContext({ checkUsernameAvailability: checkMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={ctx}>
                    <SetupUsernamePage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText("username");
        fireEvent.change(input, { target: { value: "satyam_taken" } });

        await waitFor(() => {
            expect(screen.getByText(/@satyam_1/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        // Click suggestion chip
        fireEvent.click(screen.getByText(/@satyam_1/i));

        expect(input.value).toBe("satyam_1");
    });

    test("submits setup-username when CTA button is clicked", async () => {
        const setupMock = jest.fn().mockResolvedValue({ success: true });
        const ctx = mockAuthContext({
            checkUsernameAvailability: jest.fn().mockResolvedValue({ success: true, available: true }),
            setupUsername: setupMock,
        });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={ctx}>
                    <SetupUsernamePage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText("username");
        fireEvent.change(input, { target: { value: "satyam_unique" } });

        await waitFor(() => {
            const submitBtn = screen.getByRole("button", { name: /Claim Username/i });
            expect(submitBtn).not.toBeDisabled();
            fireEvent.click(submitBtn);
        });

        expect(setupMock).toHaveBeenCalledWith("satyam_unique");
    });
});
