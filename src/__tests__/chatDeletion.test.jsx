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

jest.mock("socket.io-client", () => {
    const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
        io: { on: jest.fn() },
    };
    const fn = jest.fn(() => mockSocket);
    fn.default = fn;
    fn.connect = fn;
    fn.io = fn;
    return fn;
});

jest.mock("../environment", () => "http://localhost:5000");

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Chat from "../pages/chat";
import { AuthContext } from "../contexts/AuthContext";
import { DirectCallContext } from "../contexts/DirectCallContext";

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
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe("WhatsApp-Inspired Chat & Message Deletion UI Suite", () => {
    const mockUser = {
        _id: "user_alice",
        name: "Alice Active",
        username: "alice_active",
        photos: ["https://example.com/alice.jpg"],
        usernameSetupCompleted: true,
    };

    const mockPartner = {
        _id: "user_bob",
        name: "Bob Partner",
        username: "bob_partner",
        photos: ["https://example.com/bob.jpg"],
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
    };

    const mockConversation = {
        _id: "conv_123",
        match: "match_123",
        otherParticipant: mockPartner,
        lastMessage: {
            _id: "msg_1",
            content: "Hello there!",
            createdAt: new Date().toISOString(),
            sender: { _id: "user_bob", name: "Bob Partner" },
        },
        unreadCount: 0,
    };

    const mockMessages = [
        {
            _id: "msg_own",
            conversation: "conv_123",
            sender: { _id: "user_alice", name: "Alice Active" },
            content: "My own message",
            createdAt: new Date().toISOString(),
            readBy: ["user_alice"],
            isDeletedForEveryone: false,
        },
        {
            _id: "msg_partner",
            conversation: "conv_123",
            sender: { _id: "user_bob", name: "Bob Partner" },
            content: "Partner message",
            createdAt: new Date().toISOString(),
            readBy: ["user_bob", "user_alice"],
            isDeletedForEveryone: false,
        },
        {
            _id: "msg_deleted",
            conversation: "conv_123",
            sender: { _id: "user_bob", name: "Bob Partner" },
            content: "This message was deleted",
            createdAt: new Date().toISOString(),
            readBy: ["user_bob", "user_alice"],
            isDeletedForEveryone: true,
        },
    ];

    const getBaseAuth = (overrides = {}) => ({
        isAuthenticated: true,
        loading: false,
        token: "mock_jwt_token",
        userData: mockUser,
        unreadChatCount: 0,
        setUnreadChatCount: jest.fn(),
        getConversations: jest.fn().mockImplementation(() =>
            Promise.resolve({ success: true, conversations: [mockConversation] })
        ),
        getConversationMessages: jest.fn().mockImplementation(() =>
            Promise.resolve({ success: true, messages: mockMessages })
        ),
        markConversationRead: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
        deleteMessageForMe: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
        deleteMessageForEveryone: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
        clearChat: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
        deleteChat: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
        ...overrides,
    });

    const getBaseDirectCall = (overrides = {}) => ({
        startDirectCall: jest.fn(),
        isCallActive: false,
        activeCall: null,
        ...overrides,
    });

    const renderChat = (authOverrides = {}) => {
        const authValue = getBaseAuth(authOverrides);
        const directCallValue = getBaseDirectCall();
        return render(
            <AuthContext.Provider value={authValue}>
                <DirectCallContext.Provider value={directCallValue}>
                    <MemoryRouter>
                        <Chat />
                    </MemoryRouter>
                </DirectCallContext.Provider>
            </AuthContext.Provider>
        );
    };

    test("1. Renders conversations and messages including 'This message was deleted' placeholder", async () => {
        renderChat();

        // Check that conversation item renders in sidebar
        const convNames = await screen.findAllByText("Bob Partner");
        expect(convNames.length).toBeGreaterThan(0);

        // Click conversation
        fireEvent.click(convNames[0]);

        // Wait for messages to be visible
        await waitFor(() => {
            expect(screen.getByText("My own message")).toBeInTheDocument();
            expect(screen.getByText("Partner message")).toBeInTheDocument();
            expect(screen.getByText("This message was deleted")).toBeInTheDocument();
        });
    });

    test("2. Displays Clear Chat and Delete Chat in conversation header menu", async () => {
        renderChat();

        const convNames = await screen.findAllByText("Bob Partner");
        fireEvent.click(convNames[0]);

        await waitFor(() => {
            expect(screen.getByText("My own message")).toBeInTheDocument();
        });

        // Open options menu (MoreVert button)
        const moreButtons = screen.getAllByRole("button");
        const headerMenuBtn = moreButtons.find((btn) => btn.querySelector("[data-testid='MoreVertIcon']"));
        expect(headerMenuBtn).toBeTruthy();

        fireEvent.click(headerMenuBtn);

        // Verify Clear Chat and Delete Chat menu items exist
        await waitFor(() => {
            expect(screen.getByText("Clear Chat")).toBeInTheDocument();
            expect(screen.getByText("Delete Chat")).toBeInTheDocument();
        });
    });

    test("3. Clear Chat opens confirmation dialog and invokes clearChat on confirm", async () => {
        const mockClearChat = jest.fn().mockImplementation(() => Promise.resolve({ success: true }));
        renderChat({ clearChat: mockClearChat });

        const convNames = await screen.findAllByText("Bob Partner");
        fireEvent.click(convNames[0]);

        await waitFor(() => {
            expect(screen.getByText("My own message")).toBeInTheDocument();
        });

        const moreButtons = screen.getAllByRole("button");
        const headerMenuBtn = moreButtons.find((btn) => btn.querySelector("[data-testid='MoreVertIcon']"));
        fireEvent.click(headerMenuBtn);

        const clearOption = await screen.findByText("Clear Chat");
        fireEvent.click(clearOption);

        // Verify confirmation dialog appears
        await waitFor(() => {
            expect(screen.getByText("Clear this chat?")).toBeInTheDocument();
        });

        // Confirm clear
        const confirmBtn = screen.getByRole("button", { name: "Clear Chat" });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(mockClearChat).toHaveBeenCalledWith("conv_123");
        });
    });
});
