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

const mockSocketEvents = {};
const mockIoEvents = {};
let mockSocketInstance = null;

const mockCreateSocket = () => {
    mockSocketInstance = {
        connected: true,
        on: jest.fn((event, cb) => {
            mockSocketEvents[event] = cb;
        }),
        off: jest.fn((event) => {
            delete mockSocketEvents[event];
        }),
        emit: jest.fn((event, data, cb) => {
            if (event === "presence:get" && typeof cb === "function") {
                cb({ success: true, userId: data?.targetUserId, isOnline: false, lastSeenAt: null });
            }
        }),
        removeAllListeners: jest.fn(() => {
            Object.keys(mockSocketEvents).forEach((k) => delete mockSocketEvents[k]);
        }),
        disconnect: jest.fn(),
        io: {
            on: jest.fn((event, cb) => {
                mockIoEvents[event] = cb;
            }),
            off: jest.fn((event) => {
                delete mockIoEvents[event];
            }),
        },
    };
    return mockSocketInstance;
};

jest.mock("socket.io-client", () => {
    const fn = jest.fn(() => mockCreateSocket());
    fn.default = fn;
    fn.io = fn;
    fn.connect = fn;
    return fn;
});

jest.mock("../contexts/DirectCallContext", () => ({
    useDirectCall: () => ({
        initiateDirectCall: jest.fn(),
    }),
}));

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import io from "socket.io-client";
import { AuthContext } from "../contexts/AuthContext";
import ChatPage from "./chat";

const mockUser = {
    _id: "user_me_123",
    name: "Aryan Dev",
    username: "aryandev",
};

const mockPartnerOnline = {
    _id: "partner_456",
    name: "Riya Sharma",
    photos: ["https://example.com/riya.jpg"],
    isOnline: true,
    lastSeenAt: null,
};

const mockPartnerOffline = {
    _id: "partner_789",
    name: "Ananya Sen",
    photos: ["https://example.com/ananya.jpg"],
    isOnline: false,
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
};

const mockPartnerHidden = {
    _id: "partner_999",
    name: "Sneha Roy",
    photos: ["https://example.com/sneha.jpg"],
    isOnline: false,
    lastSeenAt: null,
};

const createMockAuthContext = (overrides = {}) => ({
    userData: mockUser,
    token: "mock-valid-jwt",
    loading: false,
    isAuthenticated: true,
    getConversations: jest.fn().mockResolvedValue({
        conversations: [
            {
                _id: "conv_1",
                match: "match_1",
                otherParticipant: mockPartnerOnline,
                lastMessage: { content: "Hey there!", sender: mockPartnerOnline, createdAt: new Date().toISOString() },
                unreadCount: 0,
            },
        ],
    }),
    getConversationMessages: jest.fn().mockResolvedValue({ messages: [] }),
    markConversationRead: jest.fn().mockResolvedValue({ success: true }),
    getProfile: jest.fn().mockResolvedValue({ profile: mockUser }),
    ...overrides,
});

describe("Engaze Chat WhatsApp-Style Presence & Last Seen UI Tests", () => {
    beforeEach(() => {
        window.HTMLElement.prototype.scrollIntoView = jest.fn();
        window.Element.prototype.scrollIntoView = jest.fn();
        io.mockImplementation(() => mockCreateSocket());
        Object.keys(mockSocketEvents).forEach((k) => delete mockSocketEvents[k]);
        Object.keys(mockIoEvents).forEach((k) => delete mockIoEvents[k]);
        jest.clearAllMocks();
    });

    test("1. Renders 'Online' and green status indicator when partner is genuinely online", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Riya Sharma").length).toBeGreaterThan(0);
        });

        // Header shows "Online"
        await waitFor(() => {
            expect(screen.getByText("Online")).toBeInTheDocument();
        });

        // Avatar has online-indicator-dot class
        const onlineDots = document.querySelectorAll(".online-indicator-dot");
        expect(onlineDots.length).toBeGreaterThan(0);
    });

    test("2. Renders 'last seen today at ...' and NO online dot when partner is offline with visible lastSeenAt", async () => {
        const mockAuth = createMockAuthContext({
            getConversations: jest.fn().mockResolvedValue({
                conversations: [
                    {
                        _id: "conv_2",
                        match: "match_2",
                        otherParticipant: mockPartnerOffline,
                        lastMessage: null,
                        unreadCount: 0,
                    },
                ],
            }),
        });

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Ananya Sen").length).toBeGreaterThan(0);
        });

        // Must NOT render "Online"
        expect(screen.queryByText("Online")).not.toBeInTheDocument();

        // Must render relative last seen text
        await waitFor(() => {
            expect(screen.getByText(/last seen today at/i)).toBeInTheDocument();
        });

        // Avatar must NOT have online dot
        const onlineDots = document.querySelectorAll(".online-indicator-dot");
        expect(onlineDots.length).toBe(0);
    });

    test("3. Hides both Online and last seen when lastSeenAt is null due to privacy setting", async () => {
        const mockAuth = createMockAuthContext({
            getConversations: jest.fn().mockResolvedValue({
                conversations: [
                    {
                        _id: "conv_3",
                        match: "match_3",
                        otherParticipant: mockPartnerHidden,
                        lastMessage: null,
                        unreadCount: 0,
                    },
                ],
            }),
        });

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Sneha Roy").length).toBeGreaterThan(0);
        });

        // Neither "Online" nor "last seen" is displayed
        expect(screen.queryByText("Online")).not.toBeInTheDocument();
        expect(screen.queryByText(/last seen/i)).not.toBeInTheDocument();

        // No online dot
        const onlineDots = document.querySelectorAll(".online-indicator-dot");
        expect(onlineDots.length).toBe(0);
    });

    test("4. Dynamically updates from Online to last seen when receiving socket 'presence:update'", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Online")).toBeInTheDocument();
        });

        // Partner disconnects and goes offline with lastSeen timestamp
        const disconnectedTime = new Date().toISOString();
        act(() => {
            if (mockSocketEvents["presence:update"]) {
                mockSocketEvents["presence:update"]({
                    userId: mockPartnerOnline._id,
                    isOnline: false,
                    lastSeenAt: disconnectedTime,
                });
            }
        });

        // Header transitions from "Online" to "last seen today at ..."
        await waitFor(() => {
            expect(screen.queryByText("Online")).not.toBeInTheDocument();
            expect(screen.getByText(/last seen today at/i)).toBeInTheDocument();
        });
    });
});
