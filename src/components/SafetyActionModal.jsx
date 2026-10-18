import React, { useState } from "react";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export const REPORT_CATEGORIES = [
    { value: "harassment", label: "Harassment or Bullying" },
    { value: "inappropriate_content", label: "Inappropriate or Explicit Content" },
    { value: "spam_or_scam", label: "Spam or Scam" },
    { value: "underage", label: "Suspected Underage User" },
    { value: "fake_profile", label: "Fake Profile or Impersonation" },
    { value: "hate_speech", label: "Hate Speech or Discrimination" },
    { value: "other", label: "Other Safety Concern" },
];

/**
 * Reusable modal for Dating Safety: Block, Report, and Unmatch actions.
 */
export default function SafetyActionModal({
    isOpen,
    onClose,
    actionType, // "block" | "report" | "unmatch"
    targetUser, // { _id, name }
    matchId,
    conversationId,
    callId,
    context = "profile", // "profile" | "chat" | "call"
    onSuccess,
    onBlockUser,
    onReportUser,
    onUnmatchUser,
}) {
    const [category, setCategory] = useState("inappropriate_content");
    const [reason, setReason] = useState("");
    const [alsoBlock, setAlsoBlock] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const targetName = targetUser?.name || "this user";
    const targetUserId = targetUser?._id;

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);
        try {
            if (actionType === "unmatch") {
                if (onUnmatchUser) {
                    if (matchId) {
                        await onUnmatchUser(matchId);
                    } else if (targetUserId) {
                        await onUnmatchUser({ targetUserId });
                    }
                }
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                    if (onSuccess) onSuccess({ action: "unmatch", matchId, userId: targetUserId });
                }, 1000);
            } else if (actionType === "block") {
                if (onBlockUser && targetUserId) {
                    await onBlockUser(targetUserId, reason);
                }
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                    if (onSuccess) onSuccess({ action: "block", userId: targetUserId });
                }, 1000);
            } else if (actionType === "report") {
                if (onReportUser && targetUserId) {
                    await onReportUser({
                        reportedUserId: targetUserId,
                        category,
                        reason,
                        context,
                        conversationId,
                        callId,
                    });
                }
                if (alsoBlock && onBlockUser && targetUserId) {
                    try {
                        await onBlockUser(targetUserId, `Reported for ${category}`);
                    } catch (e) {
                        // Report already submitted; non-fatal if block fails
                    }
                }
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                    if (onSuccess) onSuccess({ action: "report", userId: targetUserId, alsoBlocked: alsoBlock });
                }, 1200);
            }
        } catch (err) {
            setError(err.message || "An error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
        }}>
            <div style={{
                position: "relative",
                width: "100%",
                maxWidth: "440px",
                backgroundColor: "#131625",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "24px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
                padding: "24px",
                overflow: "hidden",
                color: "#FFFFFF",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            }}>
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "16px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {actionType === "report" && (
                            <div style={{
                                padding: "6px 8px",
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                color: "#F59E0B",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                            }}>
                                <SecurityRoundedIcon sx={{ fontSize: 20 }} />
                            </div>
                        )}
                        {actionType === "block" && (
                            <div style={{
                                padding: "6px 8px",
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                color: "#EF4444",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                            }}>
                                <BlockRoundedIcon sx={{ fontSize: 20 }} />
                            </div>
                        )}
                        {actionType === "unmatch" && (
                            <div style={{
                                padding: "6px 8px",
                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                                color: "#D1D5DB",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                            }}>
                                <WarningRoundedIcon sx={{ fontSize: 20 }} />
                            </div>
                        )}
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#FFFFFF" }}>
                            {actionType === "report" && `Report ${targetName}`}
                            {actionType === "block" && `Block ${targetName}?`}
                            {actionType === "unmatch" && `Unmatch ${targetName}?`}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255, 255, 255, 0.6)",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "8px",
                        }}
                    >
                        <CloseRoundedIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {submitted ? (
                    <div style={{
                        padding: "32px 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: "12px",
                    }}>
                        <CheckCircleRoundedIcon sx={{ fontSize: 52, color: "#10B981" }} />
                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF" }}>
                            {actionType === "report" && "Report Submitted"}
                            {actionType === "block" && "User Blocked"}
                            {actionType === "unmatch" && "Successfully Unmatched"}
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.65)", maxWidth: "320px", lineHeight: 1.5 }}>
                            {actionType === "report" && "Thank you for helping keep our community safe. Our moderation team will investigate."}
                            {actionType === "block" && "You will no longer see each other or be paired in video calls and chats."}
                            {actionType === "unmatch" && "This connection has been removed from your active matches."}
                        </p>
                    </div>
                ) : (
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {error && (
                            <div style={{
                                padding: "10px 14px",
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#EF4444",
                                fontSize: "0.8rem",
                                borderRadius: "12px",
                            }}>
                                {error}
                            </div>
                        )}

                        {actionType === "unmatch" && (
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6 }}>
                                Are you sure you want to unmatch with <strong style={{ color: "#FFFFFF" }}>{targetName}</strong>?
                                You will no longer be able to message each other, and this action cannot be undone.
                            </p>
                        )}

                        {actionType === "block" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6 }}>
                                    Blocking <strong style={{ color: "#FFFFFF" }}>{targetName}</strong> will immediately end active calls, remove existing matches, and prevent all future interactions across Discovery, Chat, and Random Video.
                                </p>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.6)", marginBottom: "6px" }}>
                                        Reason (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Why are you blocking this user?"
                                        maxLength={500}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 14px",
                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "12px",
                                            fontSize: "0.88rem",
                                            color: "#FFFFFF",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {actionType === "report" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.55)" }}>
                                    Your report is confidential. The reported user will not know who submitted it.
                                </p>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
                                        Category <span style={{ color: "#EF4444" }}>*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 14px",
                                            backgroundColor: "#1B1E32",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "12px",
                                            fontSize: "0.88rem",
                                            color: "#FFFFFF",
                                            outline: "none",
                                        }}
                                    >
                                        {REPORT_CATEGORIES.map((c) => (
                                            <option key={c.value} value={c.value} style={{ backgroundColor: "#131625", color: "#FFFFFF" }}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
                                        Details (optional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="Please provide any additional details to help our moderation team..."
                                        maxLength={1000}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 14px",
                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                            borderRadius: "12px",
                                            fontSize: "0.88rem",
                                            color: "#FFFFFF",
                                            outline: "none",
                                            resize: "none",
                                        }}
                                    />
                                </div>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.8)", cursor: "pointer", paddingTop: "4px" }}>
                                    <input
                                        type="checkbox"
                                        checked={alsoBlock}
                                        onChange={(e) => setAlsoBlock(e.target.checked)}
                                        style={{ width: "16px", height: "16px", accentColor: "#FD3A73", cursor: "pointer" }}
                                    />
                                    <span>Also block this user so they cannot contact me again</span>
                                </label>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "12px",
                            paddingTop: "14px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                style={{
                                    padding: "8px 16px",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    color: "rgba(255, 255, 255, 0.6)",
                                    background: "transparent",
                                    border: "none",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={loading}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "0.88rem",
                                    fontWeight: 700,
                                    borderRadius: "12px",
                                    color: "#FFFFFF",
                                    border: "none",
                                    cursor: "pointer",
                                    background: actionType === "report"
                                        ? "linear-gradient(135deg, #D97706, #B45309)"
                                        : actionType === "block"
                                        ? "linear-gradient(135deg, #EF4444, #B91C1C)"
                                        : "linear-gradient(135deg, #4B5563, #374151)",
                                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {loading ? "Processing..." : actionType === "report" ? "Submit Report" : actionType === "block" ? "Block User" : "Unmatch"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

