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

jest.mock("../contexts/DirectCallContext", () => ({
    useDirectCall: () => ({
        initiateDirectCall: jest.fn(),
    }),
}));

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import DiscoveryPage from "./discovery";

describe("Prompt 17: Discovery Deck Performance & Optimistic Swiping Suite", () => {
    const mockCurrentUser = {
        _id: "65cf00000000000000000001",
        name: "Test User",
        username: "test_user",
        photos: ["https://example.com/user.jpg"],
        isProfileComplete: true,
        datingPreferences: {
            interestedIn: ["everyone"],
            ageRange: { min: 18, max: 80 },
        },
    };

    const mockCandidates = [
        {
            _id: "65cf11111111111111111111",
            name: "Candidate Alpha",
            dob: "1997-04-12",
            gender: "female",
            bio: "Bio Alpha",
            photos: ["https://example.com/alpha1.jpg", "https://example.com/alpha2.jpg"],
            interests: ["hiking"],
            isProfileComplete: true,
        },
        {
            _id: "65cf22222222222222222222",
            name: "Candidate Beta",
            dob: "1995-09-20",
            gender: "male",
            bio: "Bio Beta",
            photos: ["https://example.com/beta1.jpg"],
            interests: ["music"],
            isProfileComplete: true,
        },
        {
            _id: "65cf33333333333333333333",
            name: "Candidate Gamma",
            dob: "1998-01-15",
            gender: "non-binary",
            bio: "Bio Gamma",
            photos: ["https://example.com/gamma1.jpg"],
            interests: ["art"],
            isProfileComplete: true,
        },
    ];

    const createMockAuthContext = (overrides = {}) => ({
        userData: mockCurrentUser,
        token: "test_token",
        loading: false,
        isAuthenticated: true,
        getDiscovery: jest.fn().mockResolvedValue({
            success: true,
            profiles: [...mockCandidates],
            hasMore: false,
            total: 3,
        }),
        sendSwipe: jest.fn().mockImplementation(() => new Promise((resolve) => {
            // Simulate 500ms network roundtrip delay
            setTimeout(() => {
                resolve({ success: true, isMatch: false });
            }, 500);
        })),
        resetDiscoveryFeed: jest.fn().mockResolvedValue({
            success: true,
            message: "Deck refreshed",
        }),
        blockUser: jest.fn().mockResolvedValue({ success: true }),
        reportUser: jest.fn().mockResolvedValue({ success: true }),
        updateDiscoveryPreferences: jest.fn().mockResolvedValue({ success: true }),
        ...overrides,
    });

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test("1. Optimistic Advance: advances profile card index immediately without waiting for network swipe response", async () => {
        let resolveSwipe;
        const pendingSwipePromise = new Promise((resolve) => {
            resolveSwipe = resolve;
        });
        const sendSwipeMock = jest.fn().mockReturnValue(pendingSwipePromise);
        const contextValue = createMockAuthContext({ sendSwipe: sendSwipeMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={contextValue}>
                    <DiscoveryPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        // Wait for initial profiles to load
        await act(async () => {
            jest.runAllTicks();
        });

        // First candidate Alpha is visible
        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();

        // Click Like button
        const likeButton = screen.getByLabelText("Like profile (Arrow Right)");
        fireEvent.click(likeButton);

        // Network call is in-flight (NOT resolved yet!)
        expect(sendSwipeMock).toHaveBeenCalledTimes(1);
        expect(sendSwipeMock).toHaveBeenCalledWith("65cf11111111111111111111", "like");

        // Advance exit animation timer (220ms)
        act(() => {
            jest.advanceTimersByTime(250);
        });

        // The UI should have ALREADY optimistically advanced to Candidate Beta!
        expect(screen.getByText("Candidate Beta")).toBeInTheDocument();

        // Now resolve the background network call
        await act(async () => {
            resolveSwipe({ success: true, isMatch: false });
        });

        // Still on Candidate Beta
        expect(screen.getByText("Candidate Beta")).toBeInTheDocument();
    });

    test("2. Background Dispatch: sends correct targetId and mapped action asynchronously", async () => {
        const sendSwipeMock = jest.fn().mockResolvedValue({ success: true, isMatch: false });
        const contextValue = createMockAuthContext({ sendSwipe: sendSwipeMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={contextValue}>
                    <DiscoveryPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await act(async () => {
            jest.runAllTicks();
        });

        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();

        // Click Pass button
        const passButton = screen.getByLabelText("Pass profile (Arrow Left)");
        fireEvent.click(passButton);

        expect(sendSwipeMock).toHaveBeenCalledWith("65cf11111111111111111111", "pass");

        act(() => {
            jest.advanceTimersByTime(250);
        });

        expect(screen.getByText("Candidate Beta")).toBeInTheDocument();
    });

    test("3. Rollback on Network Error: rolls back profile index and alerts user if network swipe fails", async () => {
        let rejectSwipe;
        const failingSwipePromise = new Promise((_, reject) => {
            rejectSwipe = reject;
        });
        const sendSwipeMock = jest.fn().mockReturnValue(failingSwipePromise);
        const contextValue = createMockAuthContext({ sendSwipe: sendSwipeMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={contextValue}>
                    <DiscoveryPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await act(async () => {
            jest.runAllTicks();
        });

        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();

        // Click Like button
        const likeButton = screen.getByLabelText("Like profile (Arrow Right)");
        fireEvent.click(likeButton);

        // Advance 220ms - card optimistically advances to Beta
        act(() => {
            jest.advanceTimersByTime(250);
        });
        expect(screen.getByText("Candidate Beta")).toBeInTheDocument();

        // Background network failure occurs
        await act(async () => {
            rejectSwipe(new Error("Network connection dropped"));
        });

        // Expect index rollback back to Candidate Alpha and error alert displayed!
        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();
        expect(screen.getByText(/Network connection dropped/i)).toBeInTheDocument();
    });

    test("4. Rapid Swipe Deduplication: prevents multiple network calls for the same target user", async () => {
        let resolveSwipe;
        const pendingSwipePromise = new Promise((resolve) => {
            resolveSwipe = resolve;
        });
        const sendSwipeMock = jest.fn().mockReturnValue(pendingSwipePromise);
        const contextValue = createMockAuthContext({ sendSwipe: sendSwipeMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={contextValue}>
                    <DiscoveryPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await act(async () => {
            jest.runAllTicks();
        });

        const likeButton = screen.getByLabelText("Like profile (Arrow Right)");

        // Rapidly click like button 3 times in same tick
        fireEvent.click(likeButton);
        fireEvent.click(likeButton);
        fireEvent.click(likeButton);

        // Should only have dispatched once
        expect(sendSwipeMock).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveSwipe({ success: true, isMatch: false });
        });
    });

    test("5. Profile-ID-based rollback under rapid multi-card swipes with out-of-order network failure", async () => {
        let rejectAlphaSwipe;
        let resolveBetaSwipe;
        const alphaPromise = new Promise((_, reject) => {
            rejectAlphaSwipe = reject;
        });
        const betaPromise = new Promise((resolve) => {
            resolveBetaSwipe = resolve;
        });

        const sendSwipeMock = jest.fn().mockImplementation((targetId) => {
            if (targetId === "65cf11111111111111111111") {
                return alphaPromise; // Alpha
            }
            if (targetId === "65cf22222222222222222222") {
                return betaPromise; // Beta
            }
            return Promise.resolve({ success: true, isMatch: false });
        });

        const contextValue = createMockAuthContext({ sendSwipe: sendSwipeMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={contextValue}>
                    <DiscoveryPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await act(async () => {
            jest.runAllTicks();
        });

        // 1. Initially on Candidate Alpha
        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();

        // 2. Swipe Alpha (like)
        const likeButton = screen.getByLabelText("Like profile (Arrow Right)");
        fireEvent.click(likeButton);
        act(() => {
            jest.advanceTimersByTime(250);
        });

        // 3. Optimistically advanced to Candidate Beta
        expect(screen.getByText("Candidate Beta")).toBeInTheDocument();

        // 4. Swipe Beta (pass) while Alpha is still in-flight
        const passButton = screen.getByLabelText("Pass profile (Arrow Left)");
        fireEvent.click(passButton);
        act(() => {
            jest.advanceTimersByTime(250);
        });

        // 5. Optimistically advanced to Candidate Gamma
        expect(screen.getByText("Candidate Gamma")).toBeInTheDocument();

        // 6. Now Alpha fails over the network while user is on Candidate Gamma!
        await act(async () => {
            rejectAlphaSwipe(new Error("Network timeout on Alpha"));
        });

        // 7. Deterministic ID-based rollback MUST restore Candidate Alpha specifically to the active view!
        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();
        expect(screen.getByText(/Network timeout on Alpha/i)).toBeInTheDocument();

        // 8. Beta succeeds in the background
        await act(async () => {
            resolveBetaSwipe({ success: true, isMatch: false });
        });

        // Still on Candidate Alpha
        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();
    });

    test("6. Sequential multi-card failures restore both profiles in deterministic order without duplicate cards", async () => {
        let rejectAlpha;
        let rejectBeta;
        const alphaPromise = new Promise((_, reject) => {
            rejectAlpha = reject;
        });
        const betaPromise = new Promise((_, reject) => {
            rejectBeta = reject;
        });

        const sendSwipeMock = jest.fn().mockImplementation((targetId) => {
            if (targetId === "65cf11111111111111111111") return alphaPromise;
            if (targetId === "65cf22222222222222222222") return betaPromise;
            return Promise.resolve({ success: true, isMatch: false });
        });

        const contextValue = createMockAuthContext({ sendSwipe: sendSwipeMock });

        render(
            <MemoryRouter>
                <AuthContext.Provider value={contextValue}>
                    <DiscoveryPage />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        await act(async () => {
            jest.runAllTicks();
        });

        // Swipe Alpha
        fireEvent.click(screen.getByLabelText("Like profile (Arrow Right)"));
        act(() => {
            jest.advanceTimersByTime(250);
        });

        // Swipe Beta
        fireEvent.click(screen.getByLabelText("Pass profile (Arrow Left)"));
        act(() => {
            jest.advanceTimersByTime(250);
        });

        // Viewing Gamma
        expect(screen.getByText("Candidate Gamma")).toBeInTheDocument();

        // Beta fails first
        await act(async () => {
            rejectBeta(new Error("Beta failed"));
        });
        // User sees Beta restored!
        expect(screen.getByText("Candidate Beta")).toBeInTheDocument();

        // Alpha fails second
        await act(async () => {
            rejectAlpha(new Error("Alpha failed"));
        });
        // User sees Alpha restored!
        expect(screen.getByText("Candidate Alpha")).toBeInTheDocument();
    });
});
