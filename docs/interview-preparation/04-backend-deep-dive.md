# 04. Backend Deep Dive — Engaze

## Overview & Directory Topology

The Engaze backend is engineered with **Node.js 22 LTS** and **Express 4** utilizing native ECMAScript Modules (`"type": "module"`). It operates as a unified API server and Socket.IO real-time signaling engine with strict production failsafes, distributed state adapters, and comprehensive security hardening.

```
backend/src/
├── config/                         # Configuration singletons & environment validators
│   ├── cors.js                     # Strict origin allowlist & CORS configuration
│   ├── database.js                 # MongoDB connection options & pool settings
│   ├── jwt.js                      # JWT signing secret resolution & production validation
│   ├── queue.js                    # BullMQ job queue definitions
│   ├── redis.js                    # Redis feature flag validators & configuration
│   └── webrtc.js                   # STUN/TURN ICE server credentials
├── controllers/                    # HTTP Route handlers & orchestration
│   ├── call.controller.js          # Call audit logging, history & missed call counts
│   ├── chat.controller.js          # Conversation feeds, messaging & unread counts
│   ├── deviceToken.controller.js   # FCM push token registration & cleanup
│   ├── discovery.controller.js     # Profile browsing feed, swipe actions, likes-you
│   ├── matchRequest.controller.js  # Consent-based match requests (send/accept/decline)
│   ├── moderation.controller.js    # Reports, user bans, suspensions, reinstatements
│   ├── notification.controller.js  # Notification feeds, read states, unread counts
│   ├── photoUpload.controller.js   # Presigned URL generation & upload confirmation
│   ├── randomCallManager.js        # Redis/In-memory speed-dating matchmaking queue
│   ├── safety.controller.js        # User block, unblock, report, unmatch handlers
│   ├── socketManager.js            # Core Socket.IO server, chat & direct 1-on-1 calls
│   ├── user.controller.js          # Auth (register, login, google), profile, privacy
│   ├── userSearch.controller.js    # Instagram-style user search & public profiles
│   └── webrtc.controller.js        # ICE server distribution & diagnostics
├── middlewares/                    # Request interception pipeline
│   ├── auth.middleware.js          # JWT verification, moderator check, account status
│   └── rateLimiter.middleware.js   # Multi-tier IP and account-based rate limiters
├── models/                         # Mongoose 8 database schemas & indexes
│   ├── block.model.js              # Bidirectional blocking records
│   ├── call.model.js               # Historical call records & durations
│   ├── conversation.model.js       # 1-to-1 conversation metadata & lastMessage
│   ├── deviceToken.model.js        # User FCM device push tokens
│   ├── match.model.js              # Canonical pair mutual match records
│   ├── matchRequest.model.js       # Outgoing/incoming consent requests
│   ├── meeting.model.js            # Video meeting room records
│   ├── message.model.js            # Chat messages with soft-delete & readBy arrays
│   ├── notification.model.js       # User in-app notifications
│   ├── report.model.js             # User abuse reports & moderation status
│   ├── swipe.model.js              # Swipes (like/pass) with unique compound index
│   └── user.model.js               # User accounts, age verification, preferences
├── serializers/                    # Data Transfer Objects (DTO) & sanitizers
│   └── profile.serializer.js       # Strips email, tokens, passwords, and private flags
├── services/                       # Business logic, third-party APIs & drivers
│   ├── appVersion.service.js       # In-app update manifest generator
│   ├── eligibility.service.js      # Strict age (18+) & profile completeness policy
│   ├── fcm.service.js              # Firebase Cloud Messaging push dispatch
│   ├── imageValidation.service.js  # Magic-byte detection & metadata stripping
│   ├── matching.service.js         # Canonical pairing & match creation logic
│   ├── notification.service.js     # In-app notification creation
│   ├── presence.service.js         # Online status & privacy-aware last seen
│   ├── queue.service.js            # BullMQ background task queue
│   ├── randomMatchmakingRedis.js   # Atomic Redis-backed random matching
│   ├── rateLimitRedis.service.js   # Redis rate limit store
│   ├── redis.service.js            # Core ioredis client singleton & reconnection
│   ├── s3Signer.service.js         # Zero-dependency AWS SigV4 signer
│   ├── safety.service.js           # Bidirectional block validation queries
│   ├── socketRedisAdapter.service.js # @socket.io/redis-adapter cross-node pub/sub
│   └── storage.service.js          # Storage adapter factory (S3 / R2 / DevMock)
├── utils/                          # Pure helper functions
│   ├── queryHelper.js              # Safe lean queries & projection helpers
│   ├── socketValidator.js          # Socket payload sanitizer & rate limiter
│   └── usernameValidator.js        # Regex validation for usernames
├── workers/                        # Standalone background queue workers
│   └── mediaCleanup.worker.js      # Purges orphaned S3 images & temp files
└── app.js                          # Application entry point, server startup & shutdown
```

