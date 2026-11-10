# 02. System Architecture — Engaze

## Architectural Paradigm & Global Topography

Engaze is architectured around a **Decoupled Three-Plane Model**:
1. **Control / Persistence Plane:** Stateless HTTP REST API endpoints managing user onboarding, profile updates, discovery feeds, matching algorithms, safety blocks/reports, and database writes.
2. **Real-Time Signaling & Presence Plane:** Bi-directional persistent WebSocket connections (Socket.IO) managing instant messaging, typing telemetry, read receipts, active user presence, and WebRTC call negotiation.
3. **Decentralized Direct Media Plane:** Zero-server-bandwidth media exchange. High-definition video/audio is transported strictly peer-to-peer (P2P) between browsers via WebRTC; binary image assets stream directly from client to AWS S3 using presigned URLs.

---

## 1. Complete System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Tier"]
        WebBrowser["Web Client (React 18 SPA)\nHosted on Vercel Edge"]
        AndroidApp["Mobile Client (Capacitor 8 APK)\nAndroid WebView + Native Java Bridge"]
    end

    subgraph CDN_Gateway["Ingress & Edge Tier"]
        VercelCDN["Vercel Global Edge Network\n(SSL, Static Cache, Route Fallbacks)"]
        RenderProxy["Render Reverse-Proxy Load Balancer\n(TLS Termination, Port Mapping)"]
    end

    subgraph BackendApp["Application Tier (Node.js 22 LTS / Express 4)"]
        ExpressRouter["Express API Router (/api/v1/*)\n(Auth, CORS, Rate Limiters)"]
        SocketIOServer["Socket.IO Gateway Cluster\n(JWT Handshake, Auth Rooms)"]
        SigV4Signer["AWS SigV4 Signer Service\n(Time-limited Presigned PUT/GET)"]
        PresenceService["Presence & State Manager\n(Online/LastSeen/Privacy Rules)"]
        MatchEngine["Matching & Consent Service\n(Swipes, Requests, Unmatched)"]
    end

    subgraph DistributedState["Distributed State & Caching Tier"]
        RedisCluster["Redis 7 / Memory Fallback\n- Presence Hash Table\n- Random Matchmaking Queue\n- Distributed Rate Limits\n- BullMQ Job Queue"]
    end

    subgraph DatabaseTier["Persistence Tier"]
        MongoDBAtlas[("MongoDB Atlas Replica Set\n- Users & Preferences\n- Matches & Swipes\n- Conversations & Messages\n- Call Audit Records")]
    end

    subgraph CloudServices["External Cloud & Media Services"]
        AWSS3[("AWS S3 Object Bucket\n- Profile Photos\n- Direct Presigned PUTs\n- Strict CORS Policies")]
        GoogleFCM["Firebase Cloud Messaging (FCM)\n(Push Alerts, Call Ringtones)"]
        GoogleSTUN["Google Public STUN Servers\n(NAT Traversal, ICE Gathering)"]
    end

    %% Network Flows
    WebBrowser -->|HTTPS Static Fetch| VercelCDN
    AndroidApp -->|Local Bundle Load| AndroidApp
    WebBrowser -->|HTTPS API Requests| RenderProxy
    AndroidApp -->|HTTPS API Requests| RenderProxy
    RenderProxy --> ExpressRouter
    
    WebBrowser <-->|WSS Socket.IO| SocketIOServer
    AndroidApp <-->|WSS Socket.IO| SocketIOServer

    ExpressRouter --> PresenceService
    ExpressRouter --> MatchEngine
    ExpressRouter --> SigV4Signer
    ExpressRouter --> MongoDBAtlas

    SocketIOServer <--> RedisCluster
    SocketIOServer --> MongoDBAtlas
    SocketIOServer --> GoogleFCM

    WebBrowser -.->|Direct Binary PUT| AWSS3
    AndroidApp -.->|Direct Binary PUT| AWSS3

    WebBrowser <-->|Direct P2P Video/Audio| AndroidApp
    WebBrowser <-->|STUN Binding Requests| GoogleSTUN
    AndroidApp <-->|STUN Binding Requests| GoogleSTUN
