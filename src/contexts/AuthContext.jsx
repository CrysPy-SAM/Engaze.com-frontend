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

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoading] = useState(true);
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
                    router("/home");
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

    // 6. DATING DISCOVERY FEED
    const getDiscovery = useCallback(async (page = 1, limit = 10) => {
        try {
            const response = await api.get("/discovery", {
                params: { page, limit },
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

    // 11. GET CONVERSATIONS LIST
    const getConversations = useCallback(async () => {
        try {
            const response = await api.get("/conversations");
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
    const getConversationMessages = useCallback(async (conversationId, page = 1, limit = 40) => {
        try {
            const response = await api.get(`/conversations/${conversationId}/messages`, {
                params: { page, limit },
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
            return response.data;
        } catch (err) {
            console.error("Mark read error:", err);
        }
    }, []);

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

    const value = useMemo(() => ({
        userData,
        setUserData,
        token,
        loading,
        isAuthenticated: Boolean(token),
        handleRegister,
        handleLogin,
        handleGoogleLogin,
        handleLogout,
        getProfile,
        updateProfile,
        getDiscovery,
        sendSwipe,
        resetDiscoveryFeed,
        getMatches,
        getConversations,
        getOrCreateConversationByMatch,
        getConversationMessages,
        markConversationRead,
        sendMessageRest,
    }), [
        userData,
        token,
        loading,
        handleRegister,
        handleLogin,
        handleGoogleLogin,
        handleLogout,
        getProfile,
        updateProfile,
        getDiscovery,
        sendSwipe,
        resetDiscoveryFeed,
        getMatches,
        getConversations,
        getOrCreateConversationByMatch,
        getConversationMessages,
        markConversationRead,
        sendMessageRest,
    ]);

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
