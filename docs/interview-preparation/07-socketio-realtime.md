# 07. Socket.IO & Real-Time Engineering — Engaze

## Real-Time Architecture & Operational Philosophy

Engaze uses **Socket.IO 4.7** to power its bi-directional real-time communication layer. While standard HTTP REST APIs handle transactional persistence and initial payload delivery, Socket.IO provides low-latency messaging, live typing telemetry, read receipt propagation, active user presence, and WebRTC audio/video call signaling.

---

## 1. Connection Lifecycle & Socket Authentication

### Connection Handshake
When an authenticated user loads the application, the client establishes a persistent connection to the Node.js server:
```javascript
// Client-side initialization (DirectCallContext.jsx / chat.jsx)
const socket = io(server, {
    transports: ["websocket", "polling"],
    auth: { token },
    query: { token }
});
```
* **Transports:** Attempts native `websocket` transport first for minimal latency; automatically falls back to HTTP long-polling if restrictive firewalls or corporate proxies block WebSocket upgrades.
* **Socket Authentication Middleware (`socketManager.js`):**
  1. Intercepts the incoming connection before the socket event loop begins.
  2. Extracts the JWT from `socket.handshake.auth.token` or `socket.handshake.query.token`.
  3. Verifies token integrity via `jwt.verify(token, getJwtSecret())`.
  4. Fetches the user from MongoDB to verify account standing:
     * If banned or suspended, rejects the socket connection with an `AuthenticationError`.
  5. Attaches the authenticated user payload directly to `socket.user`.

---

## 2. Room Architecture & Targeted Pub/Sub

Rather than broadcasting events globally across all connected clients, Engaze employs an isolated **Room-Based Addressing Model**:

```
[ Socket.IO Server Cluster ]
         │
         ├── Room: "user:<Alice_ID>"  ────> Alice's Browser & Android Phone
         ├── Room: "user:<Bob_ID>"    ────> Bob's Phone
         └── Room: "conv:<Conv_ID>"   ────> Active Chat Participants (Alice & Bob)
```

1. **User-Isolated Private Room (`user:<userId>`):**
   * Upon connection, every socket automatically joins `user:${socket.user._id}`:
     ```javascript
     socket.join(`user:${socket.user._id}`);
     ```
   * **Architectural Advantage:** Enables targeted 1-to-1 event delivery regardless of which socket ID the user is currently using or whether the user has multiple tabs/devices open. The backend simply emits to `io.to("user:" + targetUserId).emit(...)`.
2. **Conversation Room (`conv:<conversationId>`):**
   * When Alice opens the chat window for Conversation #123, the client emits `chat:join`.
   * The server joins Alice's socket to `conv:123`, allowing scoped real-time broadcasts for typing indicators and in-chat message delivery.

---

## 3. Comprehensive Socket Event Documentation

### A. Events Emitted by Client $\rightarrow$ Handled by Server

| Event Name | Payload Arguments | Purpose & Server-Side Logic | Source File |
| :--- | :--- | :--- | :--- |
| `presence:get` | `{ targetUserId }`, `ack` callback | Queries online status and last-seen timestamp according to Bob's privacy settings. | `socketManager.js` |
| `chat:join` | `{ conversationId }` | Validates user membership in the conversation; joins socket to `conv:<conversationId>`. | `socketManager.js` |
| `chat:send` | `{ conversationId, content, clientTempId }` | Sanitizes message, writes to MongoDB, updates conversation `lastMessage`, and broadcasts to partner. | `socketManager.js` |
| `chat:read` | `{ conversationId }` | Updates all unread messages in conversation with `$addToSet: { readBy: userId }`; notifies sender. | `socketManager.js` |
| `chat:typing` | `{ conversationId, isTyping: boolean }` | Broadcasts typing status to `conv:<conversationId>` excluding the sender. | `socketManager.js` |
| `chat:delete-message`| `{ conversationId, messageId, mode: "me"\|"everyone" }` | Handles soft-deletion for self or retracts message for both participants. | `socketManager.js` |
| `chat:clear` | `{ conversationId }` | Appends user's `clearedAt` timestamp so prior message history is hidden for them. | `socketManager.js` |
| `call:initiate`| `{ targetUserId, callType: "video"\|"audio" }` | Validates mutual match; registers active call session; emits ringing alerts to caller and callee. | `socketManager.js` |
| `call:accept` | `{ callId }` | Changes call state to `connected`; stops ringtones; signals caller to begin WebRTC offer. | `socketManager.js` |
| `call:decline`| `{ callId, reason }` | Finalizes call record as `rejected`; stops ringtones on both devices. | `socketManager.js` |
| `call:signal` | `{ targetUserId, signal }` | Relays WebRTC SDP Offers, SDP Answers, or ICE candidates to the target user. | `socketManager.js` |
| `call:end` | `{ callId, reason }` | Terminates active call; calculates elapsed duration; closes peer connections. | `socketManager.js` |
| `random:join-queue` | `{ preferences }` | Places user into the speed-dating queue; attempts atomic pairing. | `randomCallManager.js` |
| `random:leave-queue`| None | Removes user from the waiting matchmaking queue. | `randomCallManager.js` |
| `random:consent`| `{ sessionId }` | Acknowledges camera readiness; unblocks peer video when both consent. | `randomCallManager.js` |
| `random:next` | `{ sessionId }` | Cleanly ends current speed-date and immediately re-queues user for next partner. | `randomCallManager.js` |

