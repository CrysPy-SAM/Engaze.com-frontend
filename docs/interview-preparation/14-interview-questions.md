# 14. Comprehensive Technical Interview Q&A Guide — Engaze

This guide prepares you for **Senior Full Stack, Backend, and System Design interviews**. Every question includes a **punchy 30-second answer**, a **deep technical explanation**, exact **Engaze file references**, and **tough interviewer follow-up questions**.

---

## Category 1: Project Overview & Architecture

### Q1: Can you give a high-level architectural overview of Engaze?
* **Short Answer:** Engaze is a real-time dating application built on React 18, Node.js 22, Express, MongoDB Atlas, and Socket.IO, wrapped in Capacitor 8 for Android. It operates on a decoupled 3-plane model: a stateless REST control plane, a persistent real-time signaling plane, and a decentralized media plane where video flows P2P via WebRTC and photos upload directly to AWS S3 using presigned SigV4 URLs.
* **Deep Explanation:** We designed the system to scale without media bandwidth bottlenecks. Video calls never route through our servers; Node.js merely authenticates mutual matches and relays SDP offers/answers over WebSocket rooms (`user:<userId>`). Heavy multipart uploads are replaced by client-direct S3 uploads, keeping our backend lightweight and cost-effective.
* **Code Reference:** `backend/src/app.js`, `frontend/src/App.js`.
* **Interviewer Follow-up:** *Why didn't you use an SFU (Selective Forwarding Unit) like mediasoup or Janus for video?*
  * **Answer:** Engaze is exclusively 1-on-1 dating. A mesh P2P WebRTC architecture requires only a single peer connection per client. SFUs are only necessary for multi-party group calls (3+ participants) or server-side stream recording. For 1-on-1 calls, P2P eliminates media server hosting costs entirely.

---

## Category 2: React 18 & Frontend Architecture

### Q2: Why did you choose React's Context API over Redux or Zustand?
* **Short Answer:** The application's state falls naturally into two clear, isolated domains: Authentication/User state (`AuthContext.jsx`) and Call/WebRTC signaling state (`DirectCallContext.jsx`). Because high-frequency video frames and audio packets are handled by the browser's native C++ WebRTC layer rather than React's virtual DOM, global state churn is minimal. Context API with `useCallback` and `useMemo` provided clean dependency injection without the boilerplate and bundle size overhead of Redux.
* **Code Reference:** `frontend/src/contexts/AuthContext.jsx`, `frontend/src/contexts/DirectCallContext.jsx`.
* **Interviewer Follow-up:** *How did you avoid unnecessary re-renders in components consuming `AuthContext`?*
  * **Answer:** We memoized callback handlers using `useCallback` and kept fast-changing UI states (like typing indicators and message input text) local to specific leaf components (`chat.jsx`), preventing whole-tree re-renders.

### Q3: How do you handle route protection and forced onboarding in the frontend?
* **Short Answer:** We implemented a custom Higher-Order Component (`withAuth.jsx`) that wraps protected route components. It verifies `isAuthenticated` and checks `user.usernameSetupCompleted`. If unauthenticated, it redirects to `/auth`. If authenticated via Google OAuth without a chosen handle, it forces redirection to `/setup-username` before any main page can render.
* **Code Reference:** `frontend/src/utils/withAuth.jsx`.

---

## Category 3: Node.js & Express Engineering

### Q4: How does the Node.js event loop handle concurrent WebRTC signaling and database writes?
* **Short Answer:** Node.js executes JavaScript on a single thread using an event loop with non-blocking libuv worker threads. WebSockets handle signaling asynchronously via event callbacks. When database operations (like saving chat messages or audit records) occur, Mongoose offloads the network I/O to libuv, allowing the main thread to continue processing real-time socket events without blocking.
* **Code Reference:** `backend/src/controllers/socketManager.js`.
* **Interviewer Follow-up:** *What happens if your Node.js process crashes? How do you ensure high availability?*
  * **Answer:** In production on Render, the service runs as a managed container that automatically restarts upon uncaught exceptions. We also implemented graceful shutdown listeners on `SIGTERM` with drain middleware that returns HTTP 503 to new traffic while finishing in-flight requests.

