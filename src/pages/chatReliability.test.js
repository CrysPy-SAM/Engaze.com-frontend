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
        window.HTMLElement.prototype.scrollIntoView = jest.fn();
        window.Element.prototype.scrollIntoView = jest.fn();
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

    test("7. Prompt 23: Outgoing message is right-aligned (flex-end) optimistically and remains right-aligned upon server ack", async () => {
        const mockAuth = createMockAuthContext({
            getConversationMessages: jest.fn().mockResolvedValue({
                messages: [
                    {
                        _id: "msg_partner_init",
                        content: "Hello from partner",
                        sender: mockPartner,
                        createdAt: new Date(Date.now() - 60000).toISOString(),
                        readBy: [mockPartner._id],
                    },
                ],
            }),
            sendMessageRest: jest.fn().mockImplementation((convId, payload) => {
                return Promise.resolve({
                    success: true,
                    message: {
                        _id: "persisted_server_msg_id",
                        clientTempId: payload.clientTempId,
                        content: payload.content,
                        sender: {
                            _id: mockUser._id,
                            name: mockUser.name,
                            photos: mockUser.photos,
                        },
                        createdAt: new Date().toISOString(),
                        readBy: [mockUser._id],
                    },
                });
            }),
        });

        render(
            <MemoryRouter initialEntries={["/chat"]}>
                <AuthContext.Provider value={mockAuth}>
                    <ChatPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        // 1. Initial partner message loads and is left-aligned
        await waitFor(() => {
            expect(screen.getByText("Hello from partner")).toBeInTheDocument();
        });
        const partnerText = screen.getByText("Hello from partner");
        const partnerContainer = partnerText.closest(".MuiPaper-root").parentElement.parentElement;
        expect(partnerContainer).toHaveStyle({ alignItems: "flex-start" });

        // 2. Type and send outgoing message
        const input = screen.getByPlaceholderText(/Type a message/i);
        fireEvent.change(input, { target: { value: "My outgoing message" } });
        fireEvent.submit(input.closest("form"));

        // 3. Outgoing message renders immediately and is right-aligned (flex-end)
        await waitFor(() => {
            expect(screen.getByText("My outgoing message")).toBeInTheDocument();
        });
        const outgoingText = screen.getByText("My outgoing message");
        const outgoingContainer = outgoingText.closest(".MuiPaper-root").parentElement.parentElement;
        expect(outgoingContainer).toHaveStyle({ alignItems: "flex-end" });

        // 4. Message remains strictly right-aligned (flex-end) after server reconciliation
        await waitFor(() => {
            const confirmedContainer = screen.getByText("My outgoing message").closest(".MuiPaper-root").parentElement.parentElement;
            expect(confirmedContainer).toHaveStyle({ alignItems: "flex-end" });
        });
    });

    test("8. Prompt 23: Incoming partner message via real-time socket is left-aligned (flex-start) and does not corrupt outgoing alignment", async () => {
        const mockAuth = createMockAuthContext({
            getConversationMessages: jest.fn().mockResolvedValue({
                messages: [
                    {
                        _id: "msg_outgoing_1",
                        content: "My initial outgoing text",
                        sender: mockUser,
                        createdAt: new Date(Date.now() - 30000).toISOString(),
                        readBy: [mockUser._id],
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

        // Click to ensure active conversation is explicitly open
        await waitFor(() => {
            expect(screen.getAllByText("Sarah Parker").length).toBeGreaterThan(0);
        });
        fireEvent.click(screen.getAllByText("Sarah Parker")[0]);

        await waitFor(() => {
            expect(screen.getByText("My initial outgoing text")).toBeInTheDocument();
        });
        const outgoingEl = screen.getByText("My initial outgoing text").closest(".MuiPaper-root").parentElement.parentElement;
        expect(outgoingEl).toHaveStyle({ alignItems: "flex-end" });

        // Verify socket listener is registered and simulate incoming partner message broadcast
        await waitFor(() => {
            expect(typeof mockSocketEvents["chat:new-message"]).toBe("function");
        });

        act(() => {
            mockSocketEvents["chat:new-message"]({
                _id: "msg_incoming_live",
                conversation: mockConversation._id,
                content: "Live partner response",
                sender: {
                    _id: mockPartner._id,
                    name: mockPartner.name,
                    photos: mockPartner.photos,
                },
                createdAt: new Date().toISOString(),
                readBy: [mockPartner._id],
            });
        });

        await waitFor(() => {
            const matches = screen.getAllByText("Live partner response");
            expect(matches.length).toBeGreaterThan(0);
        });

        const bubbleText = screen.getAllByText("Live partner response").find((el) => el.closest(".MuiPaper-root"));
        expect(bubbleText).toBeDefined();
        const incomingEl = bubbleText.closest(".MuiPaper-root").parentElement.parentElement;
        expect(incomingEl).toHaveStyle({ alignItems: "flex-start" });

        // Verify outgoing message did not flip
        const outgoingElAfter = screen.getByText("My initial outgoing text").closest(".MuiPaper-root").parentElement.parentElement;
        expect(outgoingElAfter).toHaveStyle({ alignItems: "flex-end" });
    });
});
