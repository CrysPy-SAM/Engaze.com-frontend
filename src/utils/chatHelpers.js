/**
 * Pure helper utilities for deterministic chat message ordering,
 * deduplication, optimistic reconciliation, sender normalization, and conversation isolation.
 */

/**
 * Normalizes an entity or ID to a trimmed string identifier.
 * Safely resolves nested _id, id, string representations, or MongoDB ObjectId-like objects.
 *
 * @param {any} entity
 * @returns {string}
 */
export function normalizeEntityId(entity) {
    if (!entity) return "";
    if (typeof entity === "string") return entity.trim();
    if (typeof entity === "number") return String(entity);

    if (entity._id) {
        return normalizeEntityId(entity._id);
    }
    if (entity.id) {
        return normalizeEntityId(entity.id);
    }

    if (typeof entity.toHexString === "function") {
        return entity.toHexString();
    }
    if (typeof entity.toString === "function") {
        const str = entity.toString();
        if (str && str !== "[object Object]") {
            return str.trim();
        }
    }

    return "";
}

/**
 * Extracts the canonical sender string identifier from a message record.
 * Handles populated sender objects, unpopulated ID strings/ObjectIds, and senderId aliases.
 *
 * @param {Object} message
 * @returns {string}
 */
export function getMessageSenderId(message) {
    if (!message) return "";

    if (message.sender) {
        const id = normalizeEntityId(message.sender);
        if (id) return id;
    }

    if (message.senderId) {
        const id = normalizeEntityId(message.senderId);
        if (id) return id;
    }

    return "";
}

/**
 * Pure predicate determining whether a message was authored by the current authenticated user.
 * Outgoing messages must render aligned to the right, styled with primary gradient styling,
 * and display delivery/read status indicators.
 *
 * Invariants:
 * 1. Normalized string comparison on sender ID against currentUser ID.
 * 2. Works uniformly across optimistic messages, server acknowledgements, socket broadcasts, and loaded history.
 * 3. Never relies on display names, text content, or UI order.
 * 4. Returns false if either sender ID or current user ID cannot be determined.
 *
 * @param {Object} message
 * @param {Object|string} currentUser
 * @returns {boolean}
 */
export function isOutgoingMessage(message, currentUser) {
    const msgSenderId = getMessageSenderId(message);
    const currentUserId = normalizeEntityId(currentUser);

    if (!msgSenderId || !currentUserId) return false;
    return msgSenderId === currentUserId;
}

/**
 * Safely merges sender profiles during reconciliation, preserving valid names,
 * photos, and _id properties even if the incoming update is sparse or unpopulated.
 *
 * @param {Object} existing
 * @param {Object} incoming
 * @returns {Object}
 */
function mergeMessageSender(existing, incoming) {
    const existingSenderId = getMessageSenderId(existing);
    const incomingSenderId = getMessageSenderId(incoming);
    const resolvedSenderId = incomingSenderId || existingSenderId;

    const existingName = (typeof existing?.sender?.name === "string" && existing.sender.name.trim() && existing.sender.name !== "Engaze Member")
        ? existing.sender.name
        : "";
    const incomingName = (typeof incoming?.sender?.name === "string" && incoming.sender.name.trim() && incoming.sender.name !== "Engaze Member")
        ? incoming.sender.name
        : "";

    const existingPhotos = Array.isArray(existing?.sender?.photos) && existing.sender.photos.length > 0
        ? existing.sender.photos
        : [];
    const incomingPhotos = Array.isArray(incoming?.sender?.photos) && incoming.sender.photos.length > 0
        ? incoming.sender.photos
        : [];

    return {
        _id: resolvedSenderId || undefined,
        name: incomingName || existingName || incoming?.sender?.name || existing?.sender?.name || "Engaze Member",
        photos: incomingPhotos.length > 0 ? incomingPhotos : (existingPhotos.length > 0 ? existingPhotos : []),
    };
}

/**
 * Deterministically sorts a list of messages by createdAt timestamp ascending,
 * using the message _id or clientTempId as a tie-breaker.
 *
 * @param {Array<Object>} msgList
 * @returns {Array<Object>}
 */