```

---

## 2. Frontend-to-Backend Request Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client App
    participant Interceptor as Axios Request Interceptor
    participant RateLimiter as Express RateLimiter (express-rate-limit / Redis)
    participant AuthMiddleware as Auth Middleware (protect)
    participant Controller as Express Controller
    participant Service as Domain Service Layer
    participant Mongo as MongoDB Atlas

    User->>Interceptor: Invokes API Action (e.g. getDiscoveryProfiles())
    Note over Interceptor: Reads token from localStorage<br/>Injects Authorization: Bearer <token>
    Interceptor->>RateLimiter: HTTP GET /api/v1/discovery
    
    alt Rate Limit Exceeded
        RateLimiter-->>User: HTTP 429 Too Many Requests (Retry-After header)
    else Rate Limit OK
        RateLimiter->>AuthMiddleware: Passes Request
        
        alt Token Missing or Invalid
            AuthMiddleware-->>User: HTTP 401 Unauthorized
            Note over User: Axios Response Interceptor purges token<br/>Redirects to /auth
        else Token Valid (Active User)
            AuthMiddleware->>Controller: Decodes req.user payload
            Controller->>Service: checkUserEligibility(req.user)
            
            alt User Under 18 or Profile Incomplete
                Service-->>User: HTTP 403 Forbidden (Eligibility Required)
            else Eligible User
                Service->>Mongo: Execute Compound Query (Excludes passes/blocks)
                Mongo-->>Service: Hydrated Documents
                Service->>Controller: Sanitized Profile DTOs
                Controller-->>User: HTTP 200 OK { success: true, profiles: [...] }
            end
        end
    end
```

---

## 3. Real-Time Communication Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Sender)
    participant ClientSocketA as Alice Socket.IO Client
    participant ServerSocket as Node.js Socket.IO Server
    participant RedisPubSub as Redis Adapter (Pub/Sub)
    participant Mongo as MongoDB Atlas
    participant FCM as Firebase Admin SDK
    participant ClientSocketB as Bob Socket.IO Client
    actor Bob as Bob (Receiver)

    Note over ClientSocketA,ServerSocket: Socket Handshake authenticated with JWT query token
    ServerSocket->>ServerSocket: socket.join('user:Alice_ID')
    
    Alice->>ClientSocketA: Submits chat message: "Hey, are you free for a call?"
    ClientSocketA->>ServerSocket: socket.emit('chat:send', { conversationId, content, clientTempId })
    
    ServerSocket->>ServerSocket: Validate payload (isPlainObject, length <= 2000)
    ServerSocket->>ServerSocket: Check Socket Rate Limit (Anti-Flood)
    ServerSocket->>Mongo: Save Message { conversation, sender: Alice, content, readBy: [Alice] }
    Mongo-->>ServerSocket: Stored Message Document (_id, createdAt)
    
    ServerSocket->>ServerSocket: Update Conversation lastMessage & lastMessageAt
    
    par Real-Time Broadcast
        ServerSocket->>ClientSocketA: socket.emit('chat:message-sent', { clientTempId, message: savedMsg })
        ServerSocket->>RedisPubSub: Publish message to channel 'user:Bob_ID'
        RedisPubSub->>ClientSocketB: io.to('user:Bob_ID').emit('chat:new-message', savedMsg)
        ClientSocketB->>Bob: Display message bubble & increment unread badge
    and Push Fallback (if Bob Backgrounded / Offline)
        ServerSocket->>FCM: Check if Bob has active FCM device token
        FCM-->>Bob: High-priority Push Notification: "Alice: Hey, are you free..."
    end

    Bob->>ClientSocketB: Opens conversation window
    ClientSocketB->>ServerSocket: socket.emit('chat:read', { conversationId })
    ServerSocket->>Mongo: Update messages SET readBy $addToSet Bob_ID
    ServerSocket->>ClientSocketA: io.to('user:Alice_ID').emit('chat:messages-read', { conversationId, readBy: Bob_ID })
    ClientSocketA->>Alice: Updates tick marks to double-blue read receipts