---

## 1. Server Lifecycle, Middleware Pipeline & Graceful Shutdown

### Entry Point (`src/app.js`)
* **Environment Bootstrapping:** Loads `.env` via `dotenv` with path resolution compatible with ESM modules (`fileURLToPath(import.meta.url)`).
* **Startup Failsafes:**
  ```javascript
  validateJwtConfig({ exitOnError: true });
  ```
  Immediately aborts server boot in production if `JWT_SECRET` is missing, shorter than 32 characters, or uses known insecure development placeholders (`"your_jwt_secret"`, `"secret123"`).
* **Reverse Proxy Trust:**
  ```javascript
  app.set("trust proxy", 1);
  ```
  Configured specifically for Render's edge load balancer topology. Ensures Express resolves client IP from Render's trusted first `X-Forwarded-For` hop without blindly accepting spoofed client headers.
* **Payload Size Constraints:**
  ```javascript
  app.use(express.json({ limit: "40kb" }));
  app.use(express.urlencoded({ limit: "40kb", extended: true }));
  ```
  Restricts incoming JSON body sizes to 40 KB. Prevents memory exhaustion attacks via oversized request bodies. (Binary uploads are streamed directly to AWS S3 and bypass Express entirely).
* **Graceful Shutdown & Drain Middleware:**
  ```javascript
  let isShuttingDown = false;
  app.use((req, res, next) => {
    if (isShuttingDown && !isHealthCheck(req.path)) {
      res.set("Connection", "close");
      return res.status(503).json({ status: "shutting_down", message: "Server shutting down." });
    }
    next();
  });
  ```
  Upon `SIGTERM` / `SIGINT`, sets `isShuttingDown = true`. Rejects new application traffic with `503 Service Unavailable`, completes in-flight requests within a 15-second grace window, closes MongoDB connections, flushes Redis clients, and shuts down the HTTP server cleanly.

---

## 2. Security Middleware & Rate Limiting

### Strict CORS Policy (`src/config/cors.js`)
* Disallows wildcards (`*`). Uses an exact-match allowlist:
  ```javascript
  const ALLOWED_ORIGINS = [
    "https://www.engaze.date",
    "https://engaze.date",
    "https://engaze-com.vercel.app",
    "https://localhost",       // Capacitor Android scheme
    "capacitor://localhost",   // Capacitor iOS scheme
    "http://localhost:3000"    // Local React development
  ];
  ```

### Dual-Tier Rate Limiting (`src/middlewares/rateLimiter.middleware.js`)
To defeat credential stuffing, distributed brute-force, and bot automation, Engaze implements multiple layers of rate limiters:

| Limiter Name | Scope | Limit | Window | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `globalApiLimiter` | IP | 600 req | 15 mins | Baseline protection across all `/api/v1/*` routes |
| `loginIpLimiter` | IP | 20 req | 15 mins | Prevents distributed credential stuffing against `/login` |
| `loginAccountLimiter`| Account | 10 req | 15 mins | Keyed by username/email; stops password guessing on a single account |
| `registerLimiter` | IP | 10 req | 60 mins | Prevents automated account creation spam |
| `swipeLimiter` | User ID | 120 req | 1 min | Throttles automated bots from swiping through entire feeds |
| `photoUploadLimiter` | User ID | 15 req | 15 mins | Prevents S3 presigned URL generation abuse |
| `userSearchLimiter` | User ID | 60 req | 1 min | Protects database search queries against scraping |

