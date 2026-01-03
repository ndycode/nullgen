import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/r2", () => ({
    r2Storage: {
        isConfigured: vi.fn(() => true),
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

vi.mock("@/lib/db", () => ({
    finalizeUploadAtomic: vi.fn(),
}));

vi.mock("@/lib/timing", () => ({
    formatServerTiming: vi.fn(() => ""),
    withTiming: vi.fn((_t, _n, fn) => fn()),
}));

import { POST } from "./route";
import { r2Storage } from "@/lib/r2";
import { finalizeUploadAtomic } from "@/lib/db";

describe("Upload Complete API Route", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(r2Storage.isConfigured).mockReturnValue(true);
    });

    function createRequest(body: object): NextRequest {
        return new NextRequest("http://localhost/api/upload/complete", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    describe("Successful finalization", () => {
        it("finalizes upload session", async () => {
            const mockFile = {
                id: "uuid-123",
                code: "12345678",
                storage_key: "key-123",
                original_name: "test.txt",
                size: 1024,
                mime_type: "text/plain",
                expires_at: new Date().toISOString(),
                max_downloads: 1,
                download_count: 0,
                password_hash: null,
                downloaded: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(finalizeUploadAtomic).mockResolvedValue(mockFile);

            const request = createRequest({ code: "12345678" });
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBe("12345678");
            expect(data.expiresAt).toBeDefined();
        });

        it("calls finalizeUploadAtomic with code", async () => {
            const mockFile = {
                id: "uuid-123",
                code: "87654321",
                storage_key: "key-123",
                original_name: "test.txt",
                size: 1024,
                mime_type: "text/plain",
                expires_at: new Date().toISOString(),
                max_downloads: 1,
                download_count: 0,
                password_hash: null,
                downloaded: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(finalizeUploadAtomic).mockResolvedValue(mockFile);

            const request = createRequest({ code: "87654321" });
            await POST(request);

            expect(finalizeUploadAtomic).toHaveBeenCalledWith("87654321");
        });
    });

    describe("Validation", () => {
        it("rejects missing code", async () => {
            const request = createRequest({});
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("code");
        });

        it("rejects empty code", async () => {
            const request = createRequest({ code: "" });
            const response = await POST(request);

            expect(response.status).toBe(400);
        });
    });

    describe("Session expiration", () => {
        it("returns 410 for expired session", async () => {
            vi.mocked(finalizeUploadAtomic).mockResolvedValue(null);

            const request = createRequest({ code: "12345678" });
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("expired");
        });

        it("returns 410 for already finalized session", async () => {
            vi.mocked(finalizeUploadAtomic).mockResolvedValue(null);

            const request = createRequest({ code: "12345678" });
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("finalized");
        });
    });

    describe("Storage configuration", () => {
        it("returns error when storage not configured", async () => {
            vi.mocked(r2Storage.isConfigured).mockReturnValue(false);

            const request = createRequest({ code: "12345678" });
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("Storage");
        });
    });

    describe("Response headers", () => {
        it("sets Cache-Control to no-store", async () => {
            const mockFile = {
                id: "uuid-123",
                code: "12345678",
                storage_key: "key-123",
                original_name: "test.txt",
                size: 1024,
                mime_type: "text/plain",
                expires_at: new Date().toISOString(),
                max_downloads: 1,
                download_count: 0,
                password_hash: null,
                downloaded: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(finalizeUploadAtomic).mockResolvedValue(mockFile);

            const request = createRequest({ code: "12345678" });
            const response = await POST(request);

            expect(response.headers.get("Cache-Control")).toContain("no-store");
        });
    });

    describe("Atomicity", () => {
        it("uses atomic finalization (single RPC call)", async () => {
            const mockFile = {
                id: "uuid-123",
                code: "12345678",
                storage_key: "key-123",
                original_name: "test.txt",
                size: 1024,
                mime_type: "text/plain",
                expires_at: new Date().toISOString(),
                max_downloads: 1,
                download_count: 0,
                password_hash: null,
                downloaded: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(finalizeUploadAtomic).mockResolvedValue(mockFile);

            const request = createRequest({ code: "12345678" });
            await POST(request);

            // Should only call once (atomic)
            expect(finalizeUploadAtomic).toHaveBeenCalledTimes(1);
        });
    });
});
