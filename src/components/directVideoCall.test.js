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
import { render, screen, fireEvent } from "@testing-library/react";
import DirectVideoCallModal from "./DirectVideoCallModal";
import { DirectCallContext } from "../contexts/DirectCallContext";

describe("Direct Video Calling Component Suite", () => {
    const mockPartner = {
        _id: "65cf22222222222222222222",
        name: "Jessica Miller",
        username: "jessica_m",
        age: 26,
        photos: ["https://example.com/jessica.jpg"],
    };

    const defaultCallContext = {
        callState: "idle",
        callSession: null,
        localStream: null,
        remoteStream: null,
        audioEnabled: true,
        videoEnabled: true,
        callDuration: 0,
        statusMessage: "",
        callError: null,
        initiateDirectCall: jest.fn(),
        acceptDirectCall: jest.fn(),
        declineDirectCall: jest.fn(),
        endDirectCall: jest.fn(),
        toggleAudio: jest.fn(),
        toggleVideo: jest.fn(),
    };

    const renderWithContext = (contextOverrides = {}) => {
        const contextValue = { ...defaultCallContext, ...contextOverrides };
        return render(
            <DirectCallContext.Provider value={contextValue}>
                <DirectVideoCallModal />
            </DirectCallContext.Provider>
        );
    };

    it("1. renders nothing when callState is 'idle'", () => {
        const { container } = renderWithContext({ callState: "idle" });
        expect(container.firstChild).toBeNull();
    });

    it("2. renders incoming call ringing dialog with caller details, Accept and Decline buttons", () => {
        const acceptSpy = jest.fn();
        const declineSpy = jest.fn();

        renderWithContext({
            callState: "incoming_ringing",
            callSession: {
                callId: "call_abc123",
                role: "callee",
                partner: mockPartner,
            },
            acceptDirectCall: acceptSpy,
            declineDirectCall: declineSpy,
        });

        expect(screen.getByText("Incoming Video Call")).toBeInTheDocument();
        expect(screen.getByText(/Jessica Miller/)).toBeInTheDocument();
        expect(screen.getByText(/Established Connection/)).toBeInTheDocument();

        // Check buttons
        const acceptBtn = screen.getByText("Accept");
        const declineBtn = screen.getByText("Decline");
        expect(acceptBtn).toBeInTheDocument();
        expect(declineBtn).toBeInTheDocument();

        // Fire Accept
        fireEvent.click(acceptBtn);
        expect(acceptSpy).toHaveBeenCalledTimes(1);

        // Fire Decline
        fireEvent.click(declineBtn);
        expect(declineSpy).toHaveBeenCalledTimes(1);
    });

    it("3. renders outgoing call ringing dialog with partner details and End Call button", () => {
        const endSpy = jest.fn();

        renderWithContext({
            callState: "outgoing_ringing",
            callSession: {
                callId: "call_abc123",
                role: "caller",
                partner: mockPartner,
            },
            endDirectCall: endSpy,
        });

        expect(screen.getByText("Direct Video Call")).toBeInTheDocument();
        expect(screen.getByText(/Calling Jessica Miller/)).toBeInTheDocument();
        expect(screen.getByText("Ringing partner's device")).toBeInTheDocument();

        const endCallBtn = screen.getByText("End Call");
        expect(endCallBtn).toBeInTheDocument();

        fireEvent.click(endCallBtn);
        expect(endSpy).toHaveBeenCalledTimes(1);
    });

    it("4. renders connecting dialog during media and peer connection setup", () => {
        const endSpy = jest.fn();

        renderWithContext({
            callState: "connecting",
            callSession: {
                callId: "call_abc123",
                role: "caller",
                partner: mockPartner,
            },
            endDirectCall: endSpy,
        });

        expect(screen.getByText(/Connecting with Jessica Miller/)).toBeInTheDocument();
        expect(screen.getByText("Establishing secure encrypted media stream")).toBeInTheDocument();
    });

    it("5. renders terminal status feedback for declined, busy, and ended calls", () => {
        // Declined
        const { unmount } = renderWithContext({
            callState: "declined",
            statusMessage: "Call was declined.",
        });
        expect(screen.getByText("Call was declined.")).toBeInTheDocument();
        unmount();

        // Busy
        const { unmount: unmountBusy } = renderWithContext({
            callState: "busy",
            statusMessage: "User is currently busy on another call.",
        });
        expect(screen.getByText("User is currently busy on another call.")).toBeInTheDocument();
        unmountBusy();

        // Ended
        renderWithContext({
            callState: "ended",
            statusMessage: "Call ended by partner.",
            callDuration: 75,
        });
        expect(screen.getByText("Call ended by partner.")).toBeInTheDocument();
        expect(screen.getByText("Call duration: 01:15")).toBeInTheDocument();
    });

    it("6. renders connected video call interface with controls and call timer", () => {
        const audioSpy = jest.fn();
        const videoSpy = jest.fn();
        const endSpy = jest.fn();

        renderWithContext({
            callState: "connected",
            callSession: {
                callId: "call_abc123",
                partner: mockPartner,
            },
            callDuration: 125,
            audioEnabled: true,
            videoEnabled: true,
            toggleAudio: audioSpy,
            toggleVideo: videoSpy,
            endDirectCall: endSpy,
        });

        expect(screen.getByText("Jessica Miller")).toBeInTheDocument();
        expect(screen.getByText(/Connected • 02:05/)).toBeInTheDocument();
        expect(screen.getByText("Direct 1-on-1 Call")).toBeInTheDocument();

        // Controls
        const muteBtn = screen.getByLabelText("Mute Microphone");
        expect(muteBtn).toBeInTheDocument();
        fireEvent.click(muteBtn);
        expect(audioSpy).toHaveBeenCalledTimes(1);

        const cameraBtn = screen.getByLabelText("Turn Off Camera");
        expect(cameraBtn).toBeInTheDocument();
        fireEvent.click(cameraBtn);
        expect(videoSpy).toHaveBeenCalledTimes(1);

        const endBtn = screen.getByLabelText("End Call");
        expect(endBtn).toBeInTheDocument();
        fireEvent.click(endBtn);
        expect(endSpy).toHaveBeenCalledTimes(1);
    });
});
