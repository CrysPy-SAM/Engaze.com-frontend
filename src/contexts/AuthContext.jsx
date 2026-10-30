import axios from "axios";
import httpStatus from "http-status";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

// Base API client pointing to /api/v1 with 60s timeout for Render free tier wakeups
const api = axios.create({
    baseURL: `${server}/api/v1`,
    timeout: 60000,
});

// Request interceptor to automatically attach JWT Bearer token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// In-memory cache for ICE server configuration (5 min TTL)
let cachedIceServers = null;
let cachedIceServersExpiry = 0;

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [unseenMissedCallCount, setUnseenMissedCallCount] = useState(0);
    const [likesYouCount, setLikesYouCount] = useState(0);
    const router = useNavigate();

    // Check token and fetch user profile on initial mount
    const checkAuth = useCallback(async () => {
        const savedToken = localStorage.getItem("token");
        if (!savedToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get("/users/profile/me");
            if (response.data && response.data.profile) {
                setUserData(response.data.profile);
                setToken(savedToken);
                // Hydrate unread chat count authoritative badge on login/mount
                api.get("/conversations/unread-count")
                    .then((res) => {
                        if (res.data && typeof res.data.unreadCount === "number") {
                            setUnreadChatCount(res.data.unreadCount);
                        }
                    })
                    .catch(() => {});

                // Hydrate unseen missed call count authoritative badge on login/mount
                api.get("/calls/missed-count")
                    .then((res) => {
                        if (res.data && typeof res.data.count === "number") {
                            setUnseenMissedCallCount(res.data.count);
                        }
                    })
                    .catch(() => {});
            }
        } catch (err) {
            // Only clear token if server explicitly rejected auth with 401 or 403
            if (err.response && (err.response.status === httpStatus.UNAUTHORIZED || err.response.status === httpStatus.FORBIDDEN)) {
                console.warn("Stored token is invalid or expired, resetting session.");
                localStorage.removeItem("token");
                setUserData(null);
                setToken(null);
            } else {
                console.warn("Could not reach profile endpoint, retaining existing session token.");
                setToken(savedToken);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Response interceptor to handle session expiration globally
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === httpStatus.UNAUTHORIZED) {
                    if (localStorage.getItem("token")) {
                        localStorage.removeItem("token");
                        setUserData(null);
                        setToken(null);
                        router("/auth");
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [router]);

    // 1. REGISTER
    const handleRegister = useCallback(async (name, username, password) => {
        try {
            if (!name || !username || !password) {
                throw new Error("All fields are required");
            }

            const response = await api.post("/users/register", {
                name: name.trim(),
                username: username.trim(),
                password,
            });

            if (response.status === httpStatus.CREATED) {
                const newToken = response.data.token;
                if (newToken) {
                    localStorage.setItem("token", newToken);
                    setToken(newToken);
                    setUserData(response.data.user);
                    router("/home");
                }
                return response.data.message || "Registration successful!";
            } else {
                throw new Error(response.data?.message || "Registration failed");
            }
        } catch (err) {
            console.error("Registration error:", err);
            let msg = err.response?.data?.message || err.message;
            if (
                err.code === "ECONNABORTED" ||
                (!err.response && (err.message === "Network Error" || err.message?.includes("timeout")))
            ) {
                msg = "Backend server is waking up (Render free tier cold-start). Please wait 10 seconds and try again.";
            } else if (!err.response) {
                msg = "Unable to connect to server. Please check your internet connection.";
            }
            throw new Error(msg);
        }
    }, [router]);

    // 2. LOGIN
    const handleLogin = useCallback(async (username, password) => {
        try {
            if (!username || !password) {
                throw new Error("Username and password are required");
            }

            const response = await api.post("/users/login", {
                username: username.trim(),
                password,
            });

            if (response.status === httpStatus.OK) {
                const newToken = response.data.token;
                localStorage.setItem("token", newToken);
                setToken(newToken);
                setUserData(response.data.user);
                router("/home");
                return response.data;
            } else {
                throw new Error(response.data?.message || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login error:", err);
            let msg = err.response?.data?.message || err.message;
            if (
                err.code === "ECONNABORTED" ||
                (!err.response && (err.message === "Network Error" || err.message?.includes("timeout")))
            ) {
                msg = "Backend server is waking up (Render free tier cold-start). Please wait 10-20 seconds and try again.";
            } else if (!err.response) {
                msg = "Unable to connect to server. Please check your internet connection.";
            }
            throw new Error(msg);
        }
    }, [router]);

    // 2b. GOOGLE LOGIN / SIGNUP
    const handleGoogleLogin = useCallback(async (idToken) => {
        try {
            if (!idToken) {
                throw new Error("Google ID token is required");
            }

            const response = await api.post("/users/google-login", {
                idToken,
            });

            if (response.status === httpStatus.OK || response.status === httpStatus.CREATED) {
                const newToken = response.data.token;
                if (newToken) {
                    localStorage.setItem("token", newToken);
                    setToken(newToken);
                    setUserData(response.data.user);
                    if (response.data.requiresUsernameSetup || response.data.user?.usernameSetupCompleted === false) {
                        router("/setup-username");
                    } else {
                        router("/home");
                    }
                }
                return response.data;
            } else {
                throw new Error(response.data?.message || "Google authentication failed");
            }
        } catch (err) {
            console.error("Google authentication error:", err);
            let msg = err.response?.data?.message || err.message;
            if (
                err.code === "ECONNABORTED" ||
                (!err.response && (err.message === "Network Error" || err.message?.includes("timeout")))
            ) {
                msg = "Backend server is waking up. Please wait a moment and try again.";
            } else if (!err.response) {
                msg = "Unable to connect to server. Please check your internet connection.";
            }
            throw new Error(msg);
        }
    }, [router]);

    // 3. LOGOUT
    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        cachedIceServers = null;
        cachedIceServersExpiry = 0;
        setToken(null);
        setUserData(null);
        router("/auth");
    }, [router]);

    // 4. GET PROFILE
    const getProfile = useCallback(async () => {
        try {
            const response = await api.get("/users/profile/me");
            if (response.data && response.data.profile) {
                setUserData(response.data.profile);
                return response.data.profile;
            }
        } catch (err) {
            console.error("Get profile error:", err);
            throw new Error(err.response?.data?.message || "Failed to load profile");
        }
    }, []);

    // 5. UPDATE PROFILE
    const updateProfile = useCallback(async (profileData) => {
        try {
            const response = await api.put("/users/profile/me", profileData);
            if (response.data && response.data.profile) {
                setUserData(response.data.profile);
                return response.data;
            }
        } catch (err) {
            console.error("Update profile error:", err);
            throw new Error(err.response?.data?.message || "Failed to update profile");
        }
    }, []);

    // 5a. CHECK USERNAME AVAILABILITY
    const checkUsernameAvailability = useCallback(async (rawUsername) => {
        try {
            const response = await api.get(`/users/check-username?username=${encodeURIComponent(rawUsername)}`);
            return response.data;
        } catch (err) {
            return {
                success: false,
                available: false,
                message: err.response?.data?.message || "Failed to check username availability",
            };
        }
    }, []);

    // 5b. SETUP INITIAL USERNAME
    const setupUsername = useCallback(async (newUsername) => {
        try {
            const response = await api.post("/users/setup-username", { username: newUsername });
            if (response.data && response.data.user) {
                setUserData(response.data.user);
                if (response.data.token) {
                    localStorage.setItem("token", response.data.token);
                    setToken(response.data.token);
                }
            }
            return response.data;
        } catch (err) {
            console.error("Setup username error:", err);
            const msg = err.response?.data?.message || err.message || "Failed to set up username";
            const suggestions = err.response?.data?.suggestions || [];
            const errorObj = new Error(msg);
            errorObj.suggestions = suggestions;
            errorObj.status = err.response?.status;
            throw errorObj;
        }
    }, []);

    // 5c. GET USERNAME CHANGE ELIGIBILITY
    const getUsernameEligibility = useCallback(async () => {
        try {
            const response = await api.get("/users/username-eligibility");
            return response.data;
        } catch (err) {
            console.error("Get username eligibility error:", err);
            throw new Error(err.response?.data?.message || "Failed to retrieve username change eligibility");
        }
    }, []);

    // 5d. UPDATE EXISTING USERNAME (14-DAY COOLDOWN ENFORCED)
    const updateUsername = useCallback(async (newUsername) => {
        try {
            const response = await api.put("/users/username", { username: newUsername });
            if (response.data && response.data.user) {
                setUserData(response.data.user);
                if (response.data.token) {
                    localStorage.setItem("token", response.data.token);
                    setToken(response.data.token);
                }
            }
            return response.data;
        } catch (err) {
            console.error("Update username error:", err);
            const msg = err.response?.data?.message || err.message || "Failed to update username";
            const suggestions = err.response?.data?.suggestions || [];
            const nextEligibleAt = err.response?.data?.nextEligibleAt;
            const remainingDays = err.response?.data?.remainingDays;
            const errorObj = new Error(msg);
            errorObj.suggestions = suggestions;
            errorObj.nextEligibleAt = nextEligibleAt;
            errorObj.remainingDays = remainingDays;
            errorObj.status = err.response?.status;
            errorObj.code = err.response?.data?.code;
            throw errorObj;
        }
    }, []);

    // 5b. GET DISCOVERY PREFERENCES
    const getDiscoveryPreferences = useCallback(async () => {
        try {
            const response = await api.get("/discovery/preferences");
            return response.data;
        } catch (err) {
            console.error("Get discovery preferences error:", err);
            throw new Error(err.response?.data?.message || "Failed to get discovery preferences");
        }
    }, []);

    // 5c. UPDATE DISCOVERY PREFERENCES
    const updateDiscoveryPreferences = useCallback(async (preferences) => {
        try {
            const response = await api.put("/discovery/preferences", preferences);
            if (response.data && response.data.datingPreferences) {
                setUserData((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        datingPreferences: response.data.datingPreferences,
                    };
                });
            }
            return response.data;
        } catch (err) {
            console.error("Update discovery preferences error:", err);
            throw new Error(err.response?.data?.message || "Failed to update discovery preferences");
        }
    }, []);

    // 5d. REQUEST PHOTO UPLOAD URL
    const requestPhotoUploadUrl = useCallback(async ({ filename, contentType, fileSize, targetIndex }) => {
        try {
            const response = await api.post("/users/profile/photo/upload-url", {
                filename,
                contentType,
                fileSize,
                targetIndex,
            });
            return response.data;
        } catch (err) {
            console.error("Request photo upload URL error:", err);
            const error = new Error(err.response?.data?.message || err.message || "Failed to request photo upload authorization");
            error.status = err.response?.status;
            error.code = err.response?.data?.code;
            error.response = err.response;
            throw error;
        }
    }, []);

    // 5e. UPLOAD PHOTO BINARY TO PROVIDER
    const uploadPhotoBinary = useCallback(async (uploadUrl, file, onProgress) => {
        try {
            // Use axios directly so the api Authorization interceptor is bypassed for storage providers (S3/R2)
            const response = await axios.put(uploadUrl, file, {
                headers: {
                    "Content-Type": file.type || "application/octet-stream",
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                },
            });
            return response.data;
        } catch (err) {
            console.error("Binary upload to storage provider error:", err);
            const error = new Error(err.response?.data?.message || err.message || "Failed to upload photo to storage provider");
            error.status = err.response?.status;
            error.response = err.response;
            throw error;
        }
    }, []);

    // 5f. CONFIRM PHOTO UPLOAD
    const confirmPhotoUpload = useCallback(async ({ key, uploadToken, targetIndex }) => {
        try {
            const response = await api.post("/users/profile/photo/confirm", {
                key,
                uploadToken,
                targetIndex,
            });
            if (response.data && response.data.photos) {
                setUserData((prev) => (prev ? { ...prev, photos: response.data.photos } : prev));
            }
            return response.data;
        } catch (err) {
            console.error("Confirm photo upload error:", err);
            const error = new Error(err.response?.data?.message || err.message || "Failed to confirm photo upload");
            error.status = err.response?.status;
            error.code = err.response?.data?.code;
            error.response = err.response;
            throw error;
        }
    }, []);

    // 5g. DELETE PROFILE PHOTO
    const deleteProfilePhoto = useCallback(async (photoIndex) => {
        try {
            const response = await api.delete(`/users/profile/photo/${photoIndex}`);
            if (response.data && response.data.photos) {
                setUserData((prev) => (prev ? { ...prev, photos: response.data.photos } : prev));
            }
            return response.data;
        } catch (err) {
            console.error("Delete profile photo error:", err);
            const error = new Error(err.response?.data?.message || err.message || "Failed to delete profile photo");
            error.status = err.response?.status;
            error.response = err.response;
            throw error;
        }
    }, []);

    // 6. DATING DISCOVERY FEED
    const getDiscovery = useCallback(async (pageOrOptions = 1, maybeLimit = 15, maybeCursor = null) => {
        try {
            let params = {};
            if (typeof pageOrOptions === "object" && pageOrOptions !== null) {
                params = { ...pageOrOptions };
            } else {
                params = { page: pageOrOptions, limit: maybeLimit };
                if (maybeCursor) {
                    params.cursor = maybeCursor;
                }
            }
            const response = await api.get("/discovery", {
                params,
            });
            return response.data;
        } catch (e) {
            console.error("Get discovery error:", e);
            throw new Error(e.response?.data?.message || "Failed to load discovery profiles");
        }
    }, []);

    // 9. SWIPE (LIKE / PASS)
    const sendSwipe = useCallback(async (targetUserId, action) => {
        try {
            const response = await api.post("/discovery/swipe", {
                targetUserId,
                action,
            });
            return response.data;
        } catch (e) {
            console.error("Swipe error:", e);
            throw new Error(e.response?.data?.message || "Failed to record swipe");
        }
    }, []);

    // 9b. RESET PASSED SWIPES (RE-EXPLORE FEED)
    const resetDiscoveryFeed = useCallback(async () => {
        try {
            const response = await api.post("/discovery/reset");
            return response.data;
        } catch (e) {
            console.error("Reset discovery error:", e);
            throw new Error(e.response?.data?.message || "Failed to reset discovery feed");
        }
    }, []);

    // 10. GET MUTUAL MATCHES
    const getMatches = useCallback(async (page = 1, limit = 20) => {
        try {
            const response = await api.get("/matches", {
                params: { page, limit },
            });
            return response.data;
        } catch (e) {
            console.error("Get matches error:", e);
            throw new Error(e.response?.data?.message || "Failed to load matches");
        }
    }, []);

    // 10b. GET LIKES YOU PROFILES
    const getLikesYou = useCallback(async (page = 1, limit = 20) => {
        try {
            const response = await api.get("/matches/likes-you", {
                params: { page, limit },
            });
            if (response.data && response.data.pagination) {
                setLikesYouCount(response.data.pagination.total || 0);
            }
            return response.data;
        } catch (e) {
            console.error("Get likes you error:", e);
            throw new Error(e.response?.data?.message || "Failed to load likes");
        }
    }, []);

    // 10b-1. SEND MATCH REQUEST (A -> B)
    const sendMatchRequest = useCallback(async (targetUserId, message = "") => {
        try {
            const response = await api.post("/matches/requests", {
                recipientId: targetUserId,
                message,
            });
            return response.data;
        } catch (e) {
            console.error("Send match request error:", e);
            throw new Error(e.response?.data?.message || "Failed to send match request");
        }
    }, []);

    // 10b-2. GET INCOMING MATCH REQUESTS
    const getIncomingMatchRequests = useCallback(async () => {
        try {
            const response = await api.get("/matches/requests/incoming");
            return response.data;
        } catch (e) {
            console.error("Get incoming requests error:", e);
            throw new Error(e.response?.data?.message || "Failed to load match requests");
        }
    }, []);

    // 10b-3. GET OUTGOING MATCH REQUESTS
    const getOutgoingMatchRequests = useCallback(async () => {
        try {
            const response = await api.get("/matches/requests/outgoing");
            return response.data;
        } catch (e) {
            console.error("Get outgoing requests error:", e);
            throw new Error(e.response?.data?.message || "Failed to load outgoing requests");
        }
    }, []);

    // 10b-4. ACCEPT MATCH REQUEST
    const acceptMatchRequest = useCallback(async (requestId) => {
        try {
            const response = await api.post(`/matches/requests/${requestId}/accept`);
            return response.data;
        } catch (e) {
            console.error("Accept match request error:", e);
            throw new Error(e.response?.data?.message || "Failed to accept match request");
        }
    }, []);

    // 10b-5. DECLINE MATCH REQUEST
    const declineMatchRequest = useCallback(async (requestId) => {
        try {
            const response = await api.post(`/matches/requests/${requestId}/decline`);
            return response.data;
        } catch (e) {
            console.error("Decline match request error:", e);
            throw new Error(e.response?.data?.message || "Failed to decline match request");
        }
    }, []);

    // 10b-6. VERIFY CALL ACCESS PERMISSIONS
    const verifyCallAccess = useCallback(async (targetUserId) => {
        try {
            const response = await api.get(`/webrtc/verify-access/${targetUserId}`);
            return response.data;
        } catch (e) {
            console.error("Verify call access error:", e);
            throw new Error(e.response?.data?.message || "Failed to verify call access");
        }
    }, []);

    // 10c. GET IN-APP NOTIFICATIONS
    const getNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false) => {
        try {
            const response = await api.get("/notifications", {
                params: { page, limit, unreadOnly },
            });
            if (response.data) {
                if (typeof response.data.unreadCount === "number") {
                    setUnreadNotificationCount(response.data.unreadCount);
                }
                if (Array.isArray(response.data.notifications)) {
                    setNotifications(response.data.notifications);
                }
            }
            return response.data;
        } catch (e) {
            console.error("Get notifications error:", e);
            throw new Error(e.response?.data?.message || "Failed to load notifications");
        }
    }, []);

    // 10d. GET UNREAD NOTIFICATION COUNT
    const getUnreadNotificationCount = useCallback(async () => {
        try {
            const response = await api.get("/notifications/unread-count");
            if (response.data && typeof response.data.unreadCount === "number") {
                setUnreadNotificationCount(response.data.unreadCount);
            }
            return response.data?.unreadCount || 0;
        } catch (e) {
            console.debug("Get unread notification count error:", e);
            return 0;
        }
    }, []);

    // 10e. MARK NOTIFICATION AS READ
    const markNotificationRead = useCallback(async (notificationId) => {
        try {
            const response = await api.patch(`/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
            );
            setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
            return response.data;
        } catch (e) {
            console.error("Mark notification read error:", e);
        }
    }, []);

    // 10f. MARK ALL NOTIFICATIONS AS READ
    const markAllNotificationsRead = useCallback(async () => {
        try {
            const response = await api.patch("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadNotificationCount(0);
            return response.data;
        } catch (e) {
            console.error("Mark all notifications read error:", e);
        }
    }, []);

    // 10g. GET AUTHORITATIVE UNREAD CHAT COUNT
    const getUnreadChatCount = useCallback(async () => {
        try {
            const response = await api.get("/conversations/unread-count");
            if (response.data && typeof response.data.unreadCount === "number") {
                setUnreadChatCount(response.data.unreadCount);
                return response.data.unreadCount;
            }
            return 0;
        } catch (e) {
            console.debug("Get unread chat count error:", e);
            return 0;
        }
    }, []);

    // 10h. GET AUTHORITATIVE UNSEEN MISSED CALL COUNT
    const getMissedCallCount = useCallback(async () => {
        try {
            const response = await api.get("/calls/missed-count");
            if (response.data && typeof response.data.count === "number") {
                setUnseenMissedCallCount(response.data.count);
                return response.data.count;
            }
            return 0;
        } catch (e) {
            console.debug("Get missed call count error:", e);
            return 0;
        }
    }, []);

    // 10i. GET CALL HISTORY
    const getCallHistory = useCallback(async (page = 1, limit = 20, type = "all", status = "all") => {
        try {
            const response = await api.get("/calls/history", {
                params: { page, limit, type, status },
            });
            if (response.data && typeof response.data.unseenMissedCount === "number") {
                setUnseenMissedCallCount(response.data.unseenMissedCount);
            }
            return response.data;
        } catch (e) {
            console.error("Get call history error:", e);
            throw new Error(e.response?.data?.message || "Failed to load call history");
        }
    }, []);

    // 10j. MARK MISSED CALLS AS SEEN
    const markMissedCallsAsSeen = useCallback(async () => {
        try {
            const response = await api.post("/calls/mark-seen");
            setUnseenMissedCallCount(0);
            return response.data;
        } catch (e) {
            console.error("Mark missed calls as seen error:", e);
        }
    }, []);

    // Automatic re-sync on window focus / network recovery
    useEffect(() => {
        if (!userData) return;
        const onSync = () => {
            getUnreadChatCount().catch(() => {});
            getUnreadNotificationCount().catch(() => {});
            getMissedCallCount().catch(() => {});
        };
        window.addEventListener("focus", onSync);
        window.addEventListener("online", onSync);
        return () => {
            window.removeEventListener("focus", onSync);
            window.removeEventListener("online", onSync);
        };
    }, [userData, getUnreadChatCount, getUnreadNotificationCount, getMissedCallCount]);

    // 11. GET CONVERSATIONS LIST
    const getConversations = useCallback(async () => {
        try {
            const response = await api.get("/conversations");
            if (response.data && Array.isArray(response.data.conversations)) {
                const total = response.data.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setUnreadChatCount(total);
            }
            return response.data;
        } catch (err) {
            console.error("Get conversations error:", err);
            throw new Error(err.response?.data?.message || "Failed to load conversations");
        }
    }, []);

    // 12. GET OR CREATE CONVERSATION BY MATCH ID
    const getOrCreateConversationByMatch = useCallback(async (matchId) => {
        try {
            const response = await api.get(`/conversations/match/${matchId}`);
            return response.data;
        } catch (err) {
            console.error("Get conversation by match error:", err);
            throw new Error(err.response?.data?.message || "Failed to open conversation");
        }
    }, []);

    // 13. GET CONVERSATION MESSAGES
    const getConversationMessages = useCallback(async (conversationId, pageOrOptions = 1, limit = 40, after = null, before = null) => {
        try {
            let params = {};
            if (typeof pageOrOptions === "object" && pageOrOptions !== null) {
                params = { ...pageOrOptions };
            } else {
                params = { page: pageOrOptions, limit };
                if (after) {
                    params.after = after;
                }
                if (before) {
                    params.before = before;
                }
            }
            const response = await api.get(`/conversations/${conversationId}/messages`, {
                params,
            });
            return response.data;
        } catch (err) {
            console.error("Get messages error:", err);
            throw new Error(err.response?.data?.message || "Failed to load messages");
        }
    }, []);

    // 14. MARK CONVERSATION AS READ
    const markConversationRead = useCallback(async (conversationId) => {
        try {
            const response = await api.put(`/conversations/${conversationId}/read`);
            getUnreadChatCount().catch(() => {});
            return response.data;
        } catch (err) {
            console.error("Mark read error:", err);
        }
    }, [getUnreadChatCount]);

    // 15. SEND MESSAGE (REST FALLBACK)
    const sendMessageRest = useCallback(async (conversationId, content, clientTempId) => {
        try {
            const response = await api.post(`/conversations/${conversationId}/messages`, {
                content,
                clientTempId,
            });
            return response.data;
        } catch (err) {
            console.error("Send message REST error:", err);
            throw new Error(err.response?.data?.message || "Failed to send message");
        }
    }, []);

    // 15b. DELETE MESSAGE FOR ME
    const deleteMessageForMe = useCallback(async (conversationId, messageId) => {
        try {
            const response = await api.delete(`/conversations/${conversationId}/messages/${messageId}/me`);
            getUnreadChatCount().catch(() => {});
            return response.data;
        } catch (err) {
            console.error("Delete message for me error:", err);
            throw new Error(err.response?.data?.message || "Failed to delete message");
        }
    }, [getUnreadChatCount]);

    // 15c. DELETE MESSAGE FOR EVERYONE
    const deleteMessageForEveryone = useCallback(async (conversationId, messageId) => {
        try {
            const response = await api.delete(`/conversations/${conversationId}/messages/${messageId}/everyone`);
            getUnreadChatCount().catch(() => {});
            return response.data;
        } catch (err) {
            console.error("Delete message for everyone error:", err);
            throw new Error(err.response?.data?.message || "Failed to delete message for everyone");
        }
    }, [getUnreadChatCount]);

    // 15d. CLEAR CHAT
    const clearChat = useCallback(async (conversationId) => {
        try {
            const response = await api.post(`/conversations/${conversationId}/clear`);
            getUnreadChatCount().catch(() => {});
            return response.data;
        } catch (err) {
            console.error("Clear chat error:", err);
            throw new Error(err.response?.data?.message || "Failed to clear chat");
        }
    }, [getUnreadChatCount]);

    // 15e. DELETE CHAT
    const deleteChat = useCallback(async (conversationId) => {
        try {
            const response = await api.post(`/conversations/${conversationId}/delete`);
            getUnreadChatCount().catch(() => {});
            return response.data;
        } catch (err) {
            console.error("Delete chat error:", err);
            throw new Error(err.response?.data?.message || "Failed to delete conversation");
        }
    }, [getUnreadChatCount]);

    // 16. BLOCK USER
    const blockUser = useCallback(async (userId, reason) => {
        try {
            const response = await api.post("/safety/block", { userId, reason });
            return response.data;
        } catch (err) {
            console.error("Block user error:", err);
            throw new Error(err.response?.data?.message || "Failed to block user");
        }
    }, []);

    // 17. UNBLOCK USER
    const unblockUser = useCallback(async (userId) => {
        try {
            const response = await api.post("/safety/unblock", { userId });
            return response.data;
        } catch (err) {
            console.error("Unblock user error:", err);
            throw new Error(err.response?.data?.message || "Failed to unblock user");
        }
    }, []);

    // 18. GET BLOCKED USERS
    const getBlockedUsers = useCallback(async () => {
        try {
            const response = await api.get("/safety/blocked");
            return response.data;
        } catch (err) {
            console.error("Get blocked users error:", err);
            throw new Error(err.response?.data?.message || "Failed to load blocked users");
        }
    }, []);

    // 19. REPORT USER
    const reportUser = useCallback(async ({ reportedUserId, category, reason, context, conversationId, callId }) => {
        try {
            const response = await api.post("/safety/report", {
                reportedUserId,
                category,
                reason,
                context,
                conversationId,
                callId,
            });
            return response.data;
        } catch (err) {
            console.error("Report user error:", err);
            throw new Error(err.response?.data?.message || "Failed to submit report");
        }
    }, []);

    // 20. UNMATCH USER
    const unmatchUser = useCallback(async (matchIdOrPayload) => {
        try {
            if (typeof matchIdOrPayload === "object") {
                const response = await api.post("/safety/unmatch", matchIdOrPayload);
                return response.data;
            }
            const response = await api.post(`/matches/${matchIdOrPayload}/unmatch`);
            return response.data;
        } catch (err) {
            console.error("Unmatch error:", err);
            throw new Error(err.response?.data?.message || "Failed to unmatch");
        }
    }, []);

    // Fetch secure STUN/TURN ICE server configuration from authenticated backend
    const getIceServers = useCallback(async () => {
        if (cachedIceServers && Date.now() < cachedIceServersExpiry) {
            return cachedIceServers;
        }
        try {
            const response = await api.get("/webrtc/ice-servers");
            if (response.data && response.data.iceServers) {
                cachedIceServers = response.data;
                cachedIceServersExpiry = Date.now() + 5 * 60 * 1000;
            }
            return response.data;
        } catch (err) {
            console.warn("Failed to fetch ICE servers from backend, falling back to STUN defaults:", err?.message);
            return {
                success: false,
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                    { urls: "stun:stun2.l.google.com:19302" },
                ],
                iceTransportPolicy: "all",
                hasTurn: false,
            };
        }
    }, []);

    // Submit privacy-sanitized WebRTC connection diagnostics
    const sendWebRTCDiagnostics = useCallback(async (diagnosticPayload) => {
        try {
            const response = await api.post("/webrtc/diagnostics", diagnosticPayload);
            return response.data;
        } catch (err) {
            // Diagnostic reporting failure must never disrupt real-time communication
            console.debug("WebRTC diagnostics submission skipped:", err?.message);
            return null;
        }
    }, []);

    // Instagram-inspired Search & People Discovery
    const searchUsers = useCallback(async (query, page = 1, limit = 20) => {
        try {
            const response = await api.get(`/users/search?q=${encodeURIComponent(query || "")}&page=${page}&limit=${limit}`);
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to search users";
            const error = new Error(message);
            error.status = err.response?.status;
            throw error;
        }
    }, []);

    const getPublicUserProfile = useCallback(async (userId) => {
        try {
            const response = await api.get(`/users/profile/public/${encodeURIComponent(userId)}`);
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to fetch user profile";
            const error = new Error(message);
            error.status = err.response?.status;
            throw error;
        }
    }, []);

    // Privacy Settings API
    const getPrivacySettings = useCallback(async () => {
        try {
            const response = await api.get("/users/privacy");
            return response.data?.privacySettings;
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to fetch privacy settings";
            const error = new Error(message);
            error.status = err.response?.status;
            throw error;
        }
    }, []);

    const updatePrivacySettings = useCallback(async (settings) => {
        try {
            const response = await api.put("/users/privacy", settings);
            if (response.data && response.data.privacySettings) {
                setUserData((prev) => (prev ? { ...prev, privacySettings: response.data.privacySettings } : prev));
            }
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to update privacy settings";
            const error = new Error(message);
            error.status = err.response?.status;
            throw error;
        }
    }, []);

    const value = useMemo(() => ({
        userData,
        setUserData,
        token,
        loading,
        isAuthenticated: Boolean(token),
        notifications,
        setNotifications,
        unreadNotificationCount,
        unreadChatCount,
        setUnreadChatCount,
        getUnreadChatCount,
        unseenMissedCallCount,
        setUnseenMissedCallCount,
        getMissedCallCount,
        getCallHistory,
        markMissedCallsAsSeen,
        likesYouCount,
        handleRegister,
        handleLogin,
        handleGoogleLogin,
        handleLogout,
        getProfile,
        updateProfile,
        getDiscoveryPreferences,
        updateDiscoveryPreferences,
        getDiscovery,
        sendSwipe,
        resetDiscoveryFeed,
        getMatches,
        getLikesYou,
        sendMatchRequest,
        getIncomingMatchRequests,
        getOutgoingMatchRequests,
        acceptMatchRequest,
        declineMatchRequest,
        verifyCallAccess,
        searchUsers,
        getPublicUserProfile,
        getNotifications,
        getUnreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        getConversations,
        getOrCreateConversationByMatch,
        getConversationMessages,
        markConversationRead,
        sendMessageRest,
        deleteMessageForMe,
        deleteMessageForEveryone,
        clearChat,
        deleteChat,
        blockUser,
        unblockUser,
        getBlockedUsers,
        reportUser,
        unmatchUser,
        getIceServers,
        sendWebRTCDiagnostics,
        requestPhotoUploadUrl,
        uploadPhotoBinary,
        confirmPhotoUpload,
        deleteProfilePhoto,
        getPrivacySettings,
        updatePrivacySettings,
        checkUsernameAvailability,
        setupUsername,
        getUsernameEligibility,
        updateUsername,
    }), [
        userData,
        token,
        loading,
        notifications,
        unreadNotificationCount,
        unreadChatCount,
        getUnreadChatCount,
        unseenMissedCallCount,
        getMissedCallCount,
        getCallHistory,
        markMissedCallsAsSeen,
        likesYouCount,
        handleRegister,
        handleLogin,
        handleGoogleLogin,
        handleLogout,
        getProfile,
        updateProfile,
        getDiscoveryPreferences,
        updateDiscoveryPreferences,
        getDiscovery,
        sendSwipe,
        resetDiscoveryFeed,
        getMatches,
        getLikesYou,
        sendMatchRequest,
        getIncomingMatchRequests,
        getOutgoingMatchRequests,
        acceptMatchRequest,
        declineMatchRequest,
        verifyCallAccess,
        searchUsers,
        getPublicUserProfile,
        getNotifications,
        getUnreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        getConversations,
        getOrCreateConversationByMatch,
        getConversationMessages,
        markConversationRead,
        sendMessageRest,
        deleteMessageForMe,
        deleteMessageForEveryone,
        clearChat,
        deleteChat,
        blockUser,
        unblockUser,
        getBlockedUsers,
        reportUser,
        unmatchUser,
        getIceServers,
        sendWebRTCDiagnostics,
        requestPhotoUploadUrl,
        uploadPhotoBinary,
        confirmPhotoUpload,
        deleteProfilePhoto,
        getPrivacySettings,
        updatePrivacySettings,
        checkUsernameAvailability,
        setupUsername,
        getUsernameEligibility,
        updateUsername,
    ]);

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
