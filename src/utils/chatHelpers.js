/**
 * Pure helper utilities for deterministic chat message ordering,
 * deduplication, optimistic reconciliation, and conversation isolation.
 */

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
 * 1. Matches optimistic entry by clientTempId first, updating in place and setting status to 'sent'.
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
            copy[tempIdx] = { ...copy[tempIdx], ...incomingMsg, status: "sent" };
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
            copy[idIdx] = { ...copy[idIdx], ...incomingMsg, status: "sent" };
            return sortMessagesDeterministic(copy);
        }
    }

    // 3. New message: append
    return sortMessagesDeterministic([...list, { ...incomingMsg, status: "sent" }]);
}

/**
 * Reconciles a batch of messages (from REST history or missed-message cursor recovery)
 * with the current message list.
 * 
 * Invariants:
 * 1. Preserves pending or failed optimistic messages currently in flight.
 * 2. Updates matching entries in place.
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
                current[tempIdx] = { ...current[tempIdx], ...inc, status: "sent" };
                continue;
            }
        }

        if (inc._id) {
            const idIdx = current.findIndex(
                (m) => m?._id && m._id.toString() === inc._id.toString()
            );
            if (idIdx !== -1) {
                current[idIdx] = { ...current[idIdx], ...inc, status: "sent" };
                continue;
            }
        }

        current.push({ ...inc, status: "sent" });
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

