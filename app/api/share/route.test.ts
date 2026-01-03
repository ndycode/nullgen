import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/passwords", () => ({
    hashPassword: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
}));

vi.mock("@/lib/db", () => ({
    createShareAtomic: vi.fn(),
}));

vi.mock("@/lib/timing", () => ({
    formatServerTiming: vi.fn(() => ""),
    withTiming: vi.fn((_t, _n, fn) => fn()),
}));

import { POST } from "./route";
import { createShareAtomic } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { MAX_SHARE_TEXT_SIZE, MAX_SHARE_IMAGE_BYTES, SHARE_CODE_LENGTH } from "@/lib/constants";

describe("Share Creation API Route", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createShareAtomic).mockResolvedValue({
            share_id: "uuid-share-123",
            content_id: "uuid-content-123",
            code: "abc12345",
            created_at: new Date().toISOString(),
        });
    });

    function createRequest(body: object): NextRequest {
        return new NextRequest("http://localhost/api/share", {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        });
    }

    describe("Successful Share Creation", () => {
        it("creates paste share", async () => {
            const request = createRequest({
                type: "paste",
                content: "Hello, world!",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBeDefined();
            expect(data.code.length).toBe(SHARE_CODE_LENGTH);
            expect(data.url).toBeDefined();
            expect(data.expiresAt).toBeDefined();
        });

        it("creates link share", async () => {
            const request = createRequest({
                type: "link",
                content: "https://example.com",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("creates code share with language", async () => {
            const request = createRequest({
                type: "code",
                content: "console.log('hello');",
                language: "javascript",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);

            expect(createShareAtomic).toHaveBeenCalledWith(
                expect.objectContaining({ language: "javascript" })
            );
        });

        it("creates json share", async () => {
            const request = createRequest({
                type: "json",
                content: '{"key": "value"}',
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("creates csv share", async () => {
            const request = createRequest({
                type: "csv",
                content: "a,b,c\n1,2,3",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("creates note share (burn after reading)", async () => {
            const request = createRequest({
                type: "note",
                content: "secret message",
                burnAfterReading: true,
            });

            const response = await POST(request);
            expect(response.status).toBe(200);

            expect(createShareAtomic).toHaveBeenCalledWith(
                expect.objectContaining({ burn_after_reading: true })
            );
        });
    });

    describe("Password Protection", () => {
        it("hashes password when provided", async () => {
            const request = createRequest({
                type: "paste",
                content: "secret content",
                password: "mysecret",
            });

            await POST(request);

            expect(hashPassword).toHaveBeenCalledWith("mysecret");
            expect(createShareAtomic).toHaveBeenCalledWith(
                expect.objectContaining({ password_hash: "hashed_mysecret" })
            );
        });

        it("trims password", async () => {
            const request = createRequest({
                type: "paste",
                content: "content",
                password: "  secret  ",
            });

            await POST(request);

            expect(hashPassword).toHaveBeenCalledWith("secret");
        });

        it("ignores empty password", async () => {
            const request = createRequest({
                type: "paste",
                content: "content",
                password: "   ",
            });

            await POST(request);

            expect(hashPassword).not.toHaveBeenCalled();
            expect(createShareAtomic).toHaveBeenCalledWith(
                expect.objectContaining({ password_hash: null })
            );
        });
    });

    describe("Validation", () => {
        it("rejects invalid request body", async () => {
            const request = new NextRequest("http://localhost/api/share", {
                method: "POST",
                body: "not json",
                headers: { "Content-Type": "application/json" },
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("rejects missing content", async () => {
            const request = createRequest({
                type: "paste",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("required");
        });

        it("rejects missing type", async () => {
            const request = createRequest({
                content: "hello",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("rejects invalid share type", async () => {
            const request = createRequest({
                type: "invalid_type",
                content: "hello",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("type");
        });

        it("rejects empty content", async () => {
            const request = createRequest({
                type: "paste",
                content: "",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("rejects whitespace-only content", async () => {
            const request = createRequest({
                type: "paste",
                content: "   ",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });
    });

    describe("Link Validation", () => {
        it("rejects invalid URL for link type", async () => {
            const request = createRequest({
                type: "link",
                content: "not-a-url",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("URL");
        });

        it("rejects non-http URLs", async () => {
            const request = createRequest({
                type: "link",
                content: "ftp://example.com",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("accepts http URLs", async () => {
            const request = createRequest({
                type: "link",
                content: "http://example.com",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("accepts https URLs", async () => {
            const request = createRequest({
                type: "link",
                content: "https://example.com/path?query=1",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });
    });

    describe("JSON Validation", () => {
        it("rejects invalid JSON for json type", async () => {
            const request = createRequest({
                type: "json",
                content: "not valid json {",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("JSON");
        });

        it("accepts valid JSON", async () => {
            const request = createRequest({
                type: "json",
                content: '{"valid": true, "array": [1, 2, 3]}',
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });
    });

    describe("Image Validation", () => {
        it("rejects invalid image data URL", async () => {
            const request = createRequest({
                type: "image",
                content: "not-a-data-url",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("image");
        });

        it("rejects non-image data URL", async () => {
            const request = createRequest({
                type: "image",
                content: "data:text/plain;base64,SGVsbG8=",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("accepts valid image data URL", async () => {
            // Small valid PNG base64
            const smallPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
            const request = createRequest({
                type: "image",
                content: `data:image/png;base64,${smallPng}`,
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });
    });

    describe("Size Limits", () => {
        it("rejects text content exceeding limit", async () => {
            const request = createRequest({
                type: "paste",
                content: "a".repeat(MAX_SHARE_TEXT_SIZE + 1),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("large");
        });

        it("accepts text content at limit", async () => {
            const request = createRequest({
                type: "paste",
                content: "a".repeat(MAX_SHARE_TEXT_SIZE),
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });
    });

    describe("Code Generation", () => {
        it("retries on code collision", async () => {
            vi.mocked(createShareAtomic)
                .mockResolvedValueOnce(null) // Collision
                .mockResolvedValueOnce(null) // Collision
                .mockResolvedValueOnce({
                    share_id: "uuid-share-123",
                    content_id: "uuid-content-123",
                    code: "abc12345",
                    created_at: new Date().toISOString(),
                });

            const request = createRequest({
                type: "paste",
                content: "hello",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
            expect(createShareAtomic).toHaveBeenCalledTimes(3);
        });

        it("fails after max retries", async () => {
            vi.mocked(createShareAtomic).mockResolvedValue(null);

            const request = createRequest({
                type: "paste",
                content: "hello",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("unique code");
        });
    });

    describe("Expiry Settings", () => {
        it("uses default expiry when not provided", async () => {
            const request = createRequest({
                type: "paste",
                content: "hello",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("uses custom expiry when provided", async () => {
            const request = createRequest({
                type: "paste",
                content: "hello",
                expiryMinutes: 120,
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("clamps expiry to maximum", async () => {
            const request = createRequest({
                type: "paste",
                content: "hello",
                expiryMinutes: 999999,
            });

            // Should not fail, just clamp
            const response = await POST(request);
            expect(response.status).toBe(200);
        });
    });

    describe("Atomic Creation", () => {
        it("uses atomic creation (single RPC call)", async () => {
            const request = createRequest({
                type: "paste",
                content: "hello",
            });

            await POST(request);

            expect(createShareAtomic).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: "hello",
                    type: "paste",
                })
            );
        });
    });

    describe("Response Headers", () => {
        it("sets Cache-Control to no-store", async () => {
            const request = createRequest({
                type: "paste",
                content: "hello",
            });

            const response = await POST(request);
            expect(response.headers.get("Cache-Control")).toContain("no-store");
        });
    });
});