---

## 3. Comprehensive REST API Reference Table

### A. Authentication & User Management (`/api/v1/users`)

| Method | Endpoint | Auth Required | Purpose | Request Payload | Response Structure | Controller |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/users/register` | No | Creates new account with password hash | `{ name, username, password }` | `{ success: true, token, user }` | `user.controller.js` |
| `POST` | `/api/v1/users/login` | No | Authenticates user credentials | `{ username, password }` | `{ success: true, token, user }` | `user.controller.js` |
| `POST` | `/api/v1/users/google-login` | No | Verifies Google ID token | `{ token: "<google_jwt>" }` | `{ success: true, token, user }` | `user.controller.js` |
| `GET` | `/api/v1/users/profile/me` | Yes (`protect`) | Fetches authenticated user profile | None | `{ success: true, profile: { ... } }` | `user.controller.js` |
| `PUT` | `/api/v1/users/profile/me` | Yes (`protect`) | Updates bio, interests, preferences | `{ bio, interests, datingPreferences, dob, gender }` | `{ success: true, profile: { ... } }` | `user.controller.js` |
| `GET` | `/api/v1/users/check-username` | Optional | Real-time username availability check | Query: `?username=alice` | `{ available: true, normalized: "alice" }` | `user.controller.js` |
| `POST` | `/api/v1/users/setup-username` | Yes (`protect`) | Sets username for Google OAuth users | `{ username: "alice_date" }` | `{ success: true, user }` | `user.controller.js` |
| `GET` | `/api/v1/users/search` | Yes (`protect`) | Debounced user handle search | Query: `?q=alex&limit=10` | `{ success: true, users: [...] }` | `userSearch.controller.js` |
| `POST` | `/api/v1/users/profile/photo/upload-url` | Yes (`protect`) | Generates AWS SigV4 presigned PUT URL | `{ filename, contentType, fileSize, targetIndex }` | `{ uploadUrl, key, publicUrl }` | `photoUpload.controller.js` |
| `POST` | `/api/v1/users/profile/photo/confirm` | Yes (`protect`) | Confirms S3 upload & verifies HEAD | `{ key, targetIndex }` | `{ success: true, photos, publicUrl }` | `photoUpload.controller.js` |
| `DELETE` | `/api/v1/users/profile/photo/:photoIndex` | Yes (`protect`) | Removes photo & deletes from S3 | None | `{ success: true, photos }` | `photoUpload.controller.js` |
| `POST` | `/api/v1/users/device-token` | Yes (`protect`) | Registers FCM push token | `{ token, platform: "android" }` | `{ success: true }` | `deviceToken.controller.js` |

---

### B. Discovery & Matching (`/api/v1/discovery`, `/api/v1/matches`)

| Method | Endpoint | Auth Required | Purpose | Request Payload | Response Structure | Controller |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/discovery` | Yes (18+) | Paginated discovery card deck | Query: `?page=1&limit=10` | `{ success: true, profiles: [...] }` | `discovery.controller.js` |
| `POST` | `/api/v1/discovery/swipe` | Yes (18+) | Like or pass a profile card | `{ toUserId: "...", action: "like"\|"pass" }` | `{ success: true, matchCreated: boolean }` | `discovery.controller.js` |
| `GET` | `/api/v1/discovery/likes-you` | Yes (18+) | Profiles who liked current user | None | `{ success: true, profiles: [...] }` | `discovery.controller.js` |
| `POST` | `/api/v1/discovery/reset` | Yes (18+) | Clears passed swipes to restore feed | None | `{ success: true, message: "Swipes reset" }`| `discovery.controller.js` |
| `POST` | `/api/v1/matches/requests` | Yes (18+) | Sends direct match request | `{ targetUserId: "..." }` | `{ success: true, request }` | `matchRequest.controller.js`|
| `POST` | `/api/v1/matches/requests/:id/accept` | Yes (18+) | Accepts match request & creates chat | None | `{ success: true, match, conversationId }`| `matchRequest.controller.js`|
| `GET` | `/api/v1/matches` | Yes (18+) | Returns list of mutual matches | Query: `?page=1&limit=20` | `{ success: true, matches: [...] }` | `discovery.controller.js` |
| `POST` | `/api/v1/matches/:matchId/unmatch`| Yes (`protect`) | Unmatches user & archives chat | `{ reason }` | `{ success: true }` | `safety.controller.js` |

