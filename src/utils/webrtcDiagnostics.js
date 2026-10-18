/**
 * Safe, privacy-conscious WebRTC Diagnostics and Telemetry Engine.
 * 
 * Strict Privacy Invariants:
 * 1. Never logs or extracts raw SDP, ICE candidate strings, peer IP addresses,
 *    ports, access tokens, or sensitive user data.
 * 2. Extracts only low-cardinality metadata (e.g., candidate types: 'host', 'srflx', 'relay').
 * 3. Handles unsupported browser APIs, missing getStats(), and null stats gracefully.
 */

const SENSITIVE_PATTERNS = [
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/, // IPv4
    /\b[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7}\b/, // IPv6
    /(?:candidate:|v=0|m=video|m=audio|a=rtpmap|a=ice-)/i, // SDP / candidate strings
    /bearer\s+[a-zA-Z0-9._-]+/i, // Bearer auth
];

/**
 * Checks whether a value contains sensitive personal data, IP addresses, or raw network strings.
 * 
 * @param {any} val
 * @returns {boolean} True if safe, False if sensitive patterns matched
 */
export function isSafeDiagnosticData(val) {
    if (val === null || val === undefined) return true;
    if (typeof val === "string") {
        for (const pattern of SENSITIVE_PATTERNS) {
            if (pattern.test(val)) return false;
        }
        return true;
    }
    if (typeof val === "object") {
        for (const key of Object.keys(val)) {
            if (!isSafeDiagnosticData(val[key])) return false;
        }
        return true;
    }
    return true;
}

/**
 * Initializes a new diagnostic tracking session for a call.
 * 
 * @param {string} callId
 * @param {boolean} [isInitiator=false]
 * @returns {Object}
 */
export function createCallDiagnostics(callId, isInitiator = false) {
    const now = Date.now();
    return {
        callId: callId || null,
        isInitiator: Boolean(isInitiator),
        startTime: now,
        queueStartTime: null,
        queueWaitMs: null,
        timeToConnectedMs: null,
        connectedTime: null,
        endTime: null,
        callDurationSecs: 0,
        terminalConnectionState: "new",
        terminalIceConnectionState: "new",
        connectionStateHistory: [{ state: "new", timestamp: now }],
        iceConnectionStateHistory: [{ state: "new", timestamp: now }],
        iceRestartAttempts: 0,
        outcome: "idle",
        failureCategory: null,
        selectedCandidatePair: null,
    };
}

/**
 * Records a connectionState transition and updates outcome/timing metrics.
 * 
 * @param {Object} tracker
 * @param {string} newState
 * @returns {Object}
 */
export function recordConnectionState(tracker, newState) {
    if (!tracker) return tracker;
    const now = Date.now();
    tracker.terminalConnectionState = String(newState || "unknown");

    if (!Array.isArray(tracker.connectionStateHistory)) {
        tracker.connectionStateHistory = [];
    }
    if (tracker.connectionStateHistory.length < 20) {
        tracker.connectionStateHistory.push({ state: tracker.terminalConnectionState, timestamp: now });
    }

    if (newState === "connected") {
        tracker.outcome = "connected";
        if (!tracker.connectedTime) {
            tracker.connectedTime = now;
            tracker.timeToConnectedMs = Math.max(0, now - (tracker.startTime || now));
        }
    } else if (newState === "failed") {
        if (tracker.outcome !== "ended" && tracker.outcome !== "declined") {
            tracker.outcome = "failed";
            tracker.failureCategory = tracker.failureCategory || "connection_failed";
        }
    } else if (newState === "closed") {
        if (tracker.outcome === "connected") {
            tracker.outcome = "ended";
        }
    }

    return tracker;
}

/**
 * Records an iceConnectionState transition.
 * 
 * @param {Object} tracker
 * @param {string} newState
 * @returns {Object}
 */
export function recordIceConnectionState(tracker, newState) {
    if (!tracker) return tracker;
    const now = Date.now();
    tracker.terminalIceConnectionState = String(newState || "unknown");

    if (!Array.isArray(tracker.iceConnectionStateHistory)) {
        tracker.iceConnectionStateHistory = [];
    }
    if (tracker.iceConnectionStateHistory.length < 20) {
        tracker.iceConnectionStateHistory.push({ state: tracker.terminalIceConnectionState, timestamp: now });
    }

    if (newState === "failed" && tracker.outcome !== "ended") {
        tracker.failureCategory = tracker.failureCategory || "ice_failed";
    }

    return tracker;
}

/**
 * Extracts privacy-safe, low-cardinality candidate pair metadata from RTCStatsReport.
 * Never extracts IP addresses, ports, or raw candidate SDP strings.
 * 
 * @param {RTCStatsReport|Map|Object} statsReport
 * @returns {{ localCandidateType: string, remoteCandidateType: string, protocol: string, roundTripTime: number|null }|null}
 */
