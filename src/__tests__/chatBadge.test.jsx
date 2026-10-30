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
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../contexts/AuthContext";

// Mock matchMedia for responsive tests
beforeAll(() => {
    window.matchMedia = window.matchMedia || function () {
        return {
            matches: false,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        };
    };
});

describe("Chat Unread Badge UI & Accessibility", () => {
    const defaultAuthContext = {
        isAuthenticated: true,
        loading: false,
        userData: {
            _id: "user_123",
            name: "Satyam Mishra",
            username: "satyam",
            photos: ["https://example.com/avatar.jpg"],
        },
        unreadNotificationCount: 0,
        unreadChatCount: 0,
        notifications: [],
        logout: jest.fn(),
    };

    const renderNavbar = (authOverrides = {}) => {
        const contextValue = { ...defaultAuthContext, ...authOverrides };
        return render(
            <AuthContext.Provider value={contextValue}>
                <MemoryRouter>
                    <Navbar />
                </MemoryRouter>
            </AuthContext.Provider>
        );
    };

    test("hides chat badge when unreadChatCount is 0", () => {
        renderNavbar({ unreadChatCount: 0 });
        const badge = screen.queryByLabelText(/unread message/i);
        expect(badge).toBeNull();
    });

    test("displays chat badge with exact count when unreadChatCount is between 1 and 99", () => {
        renderNavbar({ unreadChatCount: 5 });
        const badges = screen.getAllByText("5");
        expect(badges.length).toBeGreaterThan(0);

        const statusBadges = screen.getAllByRole("status");
        const chatStatusBadge = statusBadges.find((el) =>
            el.getAttribute("aria-label")?.includes("5 unread")
        );
        expect(chatStatusBadge).toBeTruthy();
    });

    test("formats chat badge as '99+' when unreadChatCount exceeds 99", () => {
        renderNavbar({ unreadChatCount: 142 });
        const badges = screen.getAllByText("99+");
        expect(badges.length).toBeGreaterThan(0);

        const statusBadges = screen.getAllByRole("status");
        const chatStatusBadge = statusBadges.find((el) =>
            el.getAttribute("aria-label")?.includes("99+ unread")
        );
        expect(chatStatusBadge).toBeTruthy();
    });

    test("displays badge with proper accessibility labels", () => {
        renderNavbar({ unreadChatCount: 1 });
        const statusBadges = screen.getAllByRole("status");
        const singleBadge = statusBadges.find((el) =>
            el.getAttribute("aria-label")?.includes("1 unread")
        );
        expect(singleBadge).toBeTruthy();
    });
});
