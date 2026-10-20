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
import MatchesPage from "./matches";

describe("Consent-Based Match Requests & Connections Frontend Tests", () => {
    const mockUser = {
        _id: "65cf11111111111111111111",
        name: "Alice Adams",
        username: "alice_a",
        photos: ["https://example.com/alice.jpg"],
        isProfileComplete: true,
    };

    const mockRequest1 = {
        _id: "req_12345",
        sender: {
            _id: "65cf22222222222222222222",
            name: "Ben Baker",
            age: 28,
            bio: "Hiker & musician",
            photos: ["https://example.com/ben.jpg"],
        },
        status: "pending",
        message: "Hey Alice, loved your travel photos!",
        createdAt: new Date().toISOString(),
    };

    const createMockContext = (overrides = {}) => ({
        userData: mockUser,
        token: "mock_token",
        loading: false,
        isAuthenticated: true,
        getMatches: jest.fn().mockResolvedValue({
            success: true,
            matches: [],
        }),
        getLikesYou: jest.fn().mockResolvedValue({
            success: true,
            profiles: [],
        }),
        getIncomingMatchRequests: jest.fn().mockResolvedValue({
            success: true,
            requests: [mockRequest1],
        }),
        acceptMatchRequest: jest.fn().mockResolvedValue({
            success: true,
            match: {
                _id: "match_999",
                matchedUser: mockRequest1.sender,
                conversationId: "conv_888",
                createdAt: new Date().toISOString(),
            },
        }),
        declineMatchRequest: jest.fn().mockResolvedValue({
            success: true,
            message: "Match request declined",
        }),
        getConversations: jest.fn().mockResolvedValue({
            success: true,
            conversations: [],
        }),
        blockUser: jest.fn(),
        reportUser: jest.fn(),
        unmatchUser: jest.fn(),
        ...overrides,
    });

    test("1. Renders 3 segmented tabs: Matches, Requests, and Likes You", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/matches"]}>
                <AuthContext.Provider value={mockCtx}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(await screen.findByRole("button", { name: /^Matches \(\d+\)$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Requests \(\d+\)$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Likes You \(\d+\)$/i })).toBeInTheDocument();
    });

    test("2. Navigating to Requests tab loads incoming requests and displays sender details", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/matches?tab=requests"]}>
                <AuthContext.Provider value={mockCtx}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockCtx.getIncomingMatchRequests).toHaveBeenCalledTimes(1);
        });

        expect(await screen.findByText(/Ben Baker/i)).toBeInTheDocument();
        expect(screen.getByText(/Hey Alice, loved your travel photos!/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^accept$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^decline$/i })).toBeInTheDocument();
    });

    test("3. Clicking Accept sends accept request and displays match celebration with Chat and Video Call actions", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/matches?tab=requests"]}>
                <AuthContext.Provider value={mockCtx}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const acceptBtn = await screen.findByRole("button", { name: /^accept$/i });
        fireEvent.click(acceptBtn);

        await waitFor(() => {
            expect(mockCtx.acceptMatchRequest).toHaveBeenCalledWith(mockRequest1._id);
        });

        // Verify match celebration dialog opens with Chat and Video Call options
        expect(await screen.findByText(/Send a Message/i)).toBeInTheDocument();
        expect(screen.getByText(/Start Video Call/i)).toBeInTheDocument();
    });

    test("4. Clicking Decline sends decline request and removes card from actionable list", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/matches?tab=requests"]}>
                <AuthContext.Provider value={mockCtx}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const declineBtn = await screen.findByRole("button", { name: /^decline$/i });
        fireEvent.click(declineBtn);

        await waitFor(() => {
            expect(mockCtx.declineMatchRequest).toHaveBeenCalledWith(mockRequest1._id);
        });

        // Request card is removed
        await waitFor(() => {
            expect(screen.queryByText(/Hey Alice, loved your travel photos!/i)).not.toBeInTheDocument();
        });
    });
});
