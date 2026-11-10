# 01. Project Overview — Engaze

## Executive Summary & Product Vision

**Engaze** is a full-stack dating and real-time social connection platform engineered to eliminate catfishing, ghosting, and low-intent interactions through real-time communication. Unlike conventional dating applications that rely almost exclusively on asynchronous text chat and static photos, Engaze places **live, peer-to-peer WebRTC video calling and low-latency Socket.IO interactions** at the center of the user journey.

The platform provides two primary modes of connection:
1. **Consent-Based Mutual Matching & Discovery:** An Instagram/Tinder-style card discovery feed where users browse profiles, review bios and interests, and express mutual interest. Only upon a mutual match (or accepted match request) are private messaging and 1-on-1 direct video calling unlocked.
2. **Instant Live 1-on-1 Video Dating (Speed Dating):** A real-time matchmaking queue powered by Redis and Socket.IO where online singles are paired for spontaneous video conversations with mutual media consent barriers and instant skip/next capability.

---

## Core Problem Statement & Target Audience

### The Problem
* **Profile Inauthenticity & Catfishing:** Static photos on legacy apps are often outdated, heavily filtered, or completely fraudulent.
* **Ghosting & Stagnant Conversations:** Matches sit in inbox queues indefinitely without ever transitioning to actual dates.
* **High Infrastructure Costs of Media Proxies:** Streaming multi-gigabyte video or routing live video streams through proprietary backend servers introduces massive bandwidth costs and latency bottlenecks.

### The Engaze Solution
* **Zero-Media-Server WebRTC Architecture:** Video and audio streams flow strictly peer-to-peer (P2P) between client devices via encrypted SRTP/DTLS protocols. The Node.js backend serves purely as a lightweight signaling and authentication plane, keeping server bandwidth and CPU usage negligible even under scale.
* **Ephemeral S3 Direct Upload Pipeline:** High-resolution user photos bypass application servers entirely. The client requests a cryptographically signed AWS SigV4 presigned URL from the backend and streams the binary payload directly to an AWS S3 bucket, preventing backend memory saturation and slow I/O blocking.
* **Hybrid Native Mobile Distribution:** Using Capacitor 8, the identical React 18 single-page application is compiled into an Android APK (`com.engaze.date`) complete with native Firebase Cloud Messaging (FCM), high-priority notification channels, full-screen incoming call intents, and automated in-app update checks.

### Target Audience
* Digital-first adults (18+) seeking genuine, verified romantic or social connections.
* Mobile and web users requiring low-latency chat, real-time presence indicators (online/last seen), and instant live video dates without installing proprietary video conference software.

---

## Complete Technology Stack & Architectural Rationale

| Layer | Technologies Selected | Architectural Rationale & Why Chosen |
| :--- | :--- | :--- |
| **Frontend Web** | **React 18 (SPA), React Router v6, Material-UI (MUI v5), Emotion** | Component-driven architecture with Concurrent React features. MUI provides accessible, responsive themeable UI. React Router v6 handles route-level code splitting (`React.lazy`, `Suspense`) to optimize First Contentful Paint (FCP) and Time to Interactive (TTI). |
| **Mobile Runtime** | **Capacitor 8.6, Android SDK (Java/Gradle)** | Enables a single unified codebase for web and mobile. Bypasses React Native bridging overhead by running the optimized web bundle inside an Android WebView with native Java bridges for FCM push, ringtones, and notification channels. |
| **Backend API** | **Node.js 22 LTS, Express 4 (ESM)** | Event-driven, non-blocking asynchronous I/O ideal for concurrent WebRTC signaling, chat orchestration, and RESTful CRUD operations. Native ECMAScript Modules (`"type": "module"`) provide clean, standardized imports. |
| **Real-Time Plane** | **Socket.IO 4.7, Engine.IO** | Bi-directional, event-driven WebSocket abstraction with automatic HTTP long-polling fallback, room-based broadcast primitives (`io.to('user:id')`), heartbeat ping/pong keepalives, and cross-node scaling via Redis adapters. |
| **Database** | **MongoDB Atlas, Mongoose 8 ODM** | Document-oriented schema flexibility ideal for nested profiles, arrays of photos/interests, and polymorphic conversation states. Compound indexes provide sub-5ms query resolution for feeds and chat histories. |
| **Cache & Distributed Services** | **Redis (ioredis 6.0), BullMQ 6.4** | In-memory distributed store for user presence tracking, distributed rate limiting, random matchmaking atomic queues, and background media cleanup worker pipelines. Gracefully falls back to in-memory mode when unconfigured. |
| **Media & Storage** | **AWS S3, Node.js Native Crypto (SigV4)** | Highly durable, scalable object storage. Uses custom zero-dependency AWS Signature Version 4 presigned URLs for client-side direct uploads. Accompanied by strict binary magic-byte inspection (`imageValidation.service.js`). |
| **P2P Audio/Video** | **WebRTC API, Google Public STUN** | Browser-native real-time audio/video streaming with hardware-accelerated VP8/H.264 video codecs and Opus audio. Eliminates media server bandwidth costs. |
| **Security & Auth** | **JSON Web Tokens (JWT), bcryptjs, Google Auth Library** | Stateless authorization via cryptographically signed HMAC-SHA256 tokens (`Bearer <token>`). Dual-tier rate limiting (IP-based + account-based) blocks credential stuffing and brute-force attacks. |
| **Push Notifications** | **Firebase Admin SDK (FCM), Native Android Service** | Delivers high-priority data and notification messages for WhatsApp-style incoming call alerts, missed calls, and new chat messages. |
| **Cloud Hosting** | **Vercel (Frontend), Render (Backend)** | Vercel provides global Edge CDN distribution with automatic SSL. Render hosts the Node.js Docker/Web service with automated health/readiness probe monitoring and zero-downtime deploys. |

