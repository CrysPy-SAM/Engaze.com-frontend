import { formatLastSeen, formatPresenceHeader } from "./presenceFormatters";

describe("presenceFormatters Unit Test Suite", () => {
    const referenceNow = new Date("2026-10-21T15:30:00.000Z");

    describe("formatLastSeen", () => {
        it("returns empty string for null, undefined, empty, or invalid input", () => {
            expect(formatLastSeen(null, referenceNow)).toBe("");
            expect(formatLastSeen(undefined, referenceNow)).toBe("");
            expect(formatLastSeen("", referenceNow)).toBe("");
            expect(formatLastSeen("not-a-valid-date", referenceNow)).toBe("");
        });

        it("formats timestamps from earlier today with 'last seen today at ...'", () => {
            const earlierToday = new Date(referenceNow);
            earlierToday.setHours(earlierToday.getHours() - 3);

            const result = formatLastSeen(earlierToday, referenceNow);
            expect(result.startsWith("last seen today at ")).toBe(true);
            expect(result.length).toBeGreaterThan("last seen today at ".length);
        });

        it("formats timestamps from yesterday with 'last seen yesterday at ...'", () => {
            const yesterday = new Date(referenceNow);
            yesterday.setDate(referenceNow.getDate() - 1);
            yesterday.setHours(18, 45, 0, 0);

            const result = formatLastSeen(yesterday, referenceNow);
            expect(result.startsWith("last seen yesterday at ")).toBe(true);
            expect(result.length).toBeGreaterThan("last seen yesterday at ".length);
        });

        it("formats timestamps from earlier in the same year with month and day", () => {
            const earlierThisYear = new Date(referenceNow);
            earlierThisYear.setMonth(referenceNow.getMonth() - 2);
            earlierThisYear.setDate(10);

            const result = formatLastSeen(earlierThisYear, referenceNow);
            expect(result.startsWith("last seen ")).toBe(true);
            expect(result.includes("today")).toBe(false);
            expect(result.includes("yesterday")).toBe(false);
            expect(result.includes(" at ")).toBe(true);
        });

        it("formats timestamps from previous years with the year included", () => {
            const lastYear = new Date("2025-05-14T10:15:00.000Z");
            const result = formatLastSeen(lastYear, referenceNow);
            expect(result.startsWith("last seen ")).toBe(true);
            expect(result.includes("2025")).toBe(true);
            expect(result.includes(" at ")).toBe(true);
        });
    });

    describe("formatPresenceHeader", () => {
        it("returns status online when isOnline is true regardless of lastSeenAt", () => {
            const earlier = new Date(referenceNow);
            earlier.setHours(earlier.getHours() - 1);

            const res = formatPresenceHeader(true, earlier, referenceNow);
            expect(res).toEqual({ status: "online", text: "Online" });
        });

        it("returns status offline with formatted text when offline and lastSeenAt is present", () => {
            const earlier = new Date(referenceNow);
            earlier.setHours(earlier.getHours() - 1);

            const res = formatPresenceHeader(false, earlier, referenceNow);
            expect(res.status).toBe("offline");
            expect(res.text.startsWith("last seen today at ")).toBe(true);
        });

        it("returns status hidden with empty text when offline and lastSeenAt is null", () => {
            const res = formatPresenceHeader(false, null, referenceNow);
            expect(res).toEqual({ status: "hidden", text: "" });
        });
    });
});
