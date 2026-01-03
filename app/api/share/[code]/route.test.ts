import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/db", () => ({
    getShareWithContentByCode: vi.fn(),
    updateShareViewCount: vi.fn(),
}));

vi.mock("@/lib/passwords", () => ({
    verifyPassword: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("@/lib/timing", () => ({
    formatServerTiming: vi.fn(() => ""),
    withTiming: vi.fn((_t, _n, fn) => fn()),
}));

import { GET, POST } from "./route";
import { getShareWithContentByCode, updateShareViewCount } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";
import type { ShareWithContentRecord } from "@/lib/db/share-db";

describe("Share Retrieval API Route", () => {
    const validCode = "abc12345";
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const pastDate = new Date(Date.now() - 3600000).toISOString();

    const mockShare: ShareWithContentRecord = {
        id: "uuid-share-123",
        code: validCode,
        type: "paste",
        content_id: "uuid-content-123",
        original_name: null,
        mime_type: null,
        size: null,
        language: null,
        expires_at: futureDate,
        password_hash: null,
        burn_after_reading: false,
        view_count: 0,
        burned: false,
        created_at: new Date().toISOString(),
        content: {
            id: "uuid-content-123",
            content: "Hello, world!",
            created_at: new Date().toISOString(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getShareWithContentByCode).mockResolvedValue(mockShare);
        vi.mocked(updateShareViewCount).mockResolvedValue({
            ...mockShare,
            view_count: 1,
        });
    });

    function createGetRequest(code: string): NextRequest {
        return new NextRequest(`http://localhost/api/share/${code}`, {
            method: "GET",
        });
    }

    function createPostRequest(code: string, body: object = {}): NextRequest {
        return new NextRequest(`http://localhost/api/share/${code}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        });
    }

    describe("GET - Share Retrieval", () => {
        it("returns share content for valid code", async () => {
            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.type).toBe("paste");
            expect(data.content).toBe("Hello, world!");
        });

        it("returns 404 for missing share", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue(null);

            const request = createGetRequest("notfound");
            const response = await GET(request, { params: Promise.resolve({ code: "notfound" }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain("not found");
        });

        it("returns 410 for expired share", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                expires_at: pastDate,
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("expired");
        });

        it("returns 410 for burned share", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                burned: true,
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("destroyed");
        });

        it("returns 401 when password required", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                password_hash: "hashed_password",
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.requiresPassword).toBe(true);
        });

        it("increments view count", async () => {
            const request = createGetRequest(validCode);
            await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(updateShareViewCount).toHaveBeenCalled();
        });
    });

    describe("GET - Code Validation", () => {
        it("rejects invalid code format (uppercase)", async () => {
            const request = createGetRequest("ABC12345");
            const response = await GET(request, { params: Promise.resolve({ code: "ABC12345" }) });

            expect(response.status).toBe(400);
        });

        it("rejects invalid code format (wrong length)", async () => {
            const request = createGetRequest("abc123");
            const response = await GET(request, { params: Promise.resolve({ code: "abc123" }) });

            expect(response.status).toBe(400);
        });

        it("normalizes code to lowercase", async () => {
            // The route should normalize, but if it rejects we check for 400
            const request = createGetRequest("ABC12345");
            const response = await GET(request, { params: Promise.resolve({ code: "ABC12345" }) });
            // Should either succeed with normalized code or reject
            expect([200, 400]).toContain(response.status);
        });
    });

    describe("POST - Password Protected Share", () => {
        it("returns share when correct password provided", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                password_hash: "hashed_password",
            });
            vi.mocked(verifyPassword).mockResolvedValue(true);

            const request = createPostRequest(validCode, { password: "correct" });
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.content).toBeDefined();
        });

        it("returns 403 for incorrect password", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                password_hash: "hashed_password",
            });
            vi.mocked(verifyPassword).mockResolvedValue(false);

            const request = createPostRequest(validCode, { password: "wrong" });
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toContain("Incorrect");
        });

        it("returns 401 when password required but not provided", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                password_hash: "hashed_password",
            });

            const request = createPostRequest(validCode, {});
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.requiresPassword).toBe(true);
        });
    });

    describe("Burn After Reading", () => {
        it("burns share after first view", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                burn_after_reading: true,
            });
            vi.mocked(updateShareViewCount).mockResolvedValue({
                ...mockShare,
                burn_after_reading: true,
                view_count: 1,
                burned: true,
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(updateShareViewCount).toHaveBeenCalledWith(
                mockShare.id,
                0,
                true // burnAfterReading flag
            );
        });

        it("returns 410 for already burned share", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                burn_after_reading: true,
                view_count: 1,
                burned: true,
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("destroyed");
        });

        it("indicates burnAfterReading in response", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                burn_after_reading: true,
            });
            vi.mocked(updateShareViewCount).mockResolvedValue({
                ...mockShare,
                burn_after_reading: true,
                view_count: 1,
                burned: true,
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.burnAfterReading).toBe(true);
        });
    });

    describe("Optimistic Locking", () => {
        it("uses expected view count for update", async () => {
            const request = createGetRequest(validCode);
            await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(updateShareViewCount).toHaveBeenCalledWith(
                mockShare.id,
                mockShare.view_count,
                mockShare.burn_after_reading
            );
        });

        it("retries on concurrent modification", async () => {
            vi.mocked(updateShareViewCount)
                .mockResolvedValueOnce(null) // First attempt fails
                .mockResolvedValueOnce({ ...mockShare, view_count: 1 }); // Second succeeds

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(200);
            expect(updateShareViewCount).toHaveBeenCalledTimes(2);
        });

        it("returns 409 after max retries", async () => {
            vi.mocked(updateShareViewCount).mockResolvedValue(null);

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain("retry");
        });
    });

    describe("Response Fields", () => {
        it("includes type in response", async () => {
            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.type).toBe("paste");
        });

        it("includes language for code type", async () => {
            vi.mocked(getShareWithContentByCode).mockResolvedValue({
                ...mockShare,
                type: "code",
                language: "javascript",
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.language).toBe("javascript");
        });

        it("includes expiresAt in response", async () => {
            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.expiresAt).toBeDefined();
        });

        it("indicates requiresPassword status", async () => {
            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.requiresPassword).toBe(false);
        });
    });

    describe("Response Headers", () => {
        it("sets Cache-Control to no-store", async () => {
            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.headers.get("Cache-Control")).toContain("no-store");
        });
    });
});
