import axios from "axios";
import httpStatus from "http-status";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

// Base API client pointing to /api/v1
const api = axios.create({
    baseURL: `${server}/api/v1`,
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
            console.warn("Stored token is invalid or expired, resetting session.");
            localStorage.removeItem("token");
            setUserData(null);
            setToken(null);
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
    const handleRegister = async (name, username, password) => {
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
                }
                return response.data.message || "Registration successful!";
            } else {
                throw new Error(response.data?.message || "Registration failed");
            }
        } catch (err) {
            console.error("Registration error:", err);
            const msg =
                err.response?.data?.message ||
                err.message ||
                "Server connection error. Please try again.";
            throw new Error(msg);
        }
    };

    // 2. LOGIN
    const handleLogin = async (username, password) => {
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
            const msg =
                err.response?.data?.message ||
                err.message ||
                "Unable to reach the server. Please check backend.";
            throw new Error(msg);
        }
    };

    // 3. LOGOUT
    const handleLogout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUserData(null);
        router("/auth");
    };

    // 4. GET PROFILE
    const getProfile = async () => {
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
    };

    // 5. UPDATE PROFILE
    const updateProfile = async (profileData) => {
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
    };

    // 6. USER HISTORY FETCH
    const getHistoryOfUser = async () => {
        try {
            const response = await api.get("/users/get_all_activity");
            return response.data;
        } catch (err) {
            console.error("Get history error:", err);
            throw new Error(err.response?.data?.message || "Failed to fetch history");
        }
    };

    // 7. ADD TO HISTORY
    const addToUserHistory = async (meetingCode) => {
        try {
            const response = await api.post("/users/add_to_activity", {
                meeting_code: meetingCode,
            });
            return response.data;
        } catch (e) {
            console.error("Add to history error:", e);
            throw new Error(e.response?.data?.message || "Unable to save meeting history");
        }
    };

    // 8. DATING DISCOVERY FEED
    const getDiscovery = async (page = 1, limit = 10) => {
        try {
            const response = await api.get("/discovery", {
                params: { page, limit },
            });
            return response.data;
        } catch (e) {
            console.error("Get discovery error:", e);
            throw new Error(e.response?.data?.message || "Failed to load discovery profiles");
        }
    };

    // 9. SWIPE (LIKE / PASS)
    const sendSwipe = async (targetUserId, action) => {
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
    };

    // 10. GET MUTUAL MATCHES
    const getMatches = async (page = 1, limit = 20) => {
        try {
            const response = await api.get("/matches", {
                params: { page, limit },
            });
            return response.data;
        } catch (e) {
            console.error("Get matches error:", e);
            throw new Error(e.response?.data?.message || "Failed to load matches");
        }
    };

    // 11. GET CONVERSATIONS LIST
    const getConversations = async () => {
        try {
            const response = await api.get("/conversations");
            return response.data;
        } catch (err) {
            console.error("Get conversations error:", err);
            throw new Error(err.response?.data?.message || "Failed to load conversations");
        }
    };

    // 12. GET OR CREATE CONVERSATION BY MATCH ID
    const getOrCreateConversationByMatch = async (matchId) => {
        try {
            const response = await api.get(`/conversations/match/${matchId}`);
            return response.data;
        } catch (err) {
            console.error("Get conversation by match error:", err);
            throw new Error(err.response?.data?.message || "Failed to open conversation");
        }
    };

    // 13. GET CONVERSATION MESSAGES
    const getConversationMessages = async (conversationId, page = 1, limit = 40) => {
        try {
            const response = await api.get(`/conversations/${conversationId}/messages`, {
                params: { page, limit },
            });
            return response.data;
        } catch (err) {
            console.error("Get messages error:", err);
            throw new Error(err.response?.data?.message || "Failed to load messages");
        }
    };

    // 14. MARK CONVERSATION AS READ
    const markConversationRead = async (conversationId) => {
        try {
            const response = await api.put(`/conversations/${conversationId}/read`);
            return response.data;
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    // 15. SEND MESSAGE (REST FALLBACK)
    const sendMessageRest = async (conversationId, content, clientTempId) => {
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
    };

    const value = {
        userData,
        setUserData,
        token,
        loading,
        isAuthenticated: Boolean(token),
        handleRegister,
        handleLogin,
        handleLogout,
        getProfile,
        updateProfile,
        addToUserHistory,
        getHistoryOfUser,
        getDiscovery,
        sendSwipe,
        getMatches,
        getConversations,
        getOrCreateConversationByMatch,
        getConversationMessages,
        markConversationRead,
        sendMessageRest,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
