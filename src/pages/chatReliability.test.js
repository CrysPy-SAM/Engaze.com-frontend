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
        connected: false,
        on: jest.fn((event, cb) => {
            mockSocketEvents[event] = cb;
        }),
        off: jest.fn((event) => {
            delete mockSocketEvents[event];
        }),
        emit: jest.fn(),
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
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import io from "socket.io-client";
import { AuthContext } from "../contexts/AuthContext";
import ChatPage from "./chat";

describe("Prompt 22: Chat Reliability, Connection Recovery & State Lifecycle", () => {
    const mockUser = {
        _id: "65cf11111111111111111111",
        name: "Test User",
        username: "testuser",
        photos: ["https://example.com/me.jpg"],
        isProfileComplete: true,
    };

    const mockPartner = {
        _id: "65cf22222222222222222222",
        name: "Sarah Parker",
        photos: ["https://example.com/sarah.jpg"],
    };

    const mockConversation = {
        _id: "conv_12345",
        match: "match_999",
        otherParticipant: mockPartner,
        lastMessage: {
            _id: "msg_1",
            content: "Hey, how are you doing?",
            sender: mockPartner,
            createdAt: new Date().toISOString(),
        },
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1,
    };

    const createMockAuthContext = (overrides = {}) => ({
        userData: mockUser,
        token: "mock_jwt_token",
        loading: false,
        isAuthenticated: true,
        getConversations: jest.fn().mockResolvedValue({ conversations: [mockConversation] }),
        getOrCreateConversationByMatch: jest.fn(),
        getConversationMessages: jest.fn().mockResolvedValue({ messages: [] }),
        markConversationRead: jest.fn().mockResolvedValue({ success: true }),
        sendMessageRest: jest.fn().mockResolvedValue({ success: true, message: { _id: "persisted_1", content: "Hi Sarah" } }),
        blockUser: jest.fn(),
        reportUser: jest.fn(),
        unmatchUser: jest.fn(),
        ...overrides,
    });

    beforeEach(() => {
        io.mockImplementation(() => mockCreateSocket());
        Object.keys(mockSocketEvents).forEach((k) => delete mockSocketEvents[k]);
        Object.keys(mockIoEvents).forEach((k) => delete mockIoEvents[k]);
        if (mockSocketInstance) {
            mockSocketInstance.connected = false;
        }
    });

    test("1. Initial render does NOT eagerly display the reconnecting banner during normal connection", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        // The reconnecting banner should NOT be visible when the socket is in initial connecting state
        expect(
            screen.queryByText(/Reconnecting to live chat server/i)
        ).toBeNull();

        await waitFor(() => {
            expect(mockAuth.getConversations).toHaveBeenCalled();
        });
    });

    test("2. Successfully loaded inbox displays conversation items and active count", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Sarah Parker").length).toBeGreaterThan(0);
            expect(screen.getByText("1 Active")).toBeInTheDocument();
        });
    });

    test("3. Failed conversation load displays error box with retry, without displaying misleading 'No conversations yet'", async () => {
        const mockAuth = createMockAuthContext({
            getConversations: jest.fn().mockRejectedValue(new Error("Network connection dropped")),
        });

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Network connection dropped/i)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /Retry Connection/i })).toBeInTheDocument();
            // Must NOT tell the user their inbox is empty when the network failed
            expect(screen.queryByText(/No conversations yet/i)).toBeNull();
        });
    });

    test("4. Empty inbox displays genuine empty state when request succeeds with 0 conversations", async () => {
        const mockAuth = createMockAuthContext({
            getConversations: jest.fn().mockResolvedValue({ conversations: [] }),
        });

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /Explore Discovery/i })).toBeInTheDocument();
            expect(screen.getByText("0 Active")).toBeInTheDocument();
        });
    });

    test("5. Displays reconnecting banner when socket encounters connect_error or disconnects", async () => {
        const mockAuth = createMockAuthContext();

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Sarah Parker").length).toBeGreaterThan(0);
        });

        // Initially no reconnect banner
        expect(screen.queryByText(/Reconnecting to live chat server/i)).toBeNull();

        // Simulate socket connection failure
        act(() => {
            if (mockSocketEvents["connect_error"]) {
                mockSocketEvents["connect_error"](new Error("CORS policy rejection"));
            }
        });

        // Banner should now appear
        expect(screen.getByText(/Reconnecting to live chat server/i)).toBeInTheDocument();

        // Simulate successful socket reconnection
        act(() => {
            if (mockSocketInstance) mockSocketInstance.connected = true;
            if (mockSocketEvents["connect"]) {
                mockSocketEvents["connect"]();
            }
        });

        // Banner should disappear once genuinely connected
        expect(screen.queryByText(/Reconnecting to live chat server/i)).toBeNull();
    });

    test("6. HTTP fallback works independently when Socket.IO is disconnected", async () => {
        const mockAuth = createMockAuthContext();
        if (mockSocketInstance) mockSocketInstance.connected = false;

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Sarah Parker").length).toBeGreaterThan(0);
        });

        // Conversation list loaded via HTTP even with socket offline
        expect(mockAuth.getConversations).toHaveBeenCalled();
    });
});
