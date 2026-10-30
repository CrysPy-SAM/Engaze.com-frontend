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

let socketListeners = {};
const mockSocket = {
    on: jest.fn((event, callback) => {
        socketListeners[event] = callback;
    }),
    off: jest.fn(),
    emit: jest.fn(),
};

jest.mock("../contexts/DirectCallContext", () => ({
    __esModule: true,
    useDirectCall: jest.fn(),
    DirectCallContext: {
        Provider: ({ children }) => children,
        Consumer: ({ children }) => children({}),
    },
}));

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useDirectCall } from "../contexts/DirectCallContext";
import MatchesPage from "../pages/matches";
import Navbar from "../components/Navbar";

describe("Matches, Likes You & Requests Synchronization Frontend Tests", () => {
    const mockUser = {
        _id: "65cf11111111111111111111",
        name: "Alice Adams",
        username: "alice_a",
        photos: ["https://example.com/alice.jpg"],
        isProfileComplete: true,
        usernameSetupCompleted: true,
    };

    const mockLikeProfile = {
        _id: "65cf22222222222222222222",
        name: "Ben Baker",
        age: 28,
        bio: "Hiker & musician",
        photos: ["https://example.com/ben.jpg"],
    };

    const mockRequest = {
        _id: "req_100",
        sender: {
            _id: "65cf33333333333333333333",
            name: "Charlie Clark",
            age: 29,
            bio: "Coffee enthusiast",
            photos: ["https://example.com/charlie.jpg"],
        },
        status: "pending",
        message: "Hi Alice, would love to connect!",
        createdAt: new Date().toISOString(),
    };

    const createMockAuthContext = (overrides = {}) => ({
        userData: mockUser,
        token: "mock_token",
        loading: false,
        isAuthenticated: true,
        unreadNotificationCount: 2,
        unreadLikesCount: 1,
        unreadRequestsCount: 1,
        likesYouCount: 1,
        incomingRequestsCount: 1,
        getMatches: jest.fn().mockResolvedValue({
            success: true,
            matches: [],
        }),
        getLikesYou: jest.fn().mockResolvedValue({
            success: true,
            profiles: [mockLikeProfile],
            pagination: { total: 1 },
        }),
        getIncomingMatchRequests: jest.fn().mockResolvedValue({
            success: true,
            count: 1,
            requests: [mockRequest],
        }),
        getConversations: jest.fn().mockResolvedValue({
            success: true,
            conversations: [],
        }),
        markNotificationsReadByType: jest.fn().mockResolvedValue({
            success: true,
            unreadCount: 0,
            unreadLikesCount: 0,
            unreadRequestsCount: 0,
        }),
        markNotificationRead: jest.fn().mockResolvedValue({ success: true }),
        markAllNotificationsRead: jest.fn().mockResolvedValue({ success: true }),
        getNotifications: jest.fn().mockResolvedValue({ notifications: [] }),
        getUnreadNotificationCount: jest.fn().mockResolvedValue(2),
        getUnreadChatCount: jest.fn().mockResolvedValue(0),
        getMissedCallCount: jest.fn().mockResolvedValue(0),
        acceptMatchRequest: jest.fn().mockResolvedValue({ success: true }),
        declineMatchRequest: jest.fn().mockResolvedValue({ success: true }),
        sendSwipe: jest.fn().mockResolvedValue({ success: true }),
        ...overrides,
    });

    beforeEach(() => {
        socketListeners = {};
        jest.clearAllMocks();
        useDirectCall.mockReturnValue({
            initiateDirectCall: jest.fn(),
            getSocket: () => mockSocket,
            callState: "idle",
        });
    });

    test("1. Navbar Bell and Matches Navigation item reflect synchronized notification counts", () => {
        const mockAuth = createMockAuthContext({
            unreadNotificationCount: 3,
            unreadLikesCount: 1,
            unreadRequestsCount: 2,
        });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={mockAuth}>
                    <Navbar />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        // Navbar notification bell displays total unread count (3)
        const bellButton = screen.getByRole("button", { name: "Notifications" });
        expect(bellButton).toBeInTheDocument();
        expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);

        // Navbar Matches tab displays combined unread indicators (1 + 2 = 3)
        const matchesNavItem = screen.getByLabelText(/Matches, 3 new notifications/i);
        expect(matchesNavItem).toBeInTheDocument();
    });

    test("2. Matches Page renders all tab counts and indicators accurately on initial mount", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/matches"]}>
                <AuthContext.Provider value={mockAuth}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        // Authoritative calls were made for all feeds
        await waitFor(() => {
            expect(mockAuth.getMatches).toHaveBeenCalledTimes(1);
            expect(mockAuth.getIncomingMatchRequests).toHaveBeenCalledTimes(1);
            expect(mockAuth.getLikesYou).toHaveBeenCalledTimes(1);
        });

        // Tab buttons display accurate counts
        expect(await screen.findByRole("button", { name: /^Matches \(0\)$/i })).toBeInTheDocument();
        expect(await screen.findByRole("button", { name: /^Requests \(1\)$/i })).toBeInTheDocument();
        expect(await screen.findByRole("button", { name: /^Likes You \(1\)$/i })).toBeInTheDocument();
    });

    test("3. Switching to Requests tab marks request notifications read without deleting pending requests", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/matches?tab=requests"]}>
                <AuthContext.Provider value={mockAuth}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockAuth.markNotificationsReadByType).toHaveBeenCalledWith("match_request");
        });

        // Pending request remains actionable
        expect(await screen.findByText(/Charlie Clark/i)).toBeInTheDocument();
        expect(screen.getByText(/Hi Alice, would love to connect!/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^accept$/i })).toBeInTheDocument();
    });

    test("4. Switching to Likes You tab marks like notifications read without deleting pending likes", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/matches?tab=likes"]}>
                <AuthContext.Provider value={mockAuth}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockAuth.markNotificationsReadByType).toHaveBeenCalledWith("like");
        });

        // Pending like remains visible in Likes You
        expect(await screen.findByText(/Ben Baker/i)).toBeInTheDocument();
    });

    test("5. Real-time socket events dynamically update Likes You and Requests without page refresh", async () => {
        const mockAuth = createMockAuthContext({
            getLikesYou: jest.fn().mockResolvedValue({
                success: true,
                profiles: [],
                pagination: { total: 0 },
            }),
            getIncomingMatchRequests: jest.fn().mockResolvedValue({
                success: true,
                count: 0,
                requests: [],
            }),
        });

        render(
            <MemoryRouter initialEntries={["/matches"]}>
                <AuthContext.Provider value={mockAuth}>
                    <MatchesPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            const likeListener = [...mockSocket.on.mock.calls].reverse().find(c => c[0] === "like:new")?.[1];
            const reqListener = [...mockSocket.on.mock.calls].reverse().find(c => c[0] === "match_request:new")?.[1];
            expect(likeListener).toBeDefined();
            expect(reqListener).toBeDefined();
        });

        const getListener = (event) => [...mockSocket.on.mock.calls].reverse().find(c => c[0] === event)?.[1];

        // Simulate incoming real-time like
        act(() => {
            getListener("like:new")({
                profile: {
                    _id: "65cf44444444444444444444",
                    name: "Diana Prince",
                    age: 27,
                    photos: ["https://example.com/diana.jpg"],
                },
            });
        });

        // Verify Likes You count updated to 1
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /^Likes You \(1\)$/i })).toBeInTheDocument();
        });

        // Simulate incoming real-time match request
        act(() => {
            getListener("match_request:new")({
                request: {
                    _id: "req_200",
                    sender: {
                        _id: "65cf55555555555555555555",
                        name: "Ethan Hunt",
                        age: 32,
                        photos: ["https://example.com/ethan.jpg"],
                    },
                    status: "pending",
                    message: "Mission possible!",
                },
            });
        });

        // Verify Requests count updated to 1
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /^Requests \(1\)$/i })).toBeInTheDocument();
        });

        // Simulate request accepted
        act(() => {
            getListener("match_request:accepted")({ requestId: "req_200" });
        });

        // Verify Requests count returned to 0
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /^Requests \(0\)$/i })).toBeInTheDocument();
        });
    });
});
