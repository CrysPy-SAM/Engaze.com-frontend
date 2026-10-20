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
import SearchPage from "./search";

describe("Instagram-Inspired Search and People Discovery Frontend Tests", () => {
    const mockCurrentUser = {
        _id: "user_alice_id",
        name: "Alice Adams",
        username: "alice_a",
        photos: ["https://example.com/alice.jpg"],
        isProfileComplete: true,
    };

    const mockSearchResults = [
        {
            _id: "user_ben_id",
            name: "Ben Baker",
            username: "ben_baker",
            age: 28,
            bio: "Rock climber & musician",
            photos: ["https://example.com/ben.jpg"],
            interests: ["climbing", "music"],
            isProfileComplete: true,
            relationship: "none",
            requestId: null,
            conversationId: null,
        },
        {
            _id: "user_charlie_id",
            name: "Charlie Cox",
            username: "charlie_c",
            age: 26,
            bio: "Traveler & foodie",
            photos: ["https://example.com/charlie.jpg"],
            interests: ["travel"],
            isProfileComplete: true,
            relationship: "incoming_request",
            requestId: "req_charlie_123",
            conversationId: null,
        },
        {
            _id: "user_diana_id",
            name: "Diana Prince",
            username: "diana_p",
            age: 29,
            bio: "Curator",
            photos: ["https://example.com/diana.jpg"],
            interests: ["art"],
            isProfileComplete: true,
            relationship: "connected",
            requestId: null,
            conversationId: "conv_diana_123",
        },
    ];

    const createMockContext = (overrides = {}) => ({
        userData: mockCurrentUser,
        token: "mock_token",
        loading: false,
        isAuthenticated: true,
        unreadNotificationCount: 0,
        likesYouCount: 0,
        searchUsers: jest.fn().mockResolvedValue({
            success: true,
            users: mockSearchResults,
            pagination: { page: 1, limit: 20, total: 3, hasMore: false },
        }),
        sendMatchRequest: jest.fn().mockResolvedValue({
            success: true,
            message: "Match request sent successfully",
        }),
        acceptMatchRequest: jest.fn().mockResolvedValue({
            success: true,
            conversationId: "conv_new_123",
        }),
        declineMatchRequest: jest.fn().mockResolvedValue({
            success: true,
            message: "Match request declined",
        }),
        ...overrides,
    });

    beforeEach(() => {
        localStorage.clear();
    });

    test("1. Renders search input and empty initial prompt when no query is typed", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/search"]}>
                <AuthContext.Provider value={mockCtx}>
                    <SearchPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(screen.getByPlaceholderText(/Search by name, @username, or interests.../i)).toBeInTheDocument();
        expect(screen.getByText(/Search People & Connect/i)).toBeInTheDocument();
    });

    test("2. Typing a search query triggers debounced searchUsers and renders matching user cards", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/search"]}>
                <AuthContext.Provider value={mockCtx}>
                    <SearchPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search by name, @username, or interests.../i);
        fireEvent.change(input, { target: { value: "ben" } });

        await waitFor(() => {
            expect(mockCtx.searchUsers).toHaveBeenCalledWith("ben", 1, 20);
        });

        expect(await screen.findByText(/Ben Baker/i)).toBeInTheDocument();
        expect(screen.getByText(/@ben_baker/i)).toBeInTheDocument();
        expect(screen.getByText(/Rock climber & musician/i)).toBeInTheDocument();
        expect(screen.getByText(/#climbing/i)).toBeInTheDocument();
    });

    test("3. Displays 'Connect' button for relationship 'none', and clicking it calls sendMatchRequest", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/search"]}>
                <AuthContext.Provider value={mockCtx}>
                    <SearchPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search by name, @username, or interests.../i);
        fireEvent.change(input, { target: { value: "ben" } });

        const connectBtn = await screen.findByRole("button", { name: /^connect$/i }, { timeout: 4000 });
        fireEvent.click(connectBtn);

        await waitFor(() => {
            expect(mockCtx.sendMatchRequest).toHaveBeenCalledWith(
                "user_ben_id",
                expect.stringContaining("Ben")
            );
        });

        // Transitions to "Requested"
        expect(await screen.findByRole("button", { name: /^requested$/i }, { timeout: 4000 })).toBeInTheDocument();
    });

    test("4. Displays 'Accept' and 'Decline' buttons for incoming requests and shows celebration dialog on accept", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/search"]}>
                <AuthContext.Provider value={mockCtx}>
                    <SearchPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search by name, @username, or interests.../i);
        fireEvent.change(input, { target: { value: "charlie" } });

        const acceptBtn = await screen.findByRole("button", { name: /^accept$/i }, { timeout: 4000 });
        const declineBtn = screen.getByRole("button", { name: /^decline$/i });
        expect(acceptBtn).toBeInTheDocument();
        expect(declineBtn).toBeInTheDocument();

        fireEvent.click(acceptBtn);

        await waitFor(() => {
            expect(mockCtx.acceptMatchRequest).toHaveBeenCalledWith("req_charlie_123");
        });

        // Match celebration modal appears
        expect(await screen.findByText(/It's a Connection!/i)).toBeInTheDocument();
        expect(screen.getByText(/Send a Message/i)).toBeInTheDocument();
        expect(screen.getByText(/Start Video Call/i)).toBeInTheDocument();
    });

    test("5. Displays 'Message' button for connected users", async () => {
        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/search"]}>
                <AuthContext.Provider value={mockCtx}>
                    <SearchPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search by name, @username, or interests.../i);
        fireEvent.change(input, { target: { value: "diana" } });

        const messageBtn = await screen.findByRole("button", { name: /^message$/i }, { timeout: 4000 });
        expect(messageBtn).toBeInTheDocument();
    });

    test("6. Loads and displays recent searches from localStorage and allows clearing all", async () => {
        localStorage.setItem("engaze_recent_searches", JSON.stringify(["hiking", "photography"]));

        const mockCtx = createMockContext();
        render(
            <MemoryRouter initialEntries={["/search"]}>
                <AuthContext.Provider value={mockCtx}>
                    <SearchPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(screen.getByText(/Recent Searches/i)).toBeInTheDocument();
        expect(screen.getByText("hiking")).toBeInTheDocument();
        expect(screen.getByText("photography")).toBeInTheDocument();

        const clearAllBtn = screen.getByRole("button", { name: /clear all/i });
        fireEvent.click(clearAllBtn);

        expect(screen.queryByText("hiking")).not.toBeInTheDocument();
        expect(screen.queryByText("photography")).not.toBeInTheDocument();
    });

    test("7. Displays friendly empty state when no users are found", async () => {
        const mockCtx = createMockContext({
            searchUsers: jest.fn().mockResolvedValue({
                success: true,
                users: [],
                pagination: { page: 1, limit: 20, total: 0, hasMore: false },
            }),
        });

        render(
            <MemoryRouter initialEntries={["/search"]}>
                <AuthContext.Provider value={mockCtx}>
                    <SearchPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search by name, @username, or interests.../i);
        fireEvent.change(input, { target: { value: "nonexistent_person" } });

        await waitFor(() => {
            expect(mockCtx.searchUsers).toHaveBeenCalledWith("nonexistent_person", 1, 20);
        });

        expect(await screen.findByText(/No results found/i)).toBeInTheDocument();
    });
});