```

---

## 4. Video/Audio Calling Flow Diagram (Signaling + WebRTC P2P)

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Alice (Caller)
    participant CallerPeer as Alice RTCPeerConnection
    participant ServerSocket as Socket.IO Signaling Server
    participant Mongo as MongoDB (Call Audit)
    participant CalleePeer as Bob RTCPeerConnection
    actor Callee as Bob (Callee)

    Alice->>Caller: Taps "Start Video Call"
    Caller->>Caller: navigator.mediaDevices.getUserMedia({ video, audio })
    Caller->>ServerSocket: socket.emit('call:initiate', { targetUserId: Bob_ID, callType: 'video' })
    
    ServerSocket->>Mongo: Verify mutual match between Alice & Bob
    ServerSocket->>ServerSocket: Check active call registry (Neither Alice nor Bob busy)
    ServerSocket->>Mongo: Create Call record { callId, caller: Alice, receiver: Bob, status: 'ringing' }
    
    par Ringing Alerts
        ServerSocket->>Caller: socket.emit('call:ringing', { callId })
        Caller->>Caller: RingtoneEngine.startRing('outgoing')
    and Incoming Call Event
        ServerSocket->>Callee: io.to('user:Bob_ID').emit('call:incoming', { callId, caller: AliceInfo })
        Callee->>Callee: RingtoneEngine.startRing('incoming') + Native FullScreen Intent
    end

    Callee->>Bob: Taps "Accept Call"
    Bob->>Callee: navigator.mediaDevices.getUserMedia({ video, audio })
    Callee->>ServerSocket: socket.emit('call:accept', { callId })
    
    ServerSocket->>Caller: socket.emit('call:accepted', { callId })
    ServerSocket->>Mongo: Update Call status: 'connected', answeredAt: Date.now()
    Caller->>Caller: RingtoneEngine.stop()
    Callee->>Callee: RingtoneEngine.stop()

    Note over CallerPeer,CalleePeer: WebRTC SDP Offer / Answer Handshake via Socket.IO
    Caller->>CallerPeer: createOffer() -> setLocalDescription(offer)
    Caller->>ServerSocket: socket.emit('call:signal', { targetUserId: Bob_ID, signal: { type: 'offer', sdp } })
    ServerSocket->>Callee: socket.emit('call:signal', { senderUserId: Alice_ID, signal: offer })
    Callee->>CalleePeer: setRemoteDescription(offer)
    Callee->>CalleePeer: createAnswer() -> setLocalDescription(answer)
    Callee->>ServerSocket: socket.emit('call:signal', { targetUserId: Alice_ID, signal: { type: 'answer', sdp } })
    ServerSocket->>Caller: socket.emit('call:signal', { senderUserId: Bob_ID, signal: answer })
    Caller->>CallerPeer: setRemoteDescription(answer)

    Note over CallerPeer,CalleePeer: Trickle ICE Candidate Exchange via Socket.IO
    CallerPeer->>ServerSocket: socket.emit('call:signal', { signal: { candidate: ICE_Alice } })
    ServerSocket->>CalleePeer: addIceCandidate(ICE_Alice)
    CalleePeer->>ServerSocket: socket.emit('call:signal', { signal: { candidate: ICE_Bob } })
    ServerSocket->>CallerPeer: addIceCandidate(ICE_Bob)

    Note over CallerPeer,CalleePeer: Direct P2P Media Tunnel Established (DTLS / SRTP)
    CallerPeer<<-->>CalleePeer: Encrypted VP8/H.264 Video + Opus Audio Streams (Zero Server Bandwidth)

    Alice->>Caller: Taps "End Call"
    Caller->>ServerSocket: socket.emit('call:end', { callId, reason: 'completed' })
    ServerSocket->>Callee: socket.emit('call:ended', { callId, reason: 'completed' })
    ServerSocket->>Mongo: Finalize Call status: 'completed', endedAt, durationSeconds
    Caller->>CallerPeer: close() & stopLocalMedia()
    Callee->>CalleePeer: close() & stopLocalMedia()
```