---

## Component Responsibilities

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|  Web Browser (Vercel Edge)  <------------->  Android Mobile App (Capacitor WebView)   |
|  - UI Rendering (MUI/React)                  - Native FCM Push Service                |
|  - Web Audio Ringtone Engine                 - High-Priority Call Notification Channel|
|  - Direct S3 Binary Uploads                  - Browser-Delegated Update Engine        |
|  - WebRTC PeerConnection & Media             - Fullscreen Incoming Call Handler       |
+-------------------------------------------+-------------------------------------------+
                                            | HTTPS / WSS
                                            v
+---------------------------------------------------------------------------------------+
|                                  APPLICATION TIER                                     |
|                              Node.js 22 & Express 4                                   |
|  - RESTful API Endpoints (/api/v1/*)         - Dual-Tier Rate Limiting (IP/Account)  |
|  - Socket.IO Real-Time Dispatcher            - WebRTC ICE/SDP Signaling Gateway      |
|  - JWT Authentication & Failsafes            - SigV4 Presigned URL Generator          |
|  - Profile Eligibility Policy (18+)          - Background BullMQ Media Cleanup Worker |
+---------------------+---------------------+---------------------+---------------------+
                      |                     |                     |
                      v                     v                     v
              +---------------+     +---------------+     +---------------+
              |   DATABASE    |     | CACHE / QUEUE |     | OBJECT STORE  |
              | MongoDB Atlas |     | Redis/BullMQ  |     |    AWS S3     |
              | - Users/Auth  |     | - Presence    |     | - Avatars     |
              | - Matches     |     | - Matchmaking |     | - Direct PUT  |
              | - Messages    |     | - Rate Limits |     | - Presigned   |
              | - Calls/Audit |     | - Workers     |     |   Uploads     |
              +---------------+     +---------------+     +---------------+
```

---

## Interview Elevator Pitches

### 30-Second Elevator Pitch
> *"Engaze is a full-stack real-time dating application built with React, Node.js, Socket.IO, WebRTC, and MongoDB, packaged natively for Android using Capacitor. To solve the catfishing and ghosting problems endemic to online dating, Engaze combines consent-based mutual matching with live 1-on-1 peer-to-peer video calling. Architecturally, it offloads heavy operations from the server: video streams run purely peer-to-peer via WebRTC, and photos upload directly to AWS S3 using presigned SigV4 URLs, keeping backend bandwidth and latency near zero."*

---

### 1-Minute Elevator Pitch
> *"Engaze is a dating platform designed to foster high-trust connections through real-time audio-video communication. On the frontend, I built a responsive React 18 single-page application styled with Material-UI, wrapped in Capacitor 8 for Android with native Firebase push notifications and background incoming call alerts.*
>
> *On the backend, I engineered an Express REST API and a Socket.IO real-time signaling cluster running on Node.js 22. To ensure zero media server bandwidth overhead, video calls use browser-native WebRTC peer connections negotiated over our WebSocket gateway, while profile photo uploads stream directly from the client to AWS S3 using custom-generated SigV4 presigned URLs with binary magic-byte inspection.*
>
> *For scalability and security, the system incorporates dual-tier rate limiting, Redis-backed presence tracking, and graceful fallback architectures for offline or single-instance environments. The entire platform is deployed in production across Vercel, Render, and MongoDB Atlas."*

---

### 3-Minute Architectural Deep-Dive Pitch
> *"When designing Engaze, our core engineering objective was to build a low-latency dating application that could scale without ballooning cloud infrastructure costs or sacrificing user safety. We divided the system into three decoupled operational planes: the Control/REST plane, the Real-Time Signaling plane, and the Direct Media plane.*
>
> *First, the **Control Plane** is an Express backend with MongoDB Atlas. It enforces account eligibility—such as requiring users to be verified adults (18+) with complete profiles before accessing discovery feeds—and handles authentication via bcryptjs and JWTs with strict production startup failsafes. We implemented compound indexing on critical collections—such as deterministic canonical pairs (`userIdA_userIdB`) on mutual matches and compound reverse-chronological indexes on messages—ensuring query times remain under 5ms.*
>
> *Second, the **Real-Time Signaling Plane** uses Socket.IO. We implemented a room-based pub/sub architecture where every user joins an authenticated personal room (`user:<userId>`). This allows our backend to emit targeted events—such as chat messages, typing indicators, read receipts, and incoming call alerts—across distributed nodes using an optional Redis pub/sub adapter. When an incoming video call is initiated, the caller's client sends a signaling request. The server verifies mutual match authorization, alerts the callee via WebSocket and high-priority FCM push notifications, and mediates the SDP Offer/Answer and ICE candidate exchange.*
>
> *Third, the **Direct Media Plane** is completely decentralized. Rather than funneling high-bandwidth video streams through our servers, the client devices establish direct peer-to-peer DTLS/SRTP tunnels using WebRTC. Similarly, for user photos, we eliminated multipart server uploads. The client requests a presigned URL, and our custom zero-dependency AWS SigV4 signer generates a time-limited PUT URL. The client streams the binary directly to S3. Only after S3 confirms receipt does our backend execute a HEAD request and perform magic-byte validation before persisting the URL.*
>
> *Finally, for Android, we packaged the app with Capacitor 8, injecting a custom Java bridge (`MainActivity.java`) to manage Android 13+ runtime permissions, high-priority notification channels, and full-screen incoming call intents. This delivers a native mobile experience while maintaining 100% web codebase parity."*