---

### B. Events Emitted by Server $\rightarrow$ Received by Client

| Event Name | Payload Structure | Frontend Action & Handling |
| :--- | :--- | :--- |
| `chat:new-message` | Full `MessageDTO` object | Appends message to message feed; plays subtle audio tick; increments unread counter. |
| `chat:message-sent` | `{ clientTempId, message }` | Matches optimistic temporary message by `clientTempId` and replaces with saved DB record. |
| `chat:messages-read` | `{ conversationId, readBy }` | Updates message status checks to double-blue read receipts. |
| `chat:user-typing` | `{ conversationId, userId, isTyping }` | Displays "Typing..." indicator in conversation header. |
| `chat:unread-count`| `{ unreadCount, conversationsUnread }` | Authoritatively synchronizes navigation bar badge counter. |
| `presence:update` | `{ userId, isOnline, lastSeenAt }` | Updates user presence dot (green = online, grey = offline). |
| `call:incoming` | `{ callId, caller: { _id, name, photos }, callType }` | Triggers `RingtoneEngine`, surfaces `DirectVideoCallModal`, fires Android full-screen intent. |
| `call:ringing` | `{ callId }` | Transitions caller UI to "Ringing...", starts outgoing ringback tone. |
| `call:accepted` | `{ callId }` | Caller starts WebRTC offer creation via `pc.createOffer()`. |
| `call:signal` | `{ senderUserId, signal }` | Ingests incoming SDP offer/answer or ICE candidate into local `RTCPeerConnection`. |
| `call:ended` | `{ callId, reason }` | Closes `RTCPeerConnection`, releases camera/mic hardware locks, auto-closes modal. |
| `account:moderated` | `{ action: "suspended"\|"banned", reason }` | Forcibly disconnects socket, clears auth tokens, and boots user to login screen. |

---

## 4. Presence Tracking & Privacy Engine (`src/services/presence.service.js`)

Unlike trivial chat systems that broadcast presence blindly, Engaze implements a **Privacy-Aware Presence Engine**:
* **Storage Layer:**
  * When Redis is enabled, presence is tracked in a high-speed Redis hash (`presence:users`).
  * When running locally without Redis, it seamlessly falls back to an in-memory `Map()`.
* **Privacy Controls:**
  Before returning Bob's online status or last seen timestamp to Alice, `getPresenceForViewer(targetUserId, viewerUserId)` evaluates Bob's `privacySettings`:
  1. `nobody`: Always returns `{ isOnline: false, lastSeenAt: null }`.
  2. `matches`: Verifies whether Alice and Bob share an active mutual `Match`. If not, hides presence.
  3. `matches_except`: Verifies mutual match AND checks that Alice's ID is not present in Bob's `lastSeenExceptions` array.
  4. `everyone`: Returns true real-time presence.

---

## 5. Socket Abuse Protection & Flood Prevention (`socketValidator.js`)

To prevent denial-of-service (DoS) attacks over WebSocket tunnels, Engaze enforces rate limiting directly at the socket event dispatcher:
```javascript
export function checkSocketRateLimit(socketId, eventName, maxEventsPerSec = 10) {
    // Sliding 1-second token bucket per socket event
    // Drops malicious spam payloads and returns { allowed: false }
}
```
If a rogue client floods `chat:send` or `call:signal` at more than 10 events/second, subsequent events are dropped and a rate limit warning is returned to the client without executing database writes.

---

## 6. Horizontal Scaling with Redis Pub/Sub Adapter

In multi-instance production environments (e.g., multiple Render container replicas behind a load balancer):
* If Alice is connected to **Server Instance A** and Bob is connected to **Server Instance B**, a standard local WebSocket emit cannot reach Bob.
* Engaze integrates **`@socket.io/redis-adapter`**:
  * Emits to `io.to("user:Bob_ID")` are published to a shared Redis Pub/Sub channel.
  * Server Instance B intercepts the Redis message and delivers it to Bob's socket connection seamlessly.
