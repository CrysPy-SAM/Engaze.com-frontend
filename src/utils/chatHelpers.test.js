import {
    sortMessagesDeterministic,
    reconcileSingleMessage,
    reconcileBatchMessages,
    isStaleConversationResponse,
} from "./chatHelpers";

describe("Prompt 9.1: Frontend Chat Reliability & Reconciliation Helpers", () => {
    describe("sortMessagesDeterministic", () => {
        it("sorts messages in strictly ascending order by timestamp", () => {
            const list = [
                { _id: "3", createdAt: "2026-10-18T10:15:00.000Z" },
                { _id: "1", createdAt: "2026-10-18T10:05:00.000Z" },
                { _id: "2", createdAt: "2026-10-18T10:10:00.000Z" },
            ];

            const sorted = sortMessagesDeterministic(list);
            expect(sorted.map((m) => m._id)).toEqual(["1", "2", "3"]);
        });

        it("breaks ties deterministically using _id or clientTempId when timestamps are identical", () => {
            const sameTime = "2026-10-18T10:00:00.000Z";
            const list = [
                { _id: "msg_c", createdAt: sameTime },
                { _id: "msg_a", createdAt: sameTime },
                { _id: "msg_b", createdAt: sameTime },
            ];

            const sorted = sortMessagesDeterministic(list);
            expect(sorted.map((m) => m._id)).toEqual(["msg_a", "msg_b", "msg_c"]);
        });
    });

    describe("reconcileSingleMessage", () => {
        it("reconciles an optimistic message by clientTempId and updates status to sent", () => {
            const clientTempId = "temp_alice_001";
            const prev = [
                {
                    _id: clientTempId,
                    clientTempId,
                    content: "Hello from Alice",
                    status: "pending",
                    createdAt: "2026-10-18T10:00:00.000Z",
                },
            ];

            const canonicalAck = {
                _id: "65cb1234567890abcdef1234",
                clientTempId,
                content: "Hello from Alice",
                createdAt: "2026-10-18T10:00:00.000Z",
            };

            const result = reconcileSingleMessage(prev, canonicalAck);

            expect(result).toHaveLength(1);
            expect(result[0]._id).toBe("65cb1234567890abcdef1234");
            expect(result[0].status).toBe("sent");
        });

        it("does not create duplicate entry when the same message is delivered twice", () => {
            const msg = {
                _id: "65cb99999999999999999999",
                content: "Live broadcast",
                createdAt: "2026-10-18T10:00:00.000Z",
            };

            let list = reconcileSingleMessage([], msg);
            list = reconcileSingleMessage(list, msg);

            expect(list).toHaveLength(1);
            expect(list[0]._id).toBe("65cb99999999999999999999");
        });
    });

    describe("reconcileBatchMessages", () => {
        it("preserves in-flight pending or failed optimistic messages while merging historical records", () => {
            const pendingOptimistic = {
                _id: "temp_sending_002",
                clientTempId: "temp_sending_002",
                content: "In-flight message",
                status: "pending",
                createdAt: "2026-10-18T10:20:00.000Z",
            };

            const prev = [pendingOptimistic];

            const historyBatch = [
                { _id: "hist_1", content: "Older message 1", createdAt: "2026-10-18T10:00:00.000Z" },
                { _id: "hist_2", content: "Older message 2", createdAt: "2026-10-18T10:10:00.000Z" },
            ];

            const merged = reconcileBatchMessages(prev, historyBatch);

            expect(merged).toHaveLength(3);
            expect(merged.map((m) => m._id)).toEqual(["hist_1", "hist_2", "temp_sending_002"]);
            expect(merged[2].status).toBe("pending");
        });

        it("reconciles history when a live socket event arrived before the REST history call resolved", () => {
            const liveSocketMsg = {
                _id: "live_msg_3",
                content: "Live event arrived early",
                createdAt: "2026-10-18T10:15:00.000Z",
            };

            // Live event arrived first
            let list = reconcileSingleMessage([], liveSocketMsg);

            // History response arrives later containing older messages AND the live message
            const historyBatch = [
                { _id: "hist_1", content: "Msg 1", createdAt: "2026-10-18T10:05:00.000Z" },
                { _id: "hist_2", content: "Msg 2", createdAt: "2026-10-18T10:10:00.000Z" },
                { _id: "live_msg_3", content: "Live event arrived early", createdAt: "2026-10-18T10:15:00.000Z" },
            ];

            list = reconcileBatchMessages(list, historyBatch);

            expect(list).toHaveLength(3);
            expect(list.map((m) => m._id)).toEqual(["hist_1", "hist_2", "live_msg_3"]);
        });
    });

    describe("isStaleConversationResponse", () => {
        it("returns true if active conversation does not match the response conversation", () => {
            expect(isStaleConversationResponse("conv_A", "conv_B")).toBe(true);
        });

        it("returns false if active conversation matches the response conversation", () => {
            expect(isStaleConversationResponse("conv_A", "conv_A")).toBe(false);
        });

        it("returns true if active conversation is null or undefined", () => {
            expect(isStaleConversationResponse(null, "conv_A")).toBe(true);
            expect(isStaleConversationResponse("conv_A", undefined)).toBe(true);
        });
    });
});