---

### C. Chat & Messaging (`/api/v1/conversations`)

| Method | Endpoint | Auth Required | Purpose | Request Payload | Response Structure | Controller |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/conversations` | Yes (18+) | Returns active conversation list | None | `{ success: true, conversations: [...] }` | `chat.controller.js` |
| `GET` | `/api/v1/conversations/unread-count` | Yes (18+) | Returns total unread messages badge | None | `{ success: true, unreadCount, conversationsUnread }` | `chat.controller.js` |
| `GET` | `/api/v1/conversations/:id/messages` | Yes (18+) | Paginated chat message history | Query: `?before=<createdAt>&limit=50` | `{ success: true, messages: [...] }` | `chat.controller.js` |
| `PUT` | `/api/v1/conversations/:id/read` | Yes (18+) | Marks all messages in chat as read | None | `{ success: true, readCount }` | `chat.controller.js` |
| `DELETE`| `/api/v1/conversations/:cId/messages/:mId/me` | Yes (18+) | Soft delete message for self | None | `{ success: true }` | `chat.controller.js` |
| `DELETE`| `/api/v1/conversations/:cId/messages/:mId/everyone` | Yes (18+) | Delete message for everyone (sender only)| None | `{ success: true }` | `chat.controller.js` |

---

### D. WebRTC, Calls & Safety (`/api/v1/webrtc`, `/api/v1/calls`, `/api/v1/safety`)

| Method | Endpoint | Auth Required | Purpose | Request Payload | Response Structure | Controller |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/webrtc/ice-servers` | Yes (`protect`) | Returns secure STUN/TURN ICE config | None | `{ iceServers: [...] }` | `webrtc.controller.js` |
| `GET` | `/api/v1/calls/history` | Yes (18+) | Paginated audio/video call log | Query: `?page=1&limit=20` | `{ success: true, calls: [...] }` | `call.controller.js` |
| `GET` | `/api/v1/calls/missed-count` | Yes (18+) | Unseen missed calls counter | None | `{ success: true, count: number }` | `call.controller.js` |
| `POST` | `/api/v1/calls/mark-seen` | Yes (18+) | Clears missed call badge | None | `{ success: true }` | `call.controller.js` |
| `POST` | `/api/v1/safety/block` | Yes (`protect`) | Blocks user & severs matches/calls | `{ targetUserId }` | `{ success: true }` | `safety.controller.js` |
| `POST` | `/api/v1/safety/report` | Yes (`protect`) | Files report for moderation review | `{ reportedUserId, reason, details }`| `{ success: true, reportId }` | `safety.controller.js` |

---

### E. System Health & In-App Update (`/health`, `/api/v1/app-version`)

| Method | Endpoint | Auth Required | Purpose | Response Structure |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/health` / `/livez` | No | Liveness probe: verifies process is running | `{ status: "ok", uptime: 1240, timestamp }` |
| `GET` | `/readyz` / `/api/v1/health/ready` | No | Readiness probe: checks MongoDB & Redis connectivity | `{ status: "healthy", ready: true, database: "connected", redis: "connected" }` |
| `GET` | `/api/v1/app-version` | No | Checks latest Android APK release metadata | `{ latestVersion: "1.0.3", latestVersionCode: 4, forceUpdate: false, apkDownloadUrl }` |
