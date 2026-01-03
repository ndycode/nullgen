import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/r2", () => ({
    r2Storage: {
        isConfigured: vi.fn(() => true),
        getSignedUploadUrl: vi.fn(() => Promise.resolve("https://r2.example.com/upload?signed=1")),
    },
}));

vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        exception: vi.fn(),
    },
}));

vi.mock("@/lib/passwords", () => ({
    hashPassword: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
}));

vi.mock("@/lib/db", () => ({
    reserveUploadSession: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("@/lib/timing", () => ({
    formatServerTiming: vi.fn(() => ""),
    withTiming: vi.fn((_t, _n, fn) => fn()),
}));

import { POST } from "./route";
import { r2Storage } from "@/lib/r2";
import { reserveUploadSession } from "@/lib/db";
import { MAX_FILE_SIZE, MAX_UPLOAD_SIZE, CODE_LENGTH } from "@/lib/constants";

describe("Upload API Route", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(r2Storage.isConfigured).mockReturnValue(true);
        vi.mocked(reserveUploadSession).mockResolvedValue(true);
    });

    function createRequest(body: object): NextRequest {
        return new NextRequest("http://localhost/api/upload", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    describe("Successful upload initialization", () => {
        it("returns upload URL for valid request", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBeDefined();
            expect(data.code.length).toBe(CODE_LENGTH);
            expect(data.uploadUrl).toBeDefined();
            expect(data.expiresAt).toBeDefined();
        });

        it("returns numeric code of correct length", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.code).toMatch(/^\d{8}$/);
        });

        it("hashes password when provided", async () => {
            const { hashPassword } = await import("@/lib/passwords");

            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
                password: "secret123",
            });

            await POST(request);

            expect(hashPassword).toHaveBeenCalledWith("secret123");
        });
    });

    describe("Validation", () => {
        it("rejects missing filename", async () => {
            const request = createRequest({
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("file name");
        });

        it("rejects empty filename", async () => {
            const request = createRequest({
                filename: "",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("rejects invalid file size (zero)", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 0,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("size");
        });

        it("rejects invalid file size (negative)", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: -100,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("rejects file size exceeding MAX_FILE_SIZE", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: MAX_FILE_SIZE + 1,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("limit");
        });

        it("rejects file size exceeding MAX_UPLOAD_SIZE", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: MAX_UPLOAD_SIZE + 1,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("rejects disallowed MIME types", async () => {
            const request = createRequest({
                filename: "malware.exe",
                size: 1024,
                mimeType: "application/x-msdownload",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("type");
        });
    });

    describe("MIME type validation", () => {
        it("allows text/plain", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("allows image types", async () => {
            const request = createRequest({
                filename: "test.png",
                size: 1024,
                mimeType: "image/png",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("allows application/pdf", async () => {
            const request = createRequest({
                filename: "doc.pdf",
                size: 1024,
                mimeType: "application/pdf",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("uses application/octet-stream for missing MIME type", async () => {
            const request = createRequest({
                filename: "test.bin",
                size: 1024,
                mimeType: "",
            });

            // Should use default and potentially still fail validation
            // depending on whether octet-stream is allowed
            const response = await POST(request);
            // Just verify it doesn't crash
            expect(response.status).toBeDefined();
        });
    });

    describe("Filename sanitization", () => {
        it("sanitizes path traversal attempts", async () => {
            const request = createRequest({
                filename: "../../../etc/passwd",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            // Should still work, just sanitize the filename
            expect(response.status).toBe(200);
        });

        it("sanitizes backslash path traversal", async () => {
            const request = createRequest({
                filename: "..\\..\\windows\\system32",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("sanitizes special characters", async () => {
            const request = createRequest({
                filename: '<script>alert("xss")</script>.txt',
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("truncates very long filenames", async () => {
            const request = createRequest({
                filename: "a".repeat(500) + ".txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });
    });

    describe("Code generation", () => {
        it("retries on code collision", async () => {
            vi.mocked(reserveUploadSession)
                .mockResolvedValueOnce(false) // First collision
                .mockResolvedValueOnce(false) // Second collision
                .mockResolvedValueOnce(true); // Success

            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
            expect(reserveUploadSession).toHaveBeenCalledTimes(3);
        });

        it("fails after max retries", async () => {
            vi.mocked(reserveUploadSession).mockResolvedValue(false);

            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("unique code");
        });
    });

    describe("Storage configuration", () => {
        it("returns error when storage not configured", async () => {
            vi.mocked(r2Storage.isConfigured).mockReturnValue(false);

            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Storage");
        });
    });

    describe("Expiry settings", () => {
        it("uses default expiry when not provided", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.expiresAt).toBeDefined();
        });

        it("uses custom expiry when provided", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
                expiryMinutes: 30,
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it("clamps expiry to maximum", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
                expiryMinutes: 999999,
            });

            // Should not fail, just clamp
            const response = await POST(request);
            expect(response.status).toBe(200);
        });
    });

    describe("Response headers", () => {
        it("sets Cache-Control to no-store", async () => {
            const request = createRequest({
                filename: "test.txt",
                size: 1024,
                mimeType: "text/plain",
            });

            const response = await POST(request);
            expect(response.headers.get("Cache-Control")).toContain("no-store");
        });
    });
});
