// Centralized API & WebSocket Server URL
const rawServer = process.env.REACT_APP_API_URL || "http://localhost:8000";
// Clean trailing slashes to prevent duplicated path segments like //api/v1
const server = rawServer.replace(/\/+$/, "");

export default server;