### Q5: Why is `app.set("trust proxy", 1)` necessary on Render?
* **Short Answer:** Render routes incoming traffic through an Nginx/Envoy reverse proxy load balancer. Without trusting the proxy, `req.ip` resolves to the local IP of the Render load balancer (`10.x.x.x`) for all users. Trusting the first hop (`1`) ensures Express reads the true client IP from the `X-Forwarded-For` header, allowing our IP-based rate limiters to function correctly.
* **Code Reference:** `backend/src/app.js` (lines 93-97).

---

## Category 4: MongoDB & Database Design

### Q6: How did you prevent race condition duplicate matches in MongoDB?
* **Short Answer:** We created a deterministic canonical pair string on the `Match` schema (`id1 < id2 ? id1_id2 : id2_id1`) and applied a compound unique index on `{ userPair: 1 }`. Even if two users swipe like concurrently, MongoDB enforces that only one document can ever exist for that pair, catching duplicate key error code `11000`.
* **Code Reference:** `backend/src/models/match.model.js` (lines 45-50).
* **Interviewer Follow-up:** *Why not use MongoDB multi-document transactions?*
  * **Answer:** While multi-document ACID transactions exist in MongoDB replica sets, they introduce latency overhead and lock contention. A deterministic canonical pair with a unique index achieves atomic idempotency at zero transactional cost.

### Q7: How do you optimize chat message queries for fast scrolling?
* **Short Answer:** We use a compound index on `{ conversation: 1, createdAt: -1, _id: -1 }` and implement cursor-based pagination. When scrolling back in time, the client requests messages older than the oldest received timestamp (`?before=<createdAt>`), avoiding expensive `.skip()` queries that degrade on large collections.
* **Code Reference:** `backend/src/models/message.model.js`, `backend/src/controllers/chat.controller.js`.

---

## Category 5: Real-Time Communication & Socket.IO

### Q8: How does Socket.IO authenticate connections and route messages to specific users?
* **Short Answer:** Socket.IO validates the JWT during the connection handshake via `socket.handshake.auth.token`. Once verified, the socket automatically joins an isolated room named `user:<userId>`. When the backend needs to deliver a message or call alert to Bob, it simply executes `io.to("user:" + bobId).emit(...)`, regardless of how many devices Bob has connected.
* **Code Reference:** `backend/src/controllers/socketManager.js`.

### Q9: How do you scale Socket.IO across multiple server instances?
* **Short Answer:** By integrating `@socket.io/redis-adapter`. When Server A emits an event to room `user:Bob`, the adapter publishes the message across a Redis Pub/Sub channel. Server B intercepts the publication and delivers the payload to Bob's local socket.
* **Code Reference:** `backend/src/services/socketRedisAdapter.service.js`.

---

## Category 6: WebRTC & Video Calling

### Q10: Walk me through the WebRTC connection establishment in Engaze.
* **Short Answer:** 
  1. Caller acquires media via `getUserMedia()`.
  2. Caller emits `call:initiate` over Socket.IO; server validates mutual match and alerts callee.
  3. Callee accepts; server stops ringtones and signals caller to start.
  4. Caller creates an `RTCPeerConnection`, calls `createOffer()`, sets local description, and transmits the SDP offer over Socket.IO.
  5. Callee sets remote description, calls `createAnswer()`, sets local description, and returns the SDP answer over Socket.IO.
  6. Both peers gather and exchange ICE candidates via `onicecandidate`.
  7. Once candidate pairs are verified, an encrypted direct P2P DTLS/SRTP tunnel opens, and remote video renders in `<video autoPlay playsInline />`.
* **Code Reference:** `frontend/src/contexts/DirectCallContext.jsx`, `backend/src/controllers/socketManager.js`.

