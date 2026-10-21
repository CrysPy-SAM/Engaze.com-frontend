import {
    sortMessagesDeterministic,
    reconcileSingleMessage,
    reconcileBatchMessages,
    isStaleConversationResponse,
    normalizeEntityId,
    getMessageSenderId,
    isOutgoingMessage,
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

    describe("Prompt 23: Sender Normalization & Outgoing Message Classification", () => {
        const myUserId = "65cf11111111111111111111";
        const partnerUserId = "65cf22222222222222222222";

        describe("normalizeEntityId", () => {
            it("handles plain strings and trims whitespace", () => {
                expect(normalizeEntityId("  65cf11111111111111111111  ")).toBe(myUserId);
            });

            it("handles entity with _id property (nested Mongoose / user objects)", () => {
                expect(normalizeEntityId({ _id: myUserId })).toBe(myUserId);
                expect(normalizeEntityId({ _id: { _id: myUserId } })).toBe(myUserId);
            });

            it("handles entity with id alias", () => {
                expect(normalizeEntityId({ id: myUserId })).toBe(myUserId);
            });

            it("handles ObjectId-like objects with toHexString or toString", () => {
                const mockObjectId = {
                    toHexString: () => myUserId,
                    toString: () => myUserId,
                };
                expect(normalizeEntityId(mockObjectId)).toBe(myUserId);
            });

            it("returns empty string for null, undefined, or empty objects", () => {
                expect(normalizeEntityId(null)).toBe("");
                expect(normalizeEntityId(undefined)).toBe("");
                expect(normalizeEntityId({})).toBe("");
            });
        });

        describe("getMessageSenderId", () => {
            it("extracts ID from populated sender object", () => {
                const msg = {
                    sender: {
                        _id: myUserId,
                        name: "Me",
                        photos: ["https://example.com/me.jpg"],
                    },
                };
                expect(getMessageSenderId(msg)).toBe(myUserId);
            });

            it("extracts ID from unpopulated string sender", () => {
                const msg = { sender: myUserId };
                expect(getMessageSenderId(msg)).toBe(myUserId);
            });

            it("extracts ID from unpopulated ObjectId-like sender", () => {
                const msg = {
                    sender: {
                        toHexString: () => myUserId,
                        toString: () => myUserId,
                    },
                };
                expect(getMessageSenderId(msg)).toBe(myUserId);
            });

            it("extracts ID from senderId field alias", () => {
                const msg = { senderId: myUserId };
                expect(getMessageSenderId(msg)).toBe(myUserId);
            });

            it("returns empty string if sender is missing or null", () => {
                expect(getMessageSenderId(null)).toBe("");
                expect(getMessageSenderId({})).toBe("");
                expect(getMessageSenderId({ sender: null })).toBe("");
            });
        });

        describe("isOutgoingMessage", () => {
            const currentUserObj = {
                _id: myUserId,
                name: "Test User",
                photos: [],
            };

            it("classifies newly created optimistic message as outgoing", () => {
                const optimisticMsg = {
                    _id: "temp_12345",
                    clientTempId: "temp_12345",
                    sender: {
                        _id: myUserId,
                        name: "Test User",
                        photos: [],
                    },
                    status: "pending",
                };
                expect(isOutgoingMessage(optimisticMsg, currentUserObj)).toBe(true);
                expect(isOutgoingMessage(optimisticMsg, myUserId)).toBe(true);
            });

            it("classifies server acknowledgement message as outgoing", () => {
                const ackMsg = {
                    _id: "persisted_real_id",
                    clientTempId: "temp_12345",
                    sender: {
                        _id: myUserId,
                        name: "Test User",
                        photos: [],
                    },
                    status: "sent",
                };
                expect(isOutgoingMessage(ackMsg, currentUserObj)).toBe(true);
            });

            it("classifies message with raw string sender ID as outgoing", () => {
                const msg = {
                    _id: "msg_raw_string",
                    sender: myUserId,
                };
                expect(isOutgoingMessage(msg, currentUserObj)).toBe(true);
            });

            it("classifies message with unpopulated ObjectId sender as outgoing", () => {
                const msg = {
                    _id: "msg_obj_id",
                    sender: {
                        toHexString: () => myUserId,
                        toString: () => myUserId,
                    },
                };
                expect(isOutgoingMessage(msg, currentUserObj)).toBe(true);
            });

            it("classifies incoming partner message as NOT outgoing (incoming)", () => {
                const partnerMsg = {
                    _id: "msg_partner_001",
                    sender: {
                        _id: partnerUserId,
                        name: "Sarah Parker",
                        photos: [],
                    },
                };
                expect(isOutgoingMessage(partnerMsg, currentUserObj)).toBe(false);
            });

            it("returns false if user or sender is missing", () => {
                expect(isOutgoingMessage(null, currentUserObj)).toBe(false);
                expect(isOutgoingMessage({}, currentUserObj)).toBe(false);
                expect(isOutgoingMessage({ sender: myUserId }, null)).toBe(false);
                expect(isOutgoingMessage({ sender: myUserId }, undefined)).toBe(false);
            });
        });

        describe("reconciliation sender defense", () => {
            it("preserves optimistic sender metadata when server acknowledgement has sparse or default sender", () => {
                const clientTempId = "temp_sparse_ack";
                const prev = [
                    {
                        _id: clientTempId,
                        clientTempId,
                        content: "Hello",
                        sender: {
                            _id: myUserId,
                            name: "Alice Johnson",
                            photos: ["https://example.com/alice.jpg"],
                        },
                        status: "pending",
                        createdAt: "2026-10-21T10:00:00.000Z",
                    },
                ];

                // Sparse server ACK where name is default "Engaze Member" and photos empty
                const sparseAck = {
                    _id: "persisted_999",
                    clientTempId,
                    content: "Hello",
                    sender: {
                        _id: myUserId,
                        name: "Engaze Member",
                        photos: [],
                    },
                    createdAt: "2026-10-21T10:00:00.000Z",
                };

                const reconciled = reconcileSingleMessage(prev, sparseAck);

                expect(reconciled).toHaveLength(1);
                expect(reconciled[0]._id).toBe("persisted_999");
                expect(reconciled[0].sender._id).toBe(myUserId);
                expect(reconciled[0].sender.name).toBe("Alice Johnson");
                expect(reconciled[0].sender.photos).toEqual(["https://example.com/alice.jpg"]);
                expect(reconciled[0].status).toBe("sent");

                // Outgoing classification remains true
                expect(isOutgoingMessage(reconciled[0], { _id: myUserId })).toBe(true);
            });

            it("batch reconciliation preserves sender ID and classifies outgoing correctly", () => {
                const history = [
                    {
                        _id: "msg_hist_mine",
                        sender: { _id: myUserId, name: "Alice" },
                        content: "Sent by me",
                        createdAt: "2026-10-21T09:00:00.000Z",
                    },
                    {
                        _id: "msg_hist_partner",
                        sender: { _id: partnerUserId, name: "Sarah" },
                        content: "Sent by Sarah",
                        createdAt: "2026-10-21T09:01:00.000Z",
                    },
                ];

                const reconciled = reconcileBatchMessages([], history);

                expect(isOutgoingMessage(reconciled[0], { _id: myUserId })).toBe(true);
                expect(isOutgoingMessage(reconciled[1], { _id: myUserId })).toBe(false);
            });
        });
    });
});

