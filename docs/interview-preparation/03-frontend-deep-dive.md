# 03. Frontend Deep Dive — Engaze

## Overview & Directory Topology

The Engaze frontend is a single-page application built on **React 18** and styled using **Material-UI (MUI v5)**. It is packaged both as a responsive web app hosted on Vercel's global CDN and as a native Android APK via **Capacitor 8**.

```
frontend/src/
├── components/                     # Reusable UI widgets & modal overlays
│   ├── AppUpdateChecker.jsx        # In-app update checker & browser-delegated APK downloader
│   ├── DirectVideoCallModal.jsx    # Fullscreen 1-on-1 WebRTC calling overlay
│   ├── EngazeLogo.jsx              # Vector SVG brand assets
│   ├── NativeMobileWelcome.jsx     # Onboarding bottom sheet for Android users
│   ├── Navbar.jsx                  # Header with responsive navigation & badge counters
│   └── SafetyActionModal.jsx       # Block, report, and unmatch confirmation dialogs
├── contexts/                       # Global React Context state providers
│   ├── AuthContext.jsx             # Authentication, session, user profile & API counters
│   └── DirectCallContext.jsx       # WebRTC state machine, audio synthesizer & signaling
├── pages/                          # Route-level views (code-split via React.lazy)
│   ├── authentication.jsx          # Dual-tab Sign In / Register & Google OAuth
│   ├── calls.jsx                   # Call logs, history, and missed call badges
│   ├── chat.jsx                    # Real-time messaging, typing, read receipts, media
│   ├── discovery.jsx               # Swipeable card deck, preferences modal, mutual matching
│   ├── home.jsx                    # User dashboard, recent activity, quick actions
│   ├── landing.jsx                 # Public marketing landing page with SEO tags
│   ├── matches.jsx                 # Mutual matches grid & pending consent requests
│   ├── NotFound.jsx                # 404 fallback page
│   ├── privacy.jsx / terms.jsx     # Legal & compliance disclosures
│   ├── profile.jsx                 # Photo manager, bio, interests, privacy settings
│   ├── randomVideo.jsx             # Speed-dating queue & instant P2P video stream
│   ├── safety.jsx                  # Safety center & community guidelines
│   ├── search.jsx                  # Instagram-style user search with debounced queries
│   └── setupUsername.jsx           # Forced onboarding username selection view
├── utils/                          # Pure helper functions & diagnostic tools
│   ├── chatHelpers.js              # Message timestamp formatting & snippet truncation
│   ├── photoUpload.js              # Authoritative MIME normalization & 3-step S3 flow
│   ├── presenceFormatters.js       # Dynamic "Online" / "Last seen today at..." logic
│   ├── webrtcDiagnostics.js       # Browser media capability & ICE connectivity checks
│   └── withAuth.jsx                # Higher-Order Component (HOC) for route protection
├── environment.js                  # Centralized backend URL resolver & runtime detector
├── theme.js                        # Custom MUI theme (Dark palette: #0B0D17, #FD3A73)
├── App.js                          # Root router, SEO manager, and boundary wrappers
└── index.js                        # DOM mounting point & React Concurrent root
```

---

## 1. Application Entry Points & Bootstrapping

### `src/index.js`
* Bootstraps the application using React 18's `createRoot` API:
  ```javascript
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
  ```
* Bypasses `React.StrictMode` in production builds to prevent double-invocation of WebRTC media stream initialization and duplicate socket handshakes.

### `src/App.js`
* **Route Code-Splitting:** All view components are lazily imported using `React.lazy()`:
  ```javascript
  const DiscoveryPage = lazy(() => import('./pages/discovery'));
  const ChatPage = lazy(() => import('./pages/chat'));
  const DirectVideoCallModal = lazy(() => import('./components/DirectVideoCallModal'));
  ```
