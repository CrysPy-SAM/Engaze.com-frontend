# Engaze — Core System Architecture & Engineering Specifications

> **Target Audience:** Engineering Leads, System Architects, Technical Interviewers, and Developers.  
> **Production Repositories:**  
> - Frontend: [`Engaze.com-frontend`](https://github.com/CrysPy-SAM/Engaze.com-frontend)  
> - Backend: [`Enagaze.com-Backend`](https://github.com/CrysPy-SAM/Enagaze.com-Backend)  
> **Live Deployments:**  
> - Frontend: [`https://www.engaze.date/`](https://www.engaze.date/) (Vercel Edge Network)  
> - Backend API: [`https://enagaze-com-backend.onrender.com/`](https://enagaze-com-backend.onrender.com/) (Render Container Web Service)  
> - Persistence: MongoDB Atlas Managed Replica Set  
> - Media Storage: Amazon Web Services (AWS S3)  

---

## 1. Executive Architectural Philosophy: The Decoupled Three-Plane Model

Engaze is engineered under a **Decoupled Three-Plane Model** to achieve low-latency interactions, zero media-server hosting costs, and high resilience:

```
+---------------------------------------------------------------------------------------------------+
|                                      1. CONTROL & PERSISTENCE PLANE                                |
| Stateless REST APIs (Node.js 22 / Express 4) handling Auth, Onboarding, Discovery, Swipes & DB     |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                2. REAL-TIME SIGNALING & PRESENCE PLANE                             |
| Persistent Socket.IO 4.7 Gateway handling 1:1 Chat, Typing, Read Receipts, Presence & WebRTC SDP  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                    3. DECENTRALIZED DIRECT MEDIA PLANE                             |
| Zero-Server-Bandwidth: WebRTC P2P (Audio/Video over UDP) & Direct Client-to-S3 Presigned Uploads   |
+---------------------------------------------------------------------------------------------------+
```

1. **Control & Persistence Plane (REST):** Stateless HTTP endpoints manage user lifecycle, mutual consent matching algorithms, profile metadata, and safety controls (blocks/reports).
2. **Real-Time Signaling Plane (Socket.IO):** Bi-directional persistent WebSockets manage isolated user rooms (`user:<userId>`), live typing indicators, instant messaging, authoritative presence, and WebRTC handshake negotiation.
3. **Decentralized Direct Media Plane (WebRTC + S3):** Zero audio/video bytes and zero image upload binaries pass through the Express application server. High-definition video streams directly peer-to-peer between client devices via WebRTC, and profile photos stream directly from the client to AWS S3 using AWS SigV4 presigned URLs.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Tier"]
        WebClient["Web Client (React 18 SPA)\nHosted on Vercel Global Edge"]
        AndroidClient["Mobile Client (Capacitor 8 APK)\nAndroid WebView + Native Java Bridge"]
    end

    subgraph Edge["Edge & Load Balancer Tier"]
        VercelCDN["Vercel Global CDN\n(TLS, SPA Routing Rewrites, Static Cache)"]
        RenderProxy["Render Reverse-Proxy Load Balancer\n(TLS Termination, Port Mapping)"]
    end

    subgraph AppServer["Application Tier (Node.js 22 LTS / Express 4 ESM)"]
        ExpressCore["Express Core Router (/api/v1/*)\n- Global & Route-Specific Rate Limiters\n- JWT Startup Failsafe Validator\n- Graceful Shutdown Drain Middleware"]
        SocketCluster["Socket.IO Real-Time Gateway\n- Authenticated Handshake (JWT)\n- User-Isolated Rooms (user:id)\n- Presence & Privacy Filters"]
        SigV4Engine["AWS SigV4 Presigned Signer\n- Zero-Dependency Crypto Signer\n- 15-Minute Expiry Time-Limits\n- Strict MIME Normalization"]
        SafetyEngine["Community Safety & Eligibility\n- Adult Verification (Age >= 18)\n- Bidirectional Block Verification\n- Account Moderation Listeners"]
    end

    subgraph DistributedState["Distributed Caching & Queues"]
        RedisCluster["Redis 7 / In-Memory Fallback\n- Presence Hash Table\n- Atomic Random Matchmaking Queue\n- @socket.io/redis-adapter Pub/Sub\n- Distributed Rate Limit Store"]
        BullMQWorker["BullMQ Background Workers\n- Media Cleanup Worker\n- Unconfirmed Upload Pruning"]
    end

    subgraph Persistence["Database Tier"]
        MongoDBAtlas[("MongoDB Atlas Replica Set\n- User Profiles & Preferences\n- Canonical Matches (userPair UK)\n- Indexed Chat Messages & Read Receipts\n- Call Audit Records & Missed Badges")]
    end

    subgraph ExternalServices["External Cloud & P2P Media"]
        AWSS3[("AWS S3 Object Bucket\n- Direct Presigned PUTs\n- Strict Bucket CORS Policy\n- Binary Magic-Byte Inspection")]
        GoogleFCM["Firebase Cloud Messaging (FCM)\n(Push Alerts & Fullscreen Call Intents)"]
        GoogleSTUN["Google Public STUN Servers\n(NAT Traversal & ICE Candidate Discovery)"]
    end

    %% Ingress Traffic
    WebClient -->|Static Assets| VercelCDN
    AndroidClient -->|Local Bundle| AndroidClient
    WebClient -->|HTTPS REST| RenderProxy
    AndroidClient -->|HTTPS REST| RenderProxy
    RenderProxy --> ExpressCore

    %% Real-time Socket Connection
    WebClient <-->|WSS Socket.IO| SocketCluster
    AndroidClient <-->|WSS Socket.IO| SocketCluster

    %% Backend Dependencies
    ExpressCore --> SafetyEngine
    ExpressCore --> SigV4Engine
    ExpressCore --> MongoDBAtlas
    SocketCluster <--> RedisCluster
    SocketCluster --> MongoDBAtlas
    SocketCluster --> GoogleFCM
    RedisCluster <--> BullMQWorker

    %% Direct Media Flows (Bypassing Backend)
    WebClient -.->|Direct Binary PUT| AWSS3
    AndroidClient -.->|Direct Binary PUT| AWSS3
    WebClient <-->|Encrypted P2P Media (SRTP/DTLS)| AndroidClient
    WebClient <-->|STUN Binding| GoogleSTUN
    AndroidClient <-->|STUN Binding| GoogleSTUN
```

---

## 3. Technology Stack & Architectural Decision Matrix

| Layer | Selected Tech | Responsibility | Architectural Rationale & Why Chosen |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | **React 18, React Router v6, Material-UI (MUI v5)** | Client SPA, component-driven UI, responsive themes | Concurrent rendering capabilities, accessible components, and route-level code splitting (`React.lazy`) keeping initial bundle at **168 kB gzip**. |
| **Mobile Runtime** | **Capacitor 8.6, Android SDK (Java/Gradle)** | Native Android wrapper (`com.engaze.date`) | 100% web codebase reuse with native Java bridges for Android 13+ notification channels, full-screen incoming call intents, and FCM push. |
| **Backend Runtime** | **Node.js 22 LTS, Express 4 (ESM)** | API server, routing, signaling coordinator | Non-blocking event loop handles high-concurrency WebSockets and I/O. Native ES Modules (`"type": "module"`) provide clean, modern imports. |
| **Real-Time Plane** | **Socket.IO 4.7** | Persistent WebSocket gateway | Event-driven pub/sub, room multiplexing (`user:<userId>`), automatic reconnects, and seamless horizontal scaling via Redis adapter. |
| **Database** | **MongoDB Atlas, Mongoose 8 ODM** | Document persistence | Flexible schema for nested dating preferences and photo arrays. Compound indexes guarantee sub-5ms lookups for feeds and message pagination. |
| **In-Memory Cache** | **Redis 7 (`ioredis`), BullMQ 6.4** | State caching & job queues | Fast presence hashing, atomic queue popping for speed dating, distributed rate limiting, and background media cleanup with memory fallback. |
| **Object Storage** | **Amazon Web Services (AWS S3)** | Static profile photo storage | Highly durable cloud storage. Uses presigned PUT URLs to completely eliminate server memory buffering and egress bandwidth costs. |
| **P2P Audio/Video** | **WebRTC API, Google Public STUN** | Live audio/video calling | Hardware-accelerated media codecs (VP8/H.264, Opus) flowing peer-to-peer. Glass-to-glass latency under 150ms at zero media server expense. |
| **Push Alerts** | **Firebase Admin SDK (FCM)** | Background device push alerts | Wakes up mobile devices for WhatsApp-style incoming video calls, missed call badges, and offline chat alerts. |
| **Hosting & CI/CD** | **Vercel, Render, GitHub Actions** | Edge hosting, container deployment, CI/CD | Vercel Edge CDN for global web delivery; Render for auto-restarting Node.js services; GitHub Actions for automated keystore release APK signing. |

---

## 4. End-to-End Real-Time Call Architecture (Signaling vs. Media Transport)

Engaze strictly divides the responsibilities of **Signaling** (Socket.IO) and **Media Transport** (WebRTC):

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Alice (Caller)
    participant AliceApp as Alice App (DirectCallContext.jsx)
    participant Server as Node.js Socket.IO Server (socketManager.js)
    participant Mongo as MongoDB Atlas (Call Record)
    participant BobApp as Bob App (DirectCallContext.jsx)
    actor Callee as Bob (Callee)

    Note over AliceApp,BobApp: PHASE 1: Call Authorization & Ringing
    Alice->>AliceApp: Taps "Start Video Call"
    AliceApp->>AliceApp: navigator.mediaDevices.getUserMedia({ video, audio })
    AliceApp->>Server: socket.emit('call:initiate', { targetUserId: Bob_ID, callType: 'video' })

    Server->>Mongo: Verify mutual match exists between Alice & Bob
    Server->>Server: Check active call registry (Neither party is currently busy)
    Server->>Mongo: Insert Call record { callId, caller: Alice, receiver: Bob, status: 'ringing' }

    par Alert Caller & Callee
        Server-->>AliceApp: socket.emit('call:ringing', { callId })
        AliceApp->>AliceApp: RingtoneEngine.startRing('outgoing') (440Hz periodic tone)
    and High-Priority Callee Alert
        Server-->>BobApp: io.to('user:Bob_ID').emit('call:incoming', { callId, caller: AliceInfo })
        BobApp->>BobApp: RingtoneEngine.startRing('incoming') + Native Android Fullscreen Intent
    end

    Note over Server: Server sets 45-second no-answer timeout

    Note over AliceApp,BobApp: PHASE 2: Call Acceptance
    Bob->>BobApp: Taps "Accept Call"
    BobApp->>BobApp: RingtoneEngine.stop()
    BobApp->>BobApp: navigator.mediaDevices.getUserMedia({ video, audio })
    BobApp->>Server: socket.emit('call:accept', { callId })

    Server->>Mongo: Update Call status: 'connected', answeredAt: Date.now()
    Server-->>AliceApp: socket.emit('call:accepted', { callId })
    AliceApp->>AliceApp: RingtoneEngine.stop()

    Note over AliceApp,BobApp: PHASE 3: WebRTC SDP Offer / Answer Handshake via Socket.IO
    AliceApp->>AliceApp: pc = new RTCPeerConnection(iceServers)
    AliceApp->>AliceApp: localStream.getTracks().forEach(t => pc.addTrack(t, localStream))
    AliceApp->>AliceApp: const offer = await pc.createOffer()
    AliceApp->>AliceApp: await pc.setLocalDescription(offer)
    AliceApp->>Server: socket.emit('call:signal', { targetUserId: Bob_ID, signal: offer })
    Server-->>BobApp: socket.emit('call:signal', { senderUserId: Alice_ID, signal: offer })

    BobApp->>BobApp: pc = new RTCPeerConnection(iceServers)
    BobApp->>BobApp: localStream.getTracks().forEach(t => pc.addTrack(t, localStream))
    BobApp->>BobApp: await pc.setRemoteDescription(offer)
    BobApp->>BobApp: const answer = await pc.createAnswer()
    BobApp->>BobApp: await pc.setLocalDescription(answer)
    BobApp->>Server: socket.emit('call:signal', { targetUserId: Alice_ID, signal: answer })
    Server-->>AliceApp: socket.emit('call:signal', { senderUserId: Bob_ID, signal: answer })
    AliceApp->>AliceApp: await pc.setRemoteDescription(answer)

    Note over AliceApp,BobApp: PHASE 4: Trickle ICE Gathering & Direct P2P Media Tunnel
    AliceApp->>Server: Relays Alice ICE candidate via call:signal
    Server-->>BobApp: BobApp.pc.addIceCandidate(candidate)
    BobApp->>Server: Relays Bob ICE candidate via call:signal
    Server-->>AliceApp: AliceApp.pc.addIceCandidate(candidate)

    Note over AliceApp,BobApp: Encrypted P2P Media Tunnel Established (DTLS / SRTP)
    AliceApp<<-->>BobApp: Direct VP8/H.264 Video + Opus Audio Streams (Zero Server Bandwidth)

    Note over AliceApp,BobApp: PHASE 5: Clean Teardown & Hardware Lock Release
    Alice->>AliceApp: Taps "End Call"
    AliceApp->>Server: socket.emit('call:end', { callId, reason: 'completed' })
    Server->>Mongo: Finalize Call record: status: 'completed', endedAt, durationSeconds
    Server-->>BobApp: socket.emit('call:ended', { callId, reason: 'completed' })
    AliceApp->>AliceApp: stopLocalMedia() (Releases Camera/Mic) & closePeerConnection()
    BobApp->>BobApp: stopLocalMedia() (Releases Camera/Mic) & closePeerConnection()
```

---

## 5. Direct AWS S3 Photo Upload Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Client as Client Browser / Android (photoUpload.js)
    participant Backend as Express API (photoUpload.controller.js)
    participant SigV4 as Zero-Dependency Signer (s3Signer.service.js)
    participant S3 as AWS S3 Storage Bucket
    participant DB as MongoDB Atlas

    User->>Client: Chooses photo file (e.g. "avatar.png")
    Note over Client: Step 1: Client Pre-validation & Normalization<br/>- File size <= 5 MB<br/>- normalizePhotoContentType(file) -> "image/png"

    Client->>Backend: POST /api/v1/users/profile/photo/upload-url<br/>{ filename: "avatar.png", contentType: "image/png", fileSize: 1048576, targetIndex: 0 }

    Backend->>Backend: Authenticates session & checks photoUploadLimiter
    Backend->>SigV4: createPresignedPutUrl({ bucket, key: "photos/{userId}/{uuid}.png", contentType: "image/png" })
    Note over SigV4: Derives signing key from AWS_SECRET_ACCESS_KEY<br/>Computes canonical request & HMAC-SHA256 signature<br/>Constructs URL with X-Amz-Signature (15 min TTL)
    SigV4-->>Backend: Signed Presigned PUT URL
    Backend-->>Client: HTTP 200 OK { uploadUrl, key, publicUrl }

    Note over Client,S3: Step 2: Direct Binary Stream (Bypasses Backend Completely)
    Client->>S3: HTTP PUT uploadUrl<br/>Header: Content-Type: "image/png"<br/>Body: Raw binary blob

    alt S3 CORS or SigV4 Mismatch
        S3-->>Client: HTTP 403 Forbidden
        Client->>User: Displays upload failure alert
    else S3 Upload Succeeded
        S3-->>Client: HTTP 200 OK (with ETag header)

        Note over Client,Backend: Step 3: Server Verification & DB Persistence
        Client->>Backend: POST /api/v1/users/profile/photo/confirm<br/>{ key: "photos/{userId}/{uuid}.png", targetIndex: 0 }
        
        Backend->>Backend: Verifies object key belongs to authenticated user
        Backend->>S3: Executes S3 HEAD request (Verifies object exists & length > 0)
        S3-->>Backend: HTTP 200 OK (Confirmed)
        
        opt Previous Photo Existed at targetIndex
            Backend->>S3: Executes S3 DELETE previousPhotoKey (Asynchronous purge)
        end

        Backend->>DB: User.findByIdAndUpdate(userId, { "photos.0": permanentPublicUrl })
        DB-->>Backend: Updated User Document
        Backend-->>Client: HTTP 200 OK { success: true, photos: [...], publicUrl }
        Client->>User: Renders new photo in UI
    end
```

---

## 6. Persistence Architecture & Entity Relationships (MongoDB)

```mermaid
erDiagram
    USER ||--o{ SWIPE : "initiates"
    USER ||--o{ MATCH_REQUEST : "sends / receives"
    USER ||--o{ MATCH : "participates in"
    USER ||--o{ CONVERSATION : "member of"
    USER ||--o{ MESSAGE : "authors"
    USER ||--o{ CALL : "places / answers"
    USER ||--o{ DEVICE_TOKEN : "registers"
    USER ||--o{ BLOCK : "blocks / is blocked"
    USER ||--o{ REPORT : "files / receives"

    MATCH ||--|| CONVERSATION : "unlocks 1:1"
    CONVERSATION ||--o{ MESSAGE : "contains"
    CONVERSATION ||--o{ CALL : "associates with"

    USER {
        ObjectId _id PK
        string name
        string username UK
        string normalizedUsername
        string email UK "sparse"
        string password "bcrypt hash"
        string googleId UK "sparse"
        string authProvider "local | google"
        date dob "Age >= 18"
        string gender "male | female | non-binary | other"
        object datingPreferences
        string bio
        string[] photos
        string[] interests
        boolean isProfileComplete
        string status "active | suspended | banned"
        object privacySettings
        date lastSeenAt
    }

    SWIPE {
        ObjectId _id PK
        ObjectId fromUser FK
        ObjectId toUser FK
        string action "like | pass"
        date createdAt
    }

    MATCH {
        ObjectId _id PK
        ObjectId[] users FK
        string userPair UK "canonical: id1_id2"
        string status "active | unmatched"
        ObjectId unmatchedBy FK
        date unmatchedAt
    }

    CONVERSATION {
        ObjectId _id PK
        ObjectId match FK "unique: 1 per match"
        ObjectId[] participants FK
        ObjectId lastMessage FK
        date lastMessageAt
        ObjectId[] hiddenFor FK
        object[] clearedAt
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId conversation FK
        ObjectId sender FK
        string content
        string clientTempId
        ObjectId[] readBy FK
        ObjectId[] deletedFor FK
        boolean isDeletedForEveryone
        date createdAt
    }

    CALL {
        ObjectId _id PK
        string callId UK "uuid"
        ObjectId caller FK
        ObjectId receiver FK
        ObjectId conversationId FK
        string callType "video | audio"
        string status "ringing | connected | completed | missed | rejected | cancelled"
        boolean receiverAlerted
        boolean receiverSeen
        date initiatedAt
        date answeredAt
        date endedAt
        number durationSeconds
    }

    DEVICE_TOKEN {
        ObjectId _id PK
        ObjectId user FK
        string token UK
        string platform "android | ios | web"
        date lastUsedAt
    }
```

### Critical Database Optimization Techniques:
1. **Race Condition Prevention via Deterministic Canonical Pairs (`match.model.js`):**
   ```javascript
   matchSchema.statics.getCanonicalPair = function(idA, idB) {
       return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
   };
   ```
   Paired with a compound unique index on `{ userPair: 1 }`. If two users swipe like simultaneously, the second insert catches duplicate key error code `11000` without creating duplicate matches or conversations.
2. **High-Speed Message Pagination:**
   Indexed via compound key `{ conversation: 1, createdAt: -1, _id: -1 }` enabling cursor-based pagination that avoids performance degradation on deep collections.
3. **Instant Unread Count Aggregation:**
   Indexed via `{ conversation: 1, sender: 1, readBy: 1 }` allowing MongoDB to compute total unread badge counts across all chats in a single indexed query.

---

## 7. Android Native Engineering & Google Play Protect Architecture

```
+-------------------------------------------------------------------------------+
|                       REACT 18 SINGLE PAGE APPLICATION                        |
|   (DOM Components, Context API, Socket.IO Client, WebRTC RTCPeerConnection)   |
+-------------------------------------------------------------------------------+
                                    ▲
                                    │ window.EngazeNativeNotifications (JS Interface)
                                    │ CustomEvents ('nativeFcmToken', 'nativeNotificationAction')
                                    ▼
+-------------------------------------------------------------------------------+
|                       CAPACITOR BRIDGE (MainActivity.java)                     |
|   - WebView Configuration & ChromeClient       - Notification Channels Setup  |
|   - Native Ringtone & Vibrator Service         - Google OAuth Popup Dialogs   |
|   - Full-Screen Incoming Call Intents          - Browser-Delegated APK Engine |
+-------------------------------------------------------------------------------+
                                    ▲
                                    │ Android SDK & JNI Calls
                                    ▼
+-------------------------------------------------------------------------------+
|                       ANDROID OPERATING SYSTEM (Linux Kernel)                 |
|   - Camera & Microphone Drivers                - Firebase Cloud Messaging (FCM|
|   - AudioAttributes & RingtoneManager          - Local Storage & Hardware GPU |
+-------------------------------------------------------------------------------+
```

### Key Native Engineering Implementations:
1. **Capacitor Configuration (`capacitor.config.json`):**
   * Configured with `"androidScheme": "https"` and `"cleartext": false`, ensuring the WebView operates over secure modern HTTPS schemes (`https://localhost`).
2. **Google Play Protect Resolution (Browser-Delegated Update Architecture):**
   * Removed dangerous `REQUEST_INSTALL_PACKAGES` permission and deleted internal byte-streaming installer bytecode from `MainActivity.java`.
   * When an update is detected, `AppUpdateChecker.jsx` launches an `ACTION_VIEW` intent with the GitHub Releases URL, delegating downloading and installation to the verified system browser (Chrome/Firefox).
3. **Automated CI/CD Release Signing (`.github/workflows/build-apk.yml`):**
   * Decodes persistent release keystore from Base64 GitHub secret (`ENGAZE_KEYSTORE_BASE64`).
   * Validates compiled APK signature against the permanent Engaze SHA-256 fingerprint:
     `04:CA:D7:6B:10:14:E3:34:F9:26:88:5A:D1:12:78:BA:21:04:6D:A1:52:16:5B:29:D0:68:7C:9A:43:77:F9:D1`.
   * Automatically publishes verified `Engaze.apk` to GitHub Releases.

---

## 8. Security Hardening & Resilience Engineering

| Security Domain | Defense-in-Depth Implementation | Exact Source Reference |
| :--- | :--- | :--- |
| **Startup Failsafes** | Synchronously verifies `JWT_SECRET` is defined, $\ge 32$ chars, and not an insecure placeholder before database or network listeners initialize. Aborts with `process.exit(1)` in production if invalid. | `backend/src/config/jwt.js` |
| **Dual-Tier Rate Limiting** | Separates IP-based rate limiting (`loginIpLimiter`: 20 req/15 min) from account-based rate limiting (`loginAccountLimiter`: 10 req/15 min) to defeat both single-IP brute-force and distributed proxy credential stuffing. | `backend/src/middlewares/rateLimiter.middleware.js` |
| **Credential Redaction** | `formatSafeDatabaseError` catches DB exceptions and checks error names against an explicit safe allowlist, preventing connection strings or passwords from leaking into stdout/stderr. | `backend/src/app.js` |
| **Magic-Byte Inspection** | `detectMimeType` inspects the initial 12 bytes of image buffers (`0xFF, 0xD8, 0xFF` for JPEG, `0x89, 0x50, 0x4E...` for PNG), ensuring renamed executables (`.exe` renamed to `.jpg`) are rejected. | `backend/src/services/imageValidation.service.js` |
| **Hardware Lock Teardown** | `stopLocalMedia` explicitly stops all tracks on `MediaStream` upon call completion, decline, disconnect, or unmount, immediately extinguishing the green camera indicator. | `frontend/src/contexts/DirectCallContext.jsx` |
| **Cold-Start Resilience** | Global Axios client configured with a **60-second timeout** (`timeout: 60000`) and graceful retry boundaries to accommodate Render free-tier container cold boots without dropping users into error states. | `frontend/src/contexts/AuthContext.jsx` |

---

## 9. Verification & Codebase Integrity

* **Frontend Build Status:** Compiles cleanly (`npm run build`) with zero bundling errors. Production bundle size is **168.06 kB gzip**.
* **Automated Test Results:**
  * Frontend unit/integration suite: **167/167 tests passed (20 test suites)**.
  * Backend S3 storage integration suite: **42/42 tests passed (10 test suites)**.
  * Backend security hardening suite: **30/30 tests passed (5 test suites)**.
  * Backend in-app update service suite: **13/13 tests passed (4 test suites)**.
* **Code Integrity:** All architectural features documented above have been verified directly against active source files without speculative assumptions.
