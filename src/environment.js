// Centralized API & WebSocket Server URL
// Production Render backend fallback if not running locally
const PRODUCTION_BACKEND_URL = "https://enagaze-com-backend.onrender.com";

const getBaseServerUrl = () => {
    // 1. Explicit env var if provided at build time
    if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== "") {
        return process.env.REACT_APP_API_URL.trim();
    }

    // 2. Intelligent browser runtime detection
    if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        // If not on localhost or 127.0.0.1 (e.g. on Vercel, custom domain, or mobile device hitting LAN), use production Render backend
        if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "0.0.0.0") {
            return PRODUCTION_BACKEND_URL;
        }
    }

    // 3. Local development fallback
    return "http://localhost:8000";
};

const rawServer = getBaseServerUrl();
// Clean trailing slashes to prevent duplicated path segments like //api/v1
const server = rawServer.replace(/\/+$/, "");

export default server;