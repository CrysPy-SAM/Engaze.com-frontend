/**
 * WhatsApp-Style Presence & Last Seen Timestamp Formatters for Engaze
 */

/**
 * Formats a Date object or ISO timestamp string into a WhatsApp-style last seen string.
 * Uses client-local timezone formatting for accurate relative time display.
 * 
 * Examples:
 * - "last seen today at 8:35 PM"
 * - "last seen yesterday at 6:20 PM"
 * - "last seen Oct 18 at 4:15 PM"
 * - "last seen 15/10/2025 at 4:15 PM"
 * - "" (empty string when null, undefined, or invalid)
 * 
 * @param {Date|string|number|null|undefined} lastSeenAt 
 * @param {Date} [now=new Date()] Optional reference date for deterministic testing
 * @returns {string}
 */
export const formatLastSeen = (lastSeenAt, now = new Date()) => {
    if (!lastSeenAt) return "";

    const date = lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
    if (isNaN(date.getTime())) return "";

    const ref = now instanceof Date ? now : new Date(now);

    // Format local time (e.g. "8:35 PM")
    const timeStr = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    // Determine calendar date difference
    const isToday =
        date.getFullYear() === ref.getFullYear() &&
        date.getMonth() === ref.getMonth() &&
        date.getDate() === ref.getDate();

    if (isToday) {
        return `last seen today at ${timeStr}`;
    }

    const yesterday = new Date(ref);
    yesterday.setDate(ref.getDate() - 1);
    const isYesterday =
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();

    if (isYesterday) {
        return `last seen yesterday at ${timeStr}`;
    }

    const isSameYear = date.getFullYear() === ref.getFullYear();
    if (isSameYear) {
        const monthDayStr = date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
        });
        return `last seen ${monthDayStr} at ${timeStr}`;
    }

    const fullDateStr = date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    return `last seen ${fullDateStr} at ${timeStr}`;
};

/**
 * Formats structured presence information for chat headers and profile headers.
 * 
 * @param {boolean|null|undefined} isOnline 
 * @param {Date|string|number|null|undefined} lastSeenAt 
 * @param {Date} [now=new Date()]
 * @returns {{ status: "online"|"offline"|"hidden", text: string }}
 */
export const formatPresenceHeader = (isOnline, lastSeenAt, now = new Date()) => {
    if (Boolean(isOnline)) {
        return {
            status: "online",
            text: "Online",
        };
    }

    const lastSeenText = formatLastSeen(lastSeenAt, now);
    if (lastSeenText) {
        return {
            status: "offline",
            text: lastSeenText,
        };
    }

    return {
        status: "hidden",
        text: "",
    };
};