* **Error Boundary (`RouteErrorBoundary`):** A custom class component wrapping `<Suspense>`. When network drops cause dynamic bundle chunks to fail loading, it catches the exception and renders a user-friendly *"Connection Interrupted"* screen with a reload button rather than crashing to a white screen.
* **Client-Side SEO Manager (`PageTitleManager`):** Listens to `location.pathname` changes via React Router's `useLocation()`. Dynamically alters `document.title`, OpenGraph meta tags, Twitter card tags, and canonical URLs (`https://www.engaze.date/*`) on the client without requiring a Node.js SSR server.
* **Capacitor Mobile Styling Hook:** Detects native execution via `Capacitor.isNativePlatform()`. If running on Android, sets `StatusBar.setStyle({ style: Style.Dark })` and prevents WebView overlaying.

---

## 2. State Management Architecture: Context API

Engaze deliberately avoids heavyweight third-party state managers like Redux in favor of **React's built-in Context API**, creating a clean, unidirectional data flow organized across two domains:

```
[ Root App ]
    │
    ▼
[ AuthProvider ] (src/contexts/AuthContext.jsx)
    │  - Stores: token, userData, unreadChatCount, unreadNotificationCount,
    │            unseenMissedCallCount, likesYouCount, activeChatConversationId
    │  - Provides: handleLogin, handleRegister, handleGoogleLogin, logout,
    │              updateProfile, requestUploadUrl, uploadPhotoBinary, confirmPhotoUpload
    │
    ▼
[ DirectCallProvider ] (src/contexts/DirectCallContext.jsx)
    │  - Stores: callState, callSession, localStream, remoteStream,
    │            audioEnabled, videoEnabled, callDuration, statusMessage
    │  - Provides: initiateCall, acceptCall, declineCall, endCall,
    │              toggleAudio, toggleVideo, switchCamera
    │
    ▼
[ View Layer / React Router Routes ]
```

### `AuthContext.jsx` Deep Dive
1. **Authoritative Session Hydration (`checkAuth`):**
   * On initial mount, reads `localStorage.getItem("token")`.
   * Dispatches `api.get("/users/profile/me")`.
   * Concurrently hydrates unread message badges (`/conversations/unread-count`), missed call badges (`/calls/missed-count`), and incoming match request counters (`/notifications/unread-count`).
2. **Global Axios Interceptor Pipeline:**
   * **Request Interceptor:** Automatically reads the active JWT from `localStorage` and attaches the `Authorization: Bearer <token>` header to all outgoing HTTP requests.
   * **Response Interceptor:** Intercepts incoming responses globally. If the backend returns `401 Unauthorized` (indicating token expiry or revocation), it automatically purges `localStorage`, nullifies user state, and forces navigation to `/auth`.
3. **Photo Upload Orchestration:**
   * Exports `requestUploadUrl`, `uploadPhotoBinary`, and `confirmPhotoUpload` which interact with backend AWS SigV4 endpoints.

### `DirectCallContext.jsx` Deep Dive
1. **Web Audio Ringtone Engine (`RingtoneEngine`):**
   * Zero external MP3/WAV assets. Synthesizes procedural dual-frequency sine-wave chimes using the browser's native `AudioContext`:
     * **Incoming Call:** Two-tone pleasant chime alternating between 523.25 Hz (C5) and 659.25 Hz (E5).
     * **Outgoing Ringback:** Subtle 440 Hz periodic tone.
   * Automatically stops audio when the call is answered, declined, or timed out.
2. **Call State Machine:**
   * State transitions: `idle` $\rightarrow$ `outgoing_ringing` / `incoming_ringing` $\rightarrow$ `connecting` $\rightarrow$ `connected` $\rightarrow$ `ended` / `declined` / `busy` / `no_answer`.
3. **Automated Resource Teardown:**
   * `stopLocalMedia()`: Iterates all active tracks on `localStream` and invokes `track.stop()`, immediately releasing hardware camera and microphone locks.
   * `closePeerConnection()`: Detaches `ontrack` and `onicecandidate` event handlers, invokes `pc.close()`, and nullifies references to prevent memory leaks.

---

## 3. Protected Route Architecture: `withAuth.jsx`

Route protection is implemented using a **Higher-Order Component (HOC)** pattern:

```javascript
const withAuth = (WrappedComponent) => {
    return (props) => {
        const { isAuthenticated, loading, userData } = useContext(AuthContext);
        const navigate = useNavigate();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                navigate("/auth", { replace: true });
            } else if (!loading && isAuthenticated && userData?.usernameSetupCompleted === false) {
                navigate("/setup-username", { replace: true });
            }
        }, [loading, isAuthenticated, userData, navigate]);

        if (loading) return <CircularProgress />;
        if (!isAuthenticated || userData?.usernameSetupCompleted === false) return null;

        return <WrappedComponent {...props} />;
    };
};
```