### Q11: What happens if two peers cannot establish a direct P2P connection due to restrictive NATs?
* **Short Answer:** They fall back to a **TURN (Traversal Using Relays around NAT)** relay server. Our client requests ICE server configurations from `GET /api/v1/webrtc/ice-servers`, which provides both Google public STUN servers for standard NAT mapping and authenticated TURN servers to relay encrypted packets when symmetric NATs block UDP hole punching.
* **Code Reference:** `backend/src/config/webrtc.js`.

---

## Category 7: AWS S3 & Direct Media Storage

### Q12: Why use presigned URLs instead of uploading images directly to your Express server?
* **Short Answer:** Uploading 5MB images through Express consumes server memory buffers, blocks the Node.js event loop with multi-megabyte I/O streaming, and doubles bandwidth costs. Presigned URLs delegate the binary transfer directly from the client to AWS S3. The backend only generates an authorized URL, reducing server memory usage to near zero.
* **Code Reference:** `backend/src/services/s3Signer.service.js`, `frontend/src/utils/photoUpload.js`.

### Q13: How do you verify an image was actually uploaded to S3 before updating MongoDB?
* **Short Answer:** We implement an explicit confirmation step (`POST /api/v1/users/profile/photo/confirm`). The backend verifies that the object key starts with `photos/{userId}/` and executes an **AWS S3 HEAD request**. Only after S3 responds with HTTP 200 confirming the file exists and is non-empty does the server write the photo URL to the user's MongoDB document.
* **Code Reference:** `backend/src/controllers/photoUpload.controller.js`.

---

## Category 8: Capacitor & Android Native Engineering

### Q14: How does Capacitor differ from React Native? Why choose Capacitor for Engaze?
* **Short Answer:** React Native interprets JavaScript into native platform UI widgets (e.g. `UIView`, `android.widget`), requiring specialized bridge architectures. Capacitor packages the existing web application into a hardware-accelerated Android `WebView`, allowing 100% code reuse of our React 18 DOM components, CSS, and WebRTC APIs while providing a Java bridge for native Android features like Firebase Cloud Messaging and notification channels.
* **Code Reference:** `frontend/capacitor.config.json`, `frontend/android/app/src/main/java/com/engaze/date/MainActivity.java`.

### Q15: How did you fix the Google Play Protect "Harmful app blocked" warning on your APK?
* **Short Answer:** Google Play Protect flags sideloaded APKs that request dangerous permissions or contain self-installing bytecode. We removed `REQUEST_INSTALL_PACKAGES` from `AndroidManifest.xml` and eliminated the internal native byte-streaming installer from `MainActivity.java`. Instead, we implemented a browser-delegated update flow that opens GitHub Releases via an Android `ACTION_VIEW` intent, allowing the verified system browser to manage the download cleanly.
* **Code Reference:** `frontend/src/components/AppUpdateChecker.jsx`, `frontend/android/app/src/main/AndroidManifest.xml`.

---

## Category 9: Security & Reliability

### Q16: How do you prevent credential stuffing and brute-force attacks on your login endpoint?
* **Short Answer:** We implemented dual-tier rate limiting using `express-rate-limit`:
  1. `loginIpLimiter`: Restricts login attempts to 20 per 15-minute window per IP address.
  2. `loginAccountLimiter`: Keyed by username/email, restricting attempts to 10 per 15-minute window per account, preventing distributed bot attacks rotating across proxy IPs.
* **Code Reference:** `backend/src/middlewares/rateLimiter.middleware.js`.

### Q17: What prevents an attacker from uploading a malicious `.exe` disguised as `.jpg` to S3?
* **Short Answer:** We enforce a 3-layer security check:
  1. Frontend extension and MIME normalization (`photoUpload.js`).
  2. Server-side S3 presigned URL constraints: S3 rejects any upload where the binary's `Content-Type` differs from the signed header.
  3. Server-side **binary magic-byte inspection** (`imageValidation.service.js`) checking the actual file header bytes (`0xFF, 0xD8, 0xFF` for JPEG, `0x89, 0x50, 0x4E...` for PNG).
* **Code Reference:** `backend/src/services/imageValidation.service.js`.
