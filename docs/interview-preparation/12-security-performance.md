# 12. Security & Performance Audit — Engaze

## Security Posture & Performance Audit Matrix

Engaze was engineered under the principle of **Defense-in-Depth**. Every layer of the stack—from network edge to database queries—enforces isolation, rate limiting, and data sanitization.

| Security / Performance Domain | Verification Classification | Implementation Evidence & Code Reference |
| :--- | :---: | :--- |
| **1. Authentication Security** | **Implemented Correctly** | Dual-tier credentials (bcryptjs 10 salt rounds + Google OAuth 2.0 verification via `OAuth2Client`). No plain text storage. |
| **2. Authorization & RBAC** | **Implemented Correctly** | `protect`, `requireEligibility` (18+ check), `requireModerator` middlewares. User status checked on every API call and WebSocket handshake. |
| **3. Input Validation** | **Implemented Correctly** | Mongoose schema validators, custom age validator (`calculateExactAge`), username regex `/^[a-zA-Z0-9_.-]+$/`, and `socketValidator.js`. |
| **4. XSS & Injection Risks** | **Implemented Correctly** | React automatic JSX escaping prevents Reflected/Stored XSS. Mongoose parameterized queries prevent NoSQL injection. Express body parser capped at 40 KB. |
| **5. Cross-Origin Resource Sharing (CORS)**| **Implemented Correctly** | Exact-match allowlist in `cors.js`. Bypasses wildcards. Includes production domains, Vercel preview, and Capacitor schemes (`https://localhost`). |
| **6. Multi-Tier Rate Limiting** | **Implemented Correctly** | Differentiated limiters (`loginIpLimiter`, `loginAccountLimiter`, `swipeLimiter`, `photoUploadLimiter`) with Redis store and in-memory fallback. |
| **7. File Upload Security** | **Implemented Correctly** | Direct-to-S3 presigned URLs. Zero file streaming through Node.js. Server-side S3 HEAD validation and binary magic-byte inspection (`detectMimeType`). |
| **8. JWT Security & Failsafes** | **Implemented Correctly** | `validateJwtConfig` aborts boot in production if secret is $<32$ chars or an insecure placeholder. Minimal payload (`{ id }`). Expiration enforced. |
| **9. API Error Sanitization** | **Implemented Correctly** | `formatSafeDatabaseError` catches DB exceptions and strips raw connection strings, usernames, and passwords using a strict safe-error allowlist. |
| **10. Socket.IO Security** | **Implemented Correctly** | Handshake JWT verification, user-isolated rooms (`user:<userId>`), sliding-window socket event rate limiter (`checkSocketRateLimit`), moderation kick listener. |
| **11. WebRTC Media Security** | **Implemented Correctly** | Mandatory DTLS/SRTP encryption. Google STUN binding. Turn credentials generated dynamically. Local media tracks explicitly stopped on call teardown. |
| **12. Database Performance** | **Implemented Correctly** | Compound indexes across all high-frequency queries (`userPair` unique, `participants + lastMessageAt`, `conversation + createdAt`). Heavy use of `.lean()`. |
| **13. Frontend Performance** | **Implemented Correctly** | Route code-splitting with `React.lazy` and `Suspense`. Core bundle 168 kB gzip. Virtualized lists and optimistic UI updates for chat messages. |
| **14. Memory Leak Prevention** | **Implemented Correctly** | `useEffect` cleanup handlers for event listeners, socket unsubscribes, ringtone intervals, and `RTCPeerConnection` teardown (`stopLocalMedia`). |
| **15. Automated Background Cleanup** | **Implemented Correctly** | `mediaCleanup.worker.js` powered by BullMQ purges unconfirmed temporary S3 uploads and abandoned call audit records. |

---

## 1. Deep Dive: Sensitive Data Sanitization (`formatSafeDatabaseError`)

In many Express applications, unhandled database errors output the raw MongoDB connection string into stdout/stderr:
```
// DANGEROUS: Leaks username and password in logs
console.error("Database connection failed:", err.message);
// Output: MongoServerError: connect to mongodb+srv://admin:P@ssword123@cluster...
```

### The Engaze Sanitizer (`backend/src/app.js`):
Engaze maintains an explicit allowlist of safe error names and system codes:
```javascript
const KNOWN_SAFE_DB_ERRORS = new Set([
  "MongoParseError", "MongoServerSelectionError", "MongoNetworkError",
  "MongoServerError", "CastError", "ValidationError"
]);

const formatSafeDatabaseError = (err) => {
  const rawName = (err && typeof err.name === "string") ? err.name : "";
  const errName = KNOWN_SAFE_DB_ERRORS.has(rawName) ? rawName : "DatabaseConnectionError";
  let errCode = "";
  if (err && typeof err.code === "number") errCode = ` [code: ${err.code}]`;

  // Output NEVER touches err.message or connection strings
  return `Database connection failed (${errName}${errCode}). Please verify network reachability and MONGO_URI configuration.`;
};
```

---

## 2. Deep Dive: Account Moderation & Instant Session Revocation

When a moderator bans or suspends an abusive user via `POST /api/v1/moderation/users/:userId/ban`:
1. The user's document in MongoDB is updated to `status: "banned"`.
2. Any active 1-on-1 direct video call or random speed-date is instantly severed via `terminateUserActiveDirectCalls(userId)`.
3. The real-time gateway emits `account:moderated` directly to `user:<userId>`:
   ```javascript
   ioInstance.to(`user:${userId}`).emit("account:moderated", {
       action: "banned",
       reason: banReason
   });
   ```
4. All open WebSocket sockets belonging to that user are forcibly closed (`socket.disconnect(true)`).
5. The frontend intercepts `account:moderated`, clears `localStorage`, and displays an account suspension banner.

---

## 3. Deep Dive: Frontend Memory Management in WebRTC

WebRTC media streams can easily leak memory and lock camera hardware if not explicitly destroyed during component unmounting.

In `DirectCallContext.jsx`, the teardown function guarantees complete resource deallocation:
```javascript
const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
            track.stop(); // Terminates camera & mic hardware acquisition
        });
        localStreamRef.current = null;
        setLocalStream(null);
    }
}, []);

const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close(); // Closes DTLS/ICE peer connection
        pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
}, []);
```
Both functions are invoked automatically upon:
* Call termination by caller or callee (`call:end`).
* Component unmount (`return () => resetCallState()` in `useEffect`).
* Network disconnect or socket error.