### Architectural Highlights of `withAuth`
* **Zero Flash of Unauthenticated Content (FOUC):** Returns `null` until authentication validation completes.
* **Forced Onboarding Guard:** If a user signed in with Google OAuth and has not yet established an Instagram-style handle (`usernameSetupCompleted: false`), they are trapped and redirected to `/setup-username` until they complete handle creation.

---

## 4. Key Page Implementations

### A. Discovery (`src/pages/discovery.jsx`)
* **Tinder-Style Swiping Deck:** Displays profile cards showing name, age (computed dynamically from `dob`), location, bio, tags, and photos.
* **Interactive Controls:** "Pass" (Cross button) and "Like" (Heart button). Swiping dispatches `POST /api/v1/discovery/swipe`.
* **Instant Match Dialog:** If the swipe creates a mutual match (`response.data.matchCreated: true`), an animated celebration modal surfaces with a "Send Message" shortcut redirecting to `/chat/:conversationId`.
* **Preferences Drawer:** Allows live filtering by interested gender (`male`, `female`, `non-binary`, `everyone`) and age range (`min` to `max`).

### B. Real-Time Chat (`src/pages/chat.jsx`)
* **Dual Layout:** Desktop renders a split two-pane view (Conversation list on left, active chat on right). Mobile renders single-pane views with back button navigation.
* **Optimistic Message Sending:**
  1. User types message and presses Send.
  2. A temporary message object with `clientTempId = Date.now()` is immediately rendered with a clock icon.
  3. `socket.emit("chat:send", { conversationId, content, clientTempId })` is dispatched.
  4. Upon socket acknowledgement `chat:message-sent`, the clock icon transitions to a single tick mark.
* **Read Receipts & Typing Telemetry:**
  * Emits `chat:typing` debounced by 2 seconds.
  * When Bob views the conversation, emits `chat:read`. Alice's client receives `chat:messages-read` and transitions ticks to double-blue checks.

### C. Random Speed Dating (`src/pages/randomVideo.jsx`)
* **Live Matchmaking Queue:** Singles join a pool via `socket.emit("random:join-queue")`.
* **Consent & Media-Ready Handshake:** Once paired by the backend, neither user's video is unmuted until both click "I'm Ready", firing `random:consent`.
* **Instant Skip ("Next"):** Clicking "Next" immediately emits `random:next`, tears down the current `RTCPeerConnection`, and re-enters the Redis queue.

---

## 5. Intelligent Runtime & API Server Detection (`environment.js`)

Engaze handles multi-environment routing without hardcoded IP addresses:

```javascript
const PRODUCTION_BACKEND_URL = "https://enagaze-com-backend.onrender.com";

const getBaseServerUrl = () => {
    if (process.env.REACT_APP_API_URL?.trim()) {
        return process.env.REACT_APP_API_URL.trim();
    }
    if (typeof window !== "undefined" && window.location) {
        // Detect native mobile runtime (Capacitor runs inside Android WebView from localhost)
        const isCapacitor = Boolean(window.Capacitor) ||
            window.location.protocol === "capacitor:" ||
            (window.location.hostname === "localhost" && navigator.userAgent.includes("Android"));

        if (isCapacitor) return PRODUCTION_BACKEND_URL;

        // If not on local dev machine, use production Render backend
        if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname)) {
            return PRODUCTION_BACKEND_URL;
        }
    }
    return "http://localhost:8000";
};
```

---

## 6. Build, Bundle Optimization & Performance

* **Webpack / react-scripts 5:** Production build executed via `npm run build`.
* **Asset Gzipping:** Core bundle `main.[hash].js` is optimized to **168 kB gzip**.
* **Route Chunks:** Pages are split into individual chunks ranging from 1.5 kB to 16 kB, downloaded only when the user navigates to that specific route.
* **Lighthouse Performance Score:** Live audit scores range from 90–98 across Accessibility, Best Practices, and SEO.
