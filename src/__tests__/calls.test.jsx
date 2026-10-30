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
import Navbar from "../components/Navbar";
import CallsPage from "../pages/calls";
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
});

describe("Phase 2 Calls UI & Navigation Tests", () => {
    const mockCallsData = [
        {
            _id: "call_1",
            callId: "c_1",
            callType: "video",
            direction: "incoming",
            partner: {
                _id: "user_bob",
                name: "Bob Receiver",
                username: "bob",
                photos: ["https://example.com/bob.jpg"],
            },
            status: "missed",
            duration: 0,
            isMissed: true,
            initiatedAt: new Date().toISOString(),
        },
        {
            _id: "call_2",
            callId: "c_2",
            callType: "video",
            direction: "outgoing",
            partner: {
                _id: "user_charlie",
                name: "Charlie Colleague",
                username: "charlie",
                photos: ["https://example.com/charlie.jpg"],
            },
            status: "completed",
            duration: 125,
            isMissed: false,
            initiatedAt: new Date().toISOString(),
        },
    ];

    const getBaseAuth = (overrides = {}) => ({
        isAuthenticated: true,
        loading: false,
        userData: {
            _id: "user_alice",
            name: "Alice",
            username: "alice",
            photos: ["https://example.com/alice.jpg"],
        },
        unreadNotificationCount: 0,
        unreadChatCount: 0,
        unseenMissedCallCount: 0,
        notifications: [],
        logout: jest.fn(),
        getCallHistory: jest.fn().mockImplementation(() =>
            Promise.resolve({
                success: true,
                calls: mockCallsData,
                page: 1,
                totalPages: 1,
                totalCalls: 2,
                unseenMissedCount: 1,
            })
        ),
        markMissedCallsAsSeen: jest.fn().mockResolvedValue({ success: true }),
        ...overrides,
    });

    const getBaseDirectCall = (overrides = {}) => ({
        initiateDirectCall: jest.fn(),
        callState: "idle",
        ...overrides,
    });

    const renderWithProviders = (ui, authOverrides = {}, directCallOverrides = {}) => {
        const authVal = getBaseAuth(authOverrides);
        const directVal = getBaseDirectCall(directCallOverrides);

        return render(
            <AuthContext.Provider value={authVal}>
                <DirectCallContext.Provider value={directVal}>
                    <MemoryRouter>
                        {ui}
                    </MemoryRouter>
                </DirectCallContext.Provider>
            </AuthContext.Provider>
        );
    };

    test("1. Navbar removes Calls nav item and displays call notification badge on Chat", () => {
        renderWithProviders(<Navbar />, { unseenMissedCallCount: 3 });

        // Calls item is no longer in navbar navigation
        const callsNav = screen.queryByRole("button", { name: /^calls$/i });
        expect(callsNav).toBeNull();

        // Chat navbar item displays notification badge with missed call count
        const badgeElements = screen.getAllByText("3");
        expect(badgeElements.length).toBeGreaterThan(0);
    });

    test("2. Chat navbar item displays incoming video call notification when callState is incoming_ringing", () => {
        renderWithProviders(<Navbar />, { unreadChatCount: 0 }, { callState: "incoming_ringing" });

        // Chat badge displays incoming call alert "1"
        const badgeElements = screen.getAllByText("1");
        expect(badgeElements.length).toBeGreaterThan(0);

        const statusBadges = screen.getAllByRole("status");
        const incomingCallBadge = statusBadges.find((el) =>
            el.getAttribute("aria-label")?.includes("incoming call")
        );
        expect(incomingCallBadge).toBeTruthy();
    });

    test("3. CallsPage renders call history, has All Calls, Missed, and Video filters, and Audio tab is absent", async () => {
        renderWithProviders(<CallsPage />);

        const bobElement = await screen.findByText("Bob Receiver");
        expect(bobElement).toBeInTheDocument();

        const charlieElement = await screen.findByText("Charlie Colleague");
        expect(charlieElement).toBeInTheDocument();

        expect(screen.getByText("Missed Call")).toBeInTheDocument();
        expect(screen.getByText(/Completed • 2m 5s/)).toBeInTheDocument();

        // Filters: All Calls, Missed, Video exist; Audio tab is completely removed
        expect(screen.getByRole("tab", { name: /all calls/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /missed/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /^video$/i })).toBeInTheDocument();
        expect(screen.queryByRole("tab", { name: /^audio$/i })).toBeNull();
    });

    test("4. CallsPage automatically marks missed calls as seen on mount", async () => {
        const mockMarkSeen = jest.fn().mockResolvedValue({ success: true });
        renderWithProviders(<CallsPage />, { unseenMissedCallCount: 2, markMissedCallsAsSeen: mockMarkSeen });

        await waitFor(() => {
            expect(mockMarkSeen).toHaveBeenCalled();
        });
    });

    test("5. Clicking 'Call Back' on a call card invokes initiateDirectCall", async () => {
        const mockInitiate = jest.fn();
        renderWithProviders(<CallsPage />, {}, { initiateDirectCall: mockInitiate });

        const bobElement = await screen.findByText("Bob Receiver");
        expect(bobElement).toBeInTheDocument();

        const callBackButtons = screen.getAllByRole("button", { name: /call back/i });
        fireEvent.click(callBackButtons[0]);

        expect(mockInitiate).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Bob Receiver" }),
            null,
            "video"
        );
    });
});