export function extractSafeCandidatePair(statsReport) {
    if (!statsReport) return null;

    try {
        let statsEntries = [];
        if (typeof statsReport.forEach === "function") {
            statsReport.forEach((stat) => statsEntries.push(stat));
        } else if (Array.isArray(statsReport)) {
            statsEntries = statsReport;
        } else if (typeof statsReport === "object") {
            statsEntries = Object.values(statsReport);
        }

        if (statsEntries.length === 0) return null;

        // 1. Locate selected candidate pair
        let selectedPair = null;
        for (const stat of statsEntries) {
            if (!stat || typeof stat !== "object") continue;
            if (
                stat.type === "candidate-pair" &&
                (stat.selected === true || stat.nominated === true || stat.state === "succeeded")
            ) {
                selectedPair = stat;
                break;
            }
        }

        // Check transport stats fallback if no selected candidate-pair directly found
        if (!selectedPair) {
            for (const stat of statsEntries) {
                if (stat && stat.type === "transport" && stat.selectedCandidatePairId) {
                    selectedPair = statsEntries.find((s) => s?.id === stat.selectedCandidatePairId);
                    if (selectedPair) break;
                }
            }
        }

        if (!selectedPair) return null;

        // 2. Resolve local and remote candidates
        let localCand = null;
        let remoteCand = null;

        if (selectedPair.localCandidateId) {
            localCand = statsEntries.find((s) => s?.id === selectedPair.localCandidateId);
        }
        if (selectedPair.remoteCandidateId) {
            remoteCand = statsEntries.find((s) => s?.id === selectedPair.remoteCandidateId);
        }

        // 3. Extract strictly safe candidate types ('host', 'srflx', 'prflx', 'relay')
        const rawLocalType = localCand?.candidateType || selectedPair.localCandidateType || "unknown";
        const rawRemoteType = remoteCand?.candidateType || selectedPair.remoteCandidateType || "unknown";
        const rawProtocol = selectedPair.protocol || localCand?.protocol || "unknown";

        // Whitelist allowed candidate types to prevent any string leak
        const ALLOWED_TYPES = new Set(["host", "srflx", "prflx", "relay"]);
        const localCandidateType = ALLOWED_TYPES.has(String(rawLocalType).toLowerCase())
            ? String(rawLocalType).toLowerCase()
            : "unknown";
        const remoteCandidateType = ALLOWED_TYPES.has(String(rawRemoteType).toLowerCase())
            ? String(rawRemoteType).toLowerCase()
            : "unknown";

        const protocol = String(rawProtocol).toLowerCase().startsWith("tcp") ? "tcp" : "udp";

        const rtt = Number.isFinite(selectedPair.currentRoundTripTime)
            ? Number(selectedPair.currentRoundTripTime)
            : Number.isFinite(selectedPair.totalRoundTripTime)
            ? Number(selectedPair.totalRoundTripTime)
            : null;

        return {
            localCandidateType,
            remoteCandidateType,
            protocol,
            roundTripTime: rtt !== null ? Math.round(rtt * 1000) / 1000 : null,
        };
    } catch (e) {
        // Stats parsing failure must never crash the application
        return null;
    }
}

/**
 * Builds a sanitized, privacy-safe telemetry payload ready for transmission or local logging.
 * 
 * @param {Object} tracker
 * @returns {Object}
 */
export function buildSanitizedTelemetryPayload(tracker) {
    if (!tracker) return null;

    const now = Date.now();
    const duration = tracker.connectedTime
        ? Math.max(0, Math.floor(((tracker.endTime || now) - tracker.connectedTime) / 1000))
        : 0;

    const payload = {
        callId: tracker.callId,
        outcome: tracker.outcome || "idle",
        queueWaitMs: tracker.queueWaitMs,
        timeToConnectedMs: tracker.timeToConnectedMs,
        callDurationSecs: duration,
        terminalConnectionState: tracker.terminalConnectionState || "unknown",
        terminalIceConnectionState: tracker.terminalIceConnectionState || "unknown",
        failureCategory: tracker.failureCategory,
        selectedCandidatePair: tracker.selectedCandidatePair,
        iceRestartAttempts: tracker.iceRestartAttempts || 0,
    };

    // Final security verification: ensure no sensitive data exists in payload
    if (!isSafeDiagnosticData(payload)) {
        return {
            callId: tracker.callId,
            outcome: "redacted_due_to_sensitive_data",
            callDurationSecs: 0,
            iceRestartAttempts: 0,
        };
    }

    return payload;
}

