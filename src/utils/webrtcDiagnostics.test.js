import {
    createCallDiagnostics,
    recordConnectionState,
    recordIceConnectionState,
    extractSafeCandidatePair,
    isSafeDiagnosticData,
    buildSanitizedTelemetryPayload,
} from "./webrtcDiagnostics";

describe("Prompt 10: WebRTC Safe Diagnostics & Telemetry Unit Tests", () => {
    describe("createCallDiagnostics", () => {
        it("initializes clean tracking state with default values", () => {
            const tracker = createCallDiagnostics("call_test-1234", true);
            expect(tracker.callId).toBe("call_test-1234");
            expect(tracker.isInitiator).toBe(true);
            expect(tracker.outcome).toBe("idle");
            expect(tracker.terminalConnectionState).toBe("new");
            expect(tracker.terminalIceConnectionState).toBe("new");
            expect(tracker.iceRestartAttempts).toBe(0);
            expect(tracker.timeToConnectedMs).toBeNull();
        });
    });

    describe("recordConnectionState & recordIceConnectionState", () => {
        it("tracks state transitions and records timeToConnectedMs upon connection", () => {
            const tracker = createCallDiagnostics("call_test-1234", false);
            recordConnectionState(tracker, "connecting");
            expect(tracker.terminalConnectionState).toBe("connecting");
            expect(tracker.outcome).toBe("idle");

            recordConnectionState(tracker, "connected");
            expect(tracker.terminalConnectionState).toBe("connected");
            expect(tracker.outcome).toBe("connected");
            expect(typeof tracker.timeToConnectedMs).toBe("number");
            expect(tracker.timeToConnectedMs).toBeGreaterThanOrEqual(0);

            recordIceConnectionState(tracker, "checking");
            expect(tracker.terminalIceConnectionState).toBe("checking");

            recordIceConnectionState(tracker, "connected");
            expect(tracker.terminalIceConnectionState).toBe("connected");
        });

        it("records failure categories when connectionState or iceConnectionState fails", () => {
            const tracker = createCallDiagnostics("call_test-fail", false);
            recordConnectionState(tracker, "connecting");
            recordIceConnectionState(tracker, "failed");
            expect(tracker.failureCategory).toBe("ice_failed");

            recordConnectionState(tracker, "failed");
            expect(tracker.outcome).toBe("failed");
            expect(tracker.failureCategory).toBe("ice_failed"); // Preserves initial trigger
        });
    });

    describe("extractSafeCandidatePair", () => {
        it("extracts safe candidate pair types and protocol without leaking IP addresses or ports", () => {
            const mockStatsReport = new Map([
                [
                    "pair-1",
                    {
                        id: "pair-1",
                        type: "candidate-pair",
                        selected: true,
                        state: "succeeded",
                        localCandidateId: "cand-local",
                        remoteCandidateId: "cand-remote",
                        protocol: "udp",
                        currentRoundTripTime: 0.045,
                    },
                ],
                [
                    "cand-local",
                    {
                        id: "cand-local",
                        type: "local-candidate",
                        candidateType: "srflx",
                        ip: "198.51.100.24", // SENSITIVE IP - MUST BE STRIPPED
                        port: 54321,
                    },
                ],
                [
                    "cand-remote",
                    {
                        id: "cand-remote",
                        type: "remote-candidate",
                        candidateType: "srflx",
                        ip: "203.0.113.88", // SENSITIVE IP - MUST BE STRIPPED
                        port: 49152,
                    },
                ],
            ]);

            const extracted = extractSafeCandidatePair(mockStatsReport);
            expect(extracted).not.toBeNull();
            expect(extracted.localCandidateType).toBe("srflx");
            expect(extracted.remoteCandidateType).toBe("srflx");
            expect(extracted.protocol).toBe("udp");
            expect(extracted.roundTripTime).toBe(0.045);

            // Verify no IP or port leaked into extracted output
            const serialized = JSON.stringify(extracted);
            expect(serialized).not.toContain("198.51.100.24");
            expect(serialized).not.toContain("203.0.113.88");
            expect(serialized).not.toContain('"ip":');
            expect(serialized).not.toContain('"port":');
            expect(extracted.ip).toBeUndefined();
            expect(extracted.port).toBeUndefined();
        });

        it("identifies relayed candidate pairs when TURN is active", () => {
            const mockStatsReport = [
                {
                    id: "pair-relay",
                    type: "candidate-pair",
                    nominated: true,
                    state: "succeeded",
                    localCandidateId: "cand-local-relay",
                    remoteCandidateId: "cand-remote-peer",
                    protocol: "tcp",
                    currentRoundTripTime: 0.082,
                },
                {
                    id: "cand-local-relay",
                    type: "local-candidate",
                    candidateType: "relay",
                    ip: "192.0.2.1",
                    port: 3478,
                },
                {
                    id: "cand-remote-peer",
                    type: "remote-candidate",
                    candidateType: "host",
                    ip: "10.0.0.5",
                    port: 50000,
                },
            ];

            const extracted = extractSafeCandidatePair(mockStatsReport);
            expect(extracted).not.toBeNull();
            expect(extracted.localCandidateType).toBe("relay");
            expect(extracted.remoteCandidateType).toBe("host");
            expect(extracted.protocol).toBe("tcp");
            expect(extracted.roundTripTime).toBe(0.082);
        });

        it("handles null, empty, or unsupported stats gracefully without throwing", () => {
            expect(extractSafeCandidatePair(null)).toBeNull();
            expect(extractSafeCandidatePair(undefined)).toBeNull();
            expect(extractSafeCandidatePair({})).toBeNull();
            expect(extractSafeCandidatePair([])).toBeNull();
            expect(extractSafeCandidatePair("invalid-string")).toBeNull();
        });
    });

    describe("isSafeDiagnosticData & buildSanitizedTelemetryPayload", () => {
        it("detects sensitive patterns like IP addresses, SDP fragments, and bearer tokens", () => {
            expect(isSafeDiagnosticData("connected")).toBe(true);
            expect(isSafeDiagnosticData({ outcome: "connected", rtt: 45 })).toBe(true);

            expect(isSafeDiagnosticData("192.168.1.1")).toBe(false);
            expect(isSafeDiagnosticData("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(false);
            expect(isSafeDiagnosticData("candidate:842163049 1 udp 1677729535 192.168.1.2 54321 typ host")).toBe(false);
            expect(isSafeDiagnosticData("v=0\r\no=- 42 2 IN IP4 127.0.0.1")).toBe(false);
            expect(isSafeDiagnosticData("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")).toBe(false);
        });

        it("builds a low-cardinality sanitized telemetry payload", () => {
            const tracker = createCallDiagnostics("call_test-final", true);
            recordConnectionState(tracker, "connecting");
            recordConnectionState(tracker, "connected");
            tracker.selectedCandidatePair = {
                localCandidateType: "host",
                remoteCandidateType: "host",
                protocol: "udp",
                roundTripTime: 0.012,
            };
            tracker.endTime = tracker.connectedTime + 45000; // 45 seconds

            const payload = buildSanitizedTelemetryPayload(tracker);
            expect(payload.callId).toBe("call_test-final");
            expect(payload.outcome).toBe("connected");
            expect(payload.callDurationSecs).toBe(45);
            expect(payload.terminalConnectionState).toBe("connected");
            expect(payload.selectedCandidatePair.localCandidateType).toBe("host");
            expect(payload.iceRestartAttempts).toBe(0);
        });
    });
});
