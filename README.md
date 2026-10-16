# Engaze.com — Premium Dating & Real-Time Social Platform (Frontend)

[![React Version](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://react.dev/)
[![Material UI](https://img.shields.io/badge/MUI-v5.15.4-007FFF.svg)](https://mui.com/)
[![React Router](https://img.shields.io/badge/react--router--dom-6.21.1-CA4245.svg)](https://reactrouter.com/)
[![Socket.IO Client](https://img.shields.io/badge/socket.io--client-4.7.3-black.svg)](https://socket.io/)
[![Deployment](https://img.shields.io/badge/deployed%20on-Vercel-black.svg)](https://vercel.com/)

The official frontend web application for **Engaze.com** — an engaging dating and social discovery experience combining Tinder-style candidate discovery, mutual matching, persistent real-time chat, and random 1-to-1 WebRTC video matchmaking.

<<<<<<< HEAD
In the project directory, you can run
=======
---
>>>>>>> 21da8c2 (readme and all)

## 🌐 Production & Repository Links

- **Live Application:** [https://engaze-com.vercel.app](https://engaze-com.vercel.app)
- **Frontend GitHub Repository:** [https://github.com/CrysPy-SAM/Engaze.com-frontend.git](https://github.com/CrysPy-SAM/Engaze.com-frontend.git)
- **Live Backend API:** [https://enagaze-com-backend.onrender.com](https://enagaze-com-backend.onrender.com)
- **Backend Health Check:** [https://enagaze-com-backend.onrender.com/api/v1/health](https://enagaze-com-backend.onrender.com/api/v1/health)
- **Backend GitHub Repository:** [https://github.com/CrysPy-SAM/Enagaze.com-Backend](https://github.com/CrysPy-SAM/Enagaze.com-Backend)

---

## 📋 Table of Contents

1. [Key Features](#-key-features)
2. [User Interface & Page Showcase](#-user-interface--page-showcase)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Folder Structure](#-architecture--folder-structure)
5. [Prerequisites](#-prerequisites)
6. [Installation & Local Setup](#-installation--local-setup)
7. [Environment Variables](#-environment-variables)
8. [Available npm Scripts](#-available-npm-scripts)
9. [Authentication & Route Protection](#-authentication--route-protection)
10. [Core Application User Flows](#-core-application-user-flows)
11. [WebRTC & Media Permissions](#-webrtc--media-permissions)
12. [Vercel Deployment Guide](#-vercel-deployment-guide)
13. [Troubleshooting & FAQs](#-troubleshooting--faqs)
14. [Known Limitations & Future Roadmap](#-known-limitations--future-roadmap)
15. [License](#-license)

---

## 🚀 Key Features

- **Modern Dating UI/UX:** Built with a confident, dark-mode design system featuring Midnight charcoal foundations (`#0B0D17`), Coral-Pink to Sunset Orange gradients, glassmorphism app bars, and responsive layouts.
- **Tinder-Style Discovery:** Interactive swipe cards with multi-photo carousels, interest badges, expandable bio modal, Like/Pass action buttons, keyboard arrow shortcuts, and an animated "It's a Match!" celebration modal.
- **Mutual Matches Hub:** Dedicated matches screen with instant search filtering by name, avatar previews, and quick-action buttons to open private chat or launch a direct video call.
- **Persistent Private Messaging:** Real-time 1-to-1 chat via Socket.IO with REST fallback, unread message badges, sent/delivered/read receipts, auto-scroll to latest message, and seamless mobile responsive drawer/list switching.
- **Random 1-to-1 WebRTC Video Matchmaking:** Queue-based matching connecting two live users peer-to-peer with camera/mic controls, partner dating profile overlay card, skip-to-next partner, and clean disconnect handling.
- **Profile Management Suite:** Multi-tab profile editor with completion progress meter, photo URL gallery manager with primary photo selector, age calculation from DOB, gender & dating preferences, bio, and 12+ interactive interest chips.
- **Legacy Room Video Meetings:** Instant room-based video calls (`/:url`) with multi-peer mesh WebRTC, screen sharing, and in-call text chat.
- **Centralized Authentication Context:** Automatic JWT token persistence in `localStorage`, automated Axios Bearer token injection, and global 401 interceptors for session expiry.

---

## 🖼 User Interface & Page Showcase

The application consists of the following primary views:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Engaze.com Page Hierarchy                       │
├────────────────────────────────────────────────────────────────────────┤
│  /                     Landing Page (Hero, Value Props, CTAs)          │
│  /auth                 Authentication (Tabbed Login & Registration)    │
│  /home                 Dashboard Hub (Quick Navigation & Room Join)    │
│  /discovery            Dating Swipe Feed & Match Modal                 │
│  /matches              Mutual Matches List & Search Filter             │
│  /chat                 Real-Time Private Messaging & Thread List       │
│  /chat/:id             Direct Conversation View                        │
│  /random-video         1-to-1 WebRTC Video Matchmaking Screen          │
│  /profile              Profile Editor & Live Preview Mode              │
│  /history              Historical Video Meetings Log                   │
│  /:url                 Legacy Multi-Peer Room Video Call               │
└────────────────────────────────────────────────────────────────────────┘
```

### UI Previews & Placeholders

| View | Description | Preview |
| :--- | :--- | :---: |
| **Landing Page** | Immersive hero banner, brand features, and direct sign-up call to action. | *[ Landing Page UI ]* |
| **Discovery Feed** | Swipe card with photo indicators, interests, Like/Pass floating triggers. | *[ Swipe Feed UI ]* |
| **Match Modal** | "It's a Match!" celebration dialog with instant messaging button. | *[ Match Celebration UI ]* |
| **Private Chat** | Responsive 2-column layout with real-time socket delivery & read receipts. | *[ Private Chat UI ]* |
| **Video Match** | Dual video feed (Local PIP + Remote Partner) with matchmaking controls. | *[ Video Calling UI ]* |
| **Profile Editor** | Live profile card preview alongside tabbed editing controls. | *[ Profile Editor UI ]* |

<<<<<<< HEAD
## Learn More:
=======
---
>>>>>>> 21da8c2 (readme and all)

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Core Framework** | React 18.2.0 |
| **Build Tooling** | Create React App (`react-scripts` 5.0.1) |
| **UI Component Library** | Material-UI (MUI) v5 (`@mui/material` 5.15.4, `@mui/icons-material` 5.15.4) |
| **Styling & Theming** | Emotion (`@emotion/react`, `@emotion/styled`), Custom MUI Theme |
| **Routing** | React Router DOM v6 (`react-router-dom` 6.21.1) |
| **HTTP Client** | Axios 1.6.5 |
| **Real-Time WebSockets** | `socket.io-client` 4.7.3 |
| **P2P Video Streaming** | WebRTC Native Browser APIs (`RTCPeerConnection`, `getUserMedia`) |

---

## 📁 Architecture & Folder Structure

```text
frontend/
├── build/                # Optimized production bundle generated by npm run build
├── public/               # Static assets (HTML shell, favicon, manifest)
├── src/
│   ├── App.css           # Global keyframe animations (swipes, pulses, cards)
│   ├── App.js            # Route definitions, MUI ThemeProvider, AuthProvider
│   ├── App.test.js       # Component unit test entry point
│   ├── environment.js    # API & WebSocket base URL resolver with trailing slash cleanup
│   ├── index.css         # Global resets and typography
│   ├── index.js          # React DOM root render
│   ├── theme.js          # Material-UI design system (colors, components, typography)
│   ├── components/
│   │   └── Navbar.jsx    # Responsive top desktop header & mobile bottom dock
│   ├── contexts/
│   │   └── AuthContext.jsx # Global auth state, Axios interceptors, API actions
│   ├── pages/
│   │   ├── authentication.jsx  # Tabbed login and registration forms
│   │   ├── chat.jsx            # Persistent real-time private messaging interface
│   │   ├── discovery.jsx       # Swipe discovery feed & match celebration modal
│   │   ├── history.jsx         # Meeting history log
│   │   ├── home.jsx            # Authenticated user dashboard
│   │   ├── landing.jsx         # Public landing page
│   │   ├── matches.jsx         # Mutual matches grid with search filter
│   │   ├── profile.jsx         # Profile edit and live preview tabs
│   │   ├── randomVideo.jsx     # Random 1-to-1 WebRTC video matchmaking
│   │   └── VideoMeet.jsx       # Legacy multi-peer video room meeting
│   ├── styles/
│   │   └── videoComponent.module.css # Styling for legacy room video interface
│   └── utils/
│       └── withAuth.jsx        # Higher-Order Component protecting private routes
├── .env                  # Local environment file (DO NOT COMMIT)
├── .env.example          # Environment template with local & production examples
├── package.json          # Dependencies, scripts, and browserslist
└── README.md             # This technical documentation
```

---

## 📦 Prerequisites

Ensure you have the following installed locally:

- **Node.js:** Version `18.0.0` or higher (verified on Node.js 20.x).
- **npm:** Version `9.0.0` or higher.
- A running instance of the Engaze.com backend (either locally on port `8000` or deployed on Render).

---

## ⚙️ Installation & Local Setup

1. **Clone the frontend repository:**
   ```bash
   git clone https://github.com/CrysPy-SAM/Engaze.com-frontend.git
   cd Engaze.com-frontend
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Set `REACT_APP_API_URL` to point to your backend server:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

---

## 🔑 Environment Variables

The frontend application uses Create React App. In CRA, **only variables starting with `REACT_APP_` are embedded into the client-side JavaScript bundle during build time**.

| Variable Name | Required | Default in Code | Purpose |
| :--- | :---: | :--- | :--- |
| `REACT_APP_API_URL` | No | `http://localhost:8000` | Base URL for backend REST API (`/api/v1`) and Socket.IO connection. |

### Centralized URL Handling in [`src/environment.js`](file:///d:/code/Engaze.com/frontend/src/environment.js)
```javascript
const rawServer = process.env.REACT_APP_API_URL || "http://localhost:8000";
// Strips any trailing slashes to eliminate duplicated path segments like //api/v1
const server = rawServer.replace(/\/+$/, "");
export default server;
```

### Environment Configurations
- **Local Development:**
  ```env
  REACT_APP_API_URL=http://localhost:8000
  ```
- **Production (Vercel):**
  ```env
  REACT_APP_API_URL=https://enagaze-com-backend.onrender.com
  ```

---

## 📜 Available npm Scripts

Defined in [`package.json`](file:///d:/code/Engaze.com/frontend/package.json):

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm start` | `react-scripts start` | Starts local development server at `http://localhost:3000`. |
| `npm run build` | `react-scripts build` | Compiles an optimized, minified production build in the `build/` folder. |
| `npm test` | `react-scripts test` | Launches Jest test runner in interactive watch mode. |
| `npm run eject` | `react-scripts eject` | Ejects CRA configurations (one-way operation; not recommended). |

---

## 🔒 Authentication & Route Protection

Authentication state is managed by [`src/contexts/AuthContext.jsx`](file:///d:/code/Engaze.com/frontend/src/contexts/AuthContext.jsx) and enforced through the [`src/utils/withAuth.jsx`](file:///d:/code/Engaze.com/frontend/src/utils/withAuth.jsx) Higher-Order Component.

### Authentication Flow
1. **Login / Register:** On `/auth`, submitting the credentials dispatches `handleLogin` or `handleRegister`. Upon success, the returned JWT is stored in `localStorage.getItem("token")`.
2. **Automatic Header Attachment:** Axios interceptors attach `Authorization: Bearer <token>` to all subsequent HTTP requests automatically.
3. **Session Verification:** On app mount, `checkAuth` verifies the token by fetching `/api/v1/users/profile/me`. If invalid or expired, the session resets cleanly.
4. **Session Expiry Handling:** If any API response returns `401 Unauthorized`, the response interceptor automatically clears `localStorage` and redirects the user to `/auth`.
5. **Route Guarding:** Protected pages (`/home`, `/discovery`, `/matches`, `/chat`, `/random-video`, `/profile`, `/history`) are wrapped with `withAuth`. Unauthenticated visits immediately redirect to `/auth`.

---

## 🧭 Core Application User Flows

### 1. Dating Discovery & Swiping Flow
```text
  [ Discovery Feed (/discovery) ]
                 │
       Fetch /api/v1/discovery
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  [ Pass Profile ]    [ Like Profile ]
       │                   │
  POST /swipe         POST /swipe
  action: "pass"      action: "like"
                           │
                 Mutual Match Detected?
                     /          \
                   Yes           No
                   /              \
       [ "It's a Match!" ]   [ Next Profile ]
        Celebration Modal
               │
     [ Send First Message ]
               │
         /chat/:convId
```

### 2. Private Real-Time Chat Flow
1. When opening `/chat`, `getConversations()` loads all existing match conversations.
2. If navigated from a match (`/chat?matchId=...`), `getOrCreateConversationByMatch` retrieves or initializes the conversation.
3. `chat.jsx` establishes an authenticated Socket.IO connection:
   ```javascript
   const socket = io(server, {
     auth: { token: authToken },
     transports: ["websocket", "polling"],
   });
   ```
4. Joining the conversation room (`socket.emit("chat:join", { conversationId })`) activates real-time message receiving (`chat:new-message`) and read receipt dispatching (`chat:read`).
5. Messages are delivered immediately via WebSocket, with an automated REST fallback (`sendMessageRest`) if the socket is momentarily disconnected.

### 3. Random 1-to-1 WebRTC Video Matchmaking Flow
1. User enters `/random-video` and grants camera & microphone permissions.
2. Clicking **"Find Match"** emits `random:join-queue`.
3. The server pairs two active users and emits `random:matched`:
   - **Peer A (Initiator):** Creates WebRTC `offer` and sends it via `random:signal`.
   - **Peer B (Receiver):** Receives offer, creates `answer`, and responds via `random:signal`.
   - Both peers exchange ICE candidates via `random:signal`.
4. Direct peer-to-peer audio/video stream is rendered.
5. Users can toggle camera/mic, click **"Next"** to skip to a new partner, or click **"End Call"** to disconnect.

---

## 📹 WebRTC & Media Permissions

### Browser Permission Requirements
- WebRTC requires **HTTPS** in production (or `http://localhost` for development). Media devices are blocked by modern browsers on non-secure HTTP origins.
- Users must explicitly grant camera and microphone access when prompted.

### Single-Machine Testing Caveat
> [!IMPORTANT]
> **Desktop Camera Hardware Lock:**  
> Operating systems (Windows, macOS) lock the physical webcam exclusively to one browser process at a time.  
> If you open two browser tabs (or a regular tab and an incognito tab) on the same computer to test random video calls, the second tab will often throw a `NotReadableError: Could not start video source`.  
> **To test 1-to-1 video calling successfully, test between two separate physical devices (e.g. Laptop + Smartphone) over HTTPS.**

---

## ☁️ Vercel Deployment Guide

The frontend is deployed to production on [Vercel](https://vercel.com).

### Deployment Settings

| Setting | Value |
| :--- | :--- |
| **Project Name** | `engaze-com` |
| **Framework Preset** | `Create React App` |
| **Root Directory** | `frontend` (or repository root if frontend is its own repo) |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install` |

### Configuring the Production Environment Variable in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/) $\rightarrow$ select the **`engaze-com`** project.
2. Navigate to **Settings** $\rightarrow$ **Environment Variables**.
3. Add the following variable:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://enagaze-com-backend.onrender.com`
   - **Environments:** Check **Production**, **Preview**, and **Development**.
4. Click **Save**.

### Triggering a Clean Redeployment
Because React environment variables are injected at **build time**, you must trigger a redeployment after modifying environment variables:
1. Navigate to the **Deployments** tab in Vercel.
2. Click the three dots (`...`) next to the latest deployment and select **Redeploy**.
3. **Uncheck** "Use existing build cache" to ensure a fresh compilation.
4. Click **Redeploy**.

---

## 🔍 Troubleshooting & FAQs

### 1. API Calls Fail with Network Error / CORS Error
- **Symptom:** Browser console displays `Blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`.
- **Cause:** `REACT_APP_API_URL` is pointing to `localhost` in production, or the Render backend was asleep during the request.
- **Fix:** Verify `REACT_APP_API_URL` is set to `https://enagaze-com-backend.onrender.com` in Vercel project settings and redeploy without cache.

### 2. Render Backend Cold Starts
- **Symptom:** First login or registration request takes 30–50 seconds to complete.
- **Cause:** Render free tier instances spin down after 15 minutes of inactivity.
- **Fix:** This is normal behavior for free hosting. Once woken, subsequent requests respond in under 200ms.

### 3. Camera / Microphone Access Denied
- **Symptom:** `Camera or microphone access was denied. Please allow permissions.`
- **Cause:** Browser permissions blocked or non-HTTPS connection.
- **Fix:** Click the lock/tune icon in the browser address bar $\rightarrow$ **Site settings** $\rightarrow$ set Camera and Microphone to **Allow**.

---

## 🗺 Known Limitations & Future Roadmap

- **Photo Uploads:** Profiles currently use image URLs. Direct file upload with cloud storage (Cloudinary or AWS S3) is planned.
- **Push Notifications:** Web Push / Service Worker notifications for new matches and messages when the app tab is inactive.
- **Audio/Video Filters:** Interactive AR face filters and background blur during random video calls.

---

## 📄 License

This repository is private and proprietary. All rights reserved. See [`package.json`](file:///d:/code/Engaze.com/frontend/package.json) (`"private": true`).