---

## 5. Profile Photo Direct S3 Upload Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Client as Frontend Browser / App (photoUpload.js)
    participant Backend as Express Backend API (s3Signer.service.js)
    participant S3 as AWS S3 Object Storage
    participant DB as MongoDB Atlas

    User->>Client: Selects Image file (e.g. avatar.png)
    Client->>Client: Client-Side Pre-validation:<br/>1. Extension allowlist (.jpg, .jpeg, .png, .webp)<br/>2. Size <= 5MB<br/>3. MIME Normalization -> "image/png"

    Client->>Backend: POST /api/v1/users/profile/photo/upload-url<br/>{ filename: "avatar.png", contentType: "image/png", fileSize: 1048576, targetIndex: 0 }
    
    Note over Backend: Authenticates user session<br/>Validates MIME type & payload bounds<br/>Derives safe object key: photos/{userId}/{uuid}.png<br/>Generates AWS SigV4 Presigned PUT URL (15 min TTL)
    
    Backend-->>Client: HTTP 200 OK { uploadUrl: "https://bucket.s3.amazonaws.com/...", key: "...", publicUrl: "..." }

    Note over Client,S3: Direct Binary Stream (Bypasses Backend completely)
    Client->>S3: HTTP PUT uploadUrl<br/>Header: Content-Type: "image/png"<br/>Body: Raw binary blob
    
    alt S3 CORS or Signature Failure
        S3-->>Client: HTTP 403 Forbidden (OPTIONS check failed)
        Client->>User: Displays Upload Error Alert
    else S3 Upload Success
        S3-->>Client: HTTP 200 OK (with ETag header)
        
        Client->>Backend: POST /api/v1/users/profile/photo/confirm<br/>{ key: "photos/{userId}/{uuid}.png", targetIndex: 0 }
        
        Note over Backend: Backend HEAD verification:<br/>1. Verifies object key belongs to authenticated user<br/>2. Executes S3 HEAD request to confirm file exists & size matches<br/>3. Strips any previous photo key from S3 (media replacement)
        
        Backend->>DB: Updates User document: photos[0] = permanentPublicUrl
        DB-->>Backend: Updated User Document
        Backend-->>Client: HTTP 200 OK { success: true, photos: [...], publicUrl }
        Client->>User: Renders updated profile photo
    end
```

---

## Detailed Component Responsibilities & Communication

### Frontend Component Roles
* **`AuthContext.jsx`:** Houses global session credentials (token, profile, unread counters, notification listeners). Injects the Axios bearer token interceptor and automatically purges tokens upon `401 Unauthorized`.
* **`DirectCallContext.jsx`:** The central state machine managing peer connections, local/remote `MediaStream` objects, synthesized ringtones via `RingtoneEngine`, and WebRTC signaling socket handlers.
* **`photoUpload.js`:** Enforces authoritative MIME type normalization (`normalizePhotoContentType`) and manages the 3-step direct S3 upload pipeline.

### Backend Component Roles
* **`socketManager.js`:** The primary real-time gateway (1660+ lines). Authenticates incoming WebSockets via JWT query parameter, joins users to their isolated room (`user:<userId>`), coordinates chat CRUD operations, and manages direct 1-on-1 call states.
* **`randomCallManager.js`:** Manages live random video speed dating queues. Pairs waiting singles atomically, verifies mutual media readiness, and manages instant skip/next transitions.
* **`s3Signer.service.js`:** Zero-dependency implementation of AWS Signature Version 4. Computes SHA-256 HMAC authorization hashes to generate time-limited presigned PUT/GET URLs and handles S3 HEAD/DELETE requests.
* **`eligibility.service.js`:** Enforces strict community safety policies: calculates exact decimal age from `dob`, verifies adult status (18+), and ensures profile completeness before allowing discovery browsing or calling.