export function sortMessagesDeterministic(msgList) {
    if (!Array.isArray(msgList)) return [];
    return [...msgList].sort((a, b) => {
        const timeA = new Date(a?.createdAt || 0).getTime();
        const timeB = new Date(b?.createdAt || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
        const keyA = String(a?._id || a?.clientTempId || "");
        const keyB = String(b?._id || b?.clientTempId || "");
        return keyA.localeCompare(keyB);
    });
}

/**
 * Reconciles a single incoming message (from live Socket.IO broadcast or send acknowledgement)
 * with the existing message list.
 *
 * Invariants:
 * 1. Matches optimistic entry by clientTempId first, updating in place and preserving sender identity.
 * 2. Matches existing entry by _id, updating in place.
 * 3. Appends new message if no match exists.
 * 4. Preserves deterministic chronological order.
 *
 * @param {Array<Object>} prevMessages
 * @param {Object} incomingMsg
 * @returns {Array<Object>}
 */
export function reconcileSingleMessage(prevMessages, incomingMsg) {
    if (!incomingMsg) return prevMessages || [];
    const list = Array.isArray(prevMessages) ? prevMessages : [];

    // 1. Match by clientTempId
    if (incomingMsg.clientTempId) {
        const tempIdx = list.findIndex(
            (m) => m?.clientTempId && m.clientTempId === incomingMsg.clientTempId
        );
        if (tempIdx !== -1) {
            const copy = [...list];
            const existing = copy[tempIdx];
            copy[tempIdx] = {
                ...existing,
                ...incomingMsg,
                sender: mergeMessageSender(existing, incomingMsg),
                status: "sent",
            };
            return sortMessagesDeterministic(copy);
        }
    }

    // 2. Match by _id
    if (incomingMsg._id) {
        const idIdx = list.findIndex(
            (m) => m?._id && m._id.toString() === incomingMsg._id.toString()
        );
        if (idIdx !== -1) {
            const copy = [...list];
            const existing = copy[idIdx];
            copy[idIdx] = {
                ...existing,
                ...incomingMsg,
                sender: mergeMessageSender(existing, incomingMsg),
                status: "sent",
            };
            return sortMessagesDeterministic(copy);
        }
    }

    // 3. New message: append
    const resolvedSenderId = getMessageSenderId(incomingMsg);
    const newSender = typeof incomingMsg.sender === "object" && incomingMsg.sender !== null
        ? {
            ...incomingMsg.sender,
            _id: resolvedSenderId || incomingMsg.sender._id,
        }
        : {
            _id: resolvedSenderId || undefined,
            name: "Engaze Member",
            photos: [],
        };

    return sortMessagesDeterministic([...list, { ...incomingMsg, sender: newSender, status: incomingMsg.status || "sent" }]);
}

/**
 * Reconciles a batch of messages (from REST history or missed-message cursor recovery)
 * with the current message list.
 *
 * Invariants:
 * 1. Preserves pending or failed optimistic messages currently in flight.
 * 2. Updates matching entries in place while preserving sender identity.
 * 3. Never produces duplicate entries for the same logical message.
 * 4. Guarantees deterministic chronological sorting.
 *
 * @param {Array<Object>} prevMessages
 * @param {Array<Object>} incomingBatch
 * @returns {Array<Object>}
 */
export function reconcileBatchMessages(prevMessages, incomingBatch) {
    let current = Array.isArray(prevMessages) ? [...prevMessages] : [];
    if (!Array.isArray(incomingBatch) || incomingBatch.length === 0) {
        return sortMessagesDeterministic(current);
    }

    for (const inc of incomingBatch) {
        if (!inc) continue;

        if (inc.clientTempId) {
            const tempIdx = current.findIndex(
                (m) => m?.clientTempId && m.clientTempId === inc.clientTempId
            );
            if (tempIdx !== -1) {
                const existing = current[tempIdx];
                current[tempIdx] = {
                    ...existing,
                    ...inc,
                    sender: mergeMessageSender(existing, inc),
                    status: "sent",
                };
                continue;
            }
        }

        if (inc._id) {
            const idIdx = current.findIndex(
                (m) => m?._id && m._id.toString() === inc._id.toString()
            );
            if (idIdx !== -1) {
                const existing = current[idIdx];
                current[idIdx] = {
                    ...existing,
                    ...inc,
                    sender: mergeMessageSender(existing, inc),
                    status: "sent",
                };
                continue;
            }
        }

        const resolvedSenderId = getMessageSenderId(inc);
        const newSender = typeof inc.sender === "object" && inc.sender !== null
            ? {
                ...inc.sender,
                _id: resolvedSenderId || inc.sender._id,
            }
            : {
                _id: resolvedSenderId || undefined,
                name: "Engaze Member",
                photos: [],
            };

        current.push({ ...inc, sender: newSender, status: inc.status || "sent" });
    }

    return sortMessagesDeterministic(current);
}

/**
 * Checks whether an asynchronous response corresponds to the currently active conversation.
 *
 * @param {string|null|undefined} activeConvId
 * @param {string|null|undefined} responseConvId
 * @returns {boolean} True if response is stale and must be ignored
 */
export function isStaleConversationResponse(activeConvId, responseConvId) {
    if (!activeConvId || !responseConvId) return true;
    return activeConvId.toString() !== responseConvId.toString();
}
