import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatLastSeen, formatPresenceHeader } from "./presenceFormatters.js";

describe("presenceFormatters Unit Test Suite", () => {
    const referenceNow = new Date("2026-10-21T15:30:00.000Z");

    describe("formatLastSeen", () => {
        it("returns empty string for null, undefined, empty, or invalid input", () => {
            assert.equal(formatLastSeen(null, referenceNow), "");
            assert.equal(formatLastSeen(undefined, referenceNow), "");
            assert.equal(formatLastSeen("", referenceNow), "");
            assert.equal(formatLastSeen("not-a-valid-date", referenceNow), "");
        });

        it("formats timestamps from earlier today with 'last seen today at ...'", () => {
            const earlierToday = new Date(referenceNow);
            earlierToday.setHours(earlierToday.getHours() - 3);

            const result = formatLastSeen(earlierToday, referenceNow);
            assert.ok(result.startsWith("last seen today at "));
            assert.ok(result.length > "last seen today at ".length);
        });

        it("formats timestamps from yesterday with 'last seen yesterday at ...'", () => {
            const yesterday = new Date(referenceNow);
            yesterday.setDate(referenceNow.getDate() - 1);
            yesterday.setHours(18, 45, 0, 0);

            const result = formatLastSeen(yesterday, referenceNow);
            assert.ok(result.startsWith("last seen yesterday at "));
            assert.ok(result.length > "last seen yesterday at ".length);
        });

        it("formats timestamps from earlier in the same year with month and day", () => {
            const earlierThisYear = new Date(referenceNow);
            earlierThisYear.setMonth(referenceNow.getMonth() - 2); // 2 months ago
            earlierThisYear.setDate(10);

            const result = formatLastSeen(earlierThisYear, referenceNow);
            assert.ok(result.startsWith("last seen "));
            assert.ok(!result.includes("today"));
            assert.ok(!result.includes("yesterday"));
            assert.ok(result.includes(" at "));
        });

        it("formats timestamps from previous years with the year included", () => {
            const lastYear = new Date("2025-05-14T10:15:00.000Z");
            const result = formatLastSeen(lastYear, referenceNow);
            assert.ok(result.startsWith("last seen "));
            assert.ok(result.includes("2025"));
            assert.ok(result.includes(" at "));
        });
    });

    describe("formatPresenceHeader", () => {
        it("returns status online when isOnline is true regardless of lastSeenAt", () => {
            const earlier = new Date(referenceNow);
            earlier.setHours(earlier.getHours() - 1);

            const res = formatPresenceHeader(true, earlier, referenceNow);
            assert.deepEqual(res, { status: "online", text: "Online" });
        });

        it("returns status offline with formatted text when offline and lastSeenAt is present", () => {
            const earlier = new Date(referenceNow);
            earlier.setHours(earlier.getHours() - 1);

            const res = formatPresenceHeader(false, earlier, referenceNow);
            assert.equal(res.status, "offline");
            assert.ok(res.text.startsWith("last seen today at "));
        });

        it("returns status hidden with empty text when offline and lastSeenAt is null", () => {
            const res = formatPresenceHeader(false, null, referenceNow);
            assert.deepEqual(res, { status: "hidden", text: "" });
        });
    });
});
