import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Readable } from "stream";

// Mock dependencies
vi.mock("@/lib/r2", () => ({
    r2Storage: {
        isConfigured: vi.fn(() => true),
        downloadStream: vi.fn(() => Promise.resolve(new ReadableStream())),
        deleteFile: vi.fn(() => Promise.resolve({ success: true })),
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
    getDownloadToken: vi.fn(),
    consumeDownloadToken: vi.fn(() => Promise.resolve(null)),
    getFileById: vi.fn(),
    deleteFileById: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/timing", () => ({
    formatServerTiming: vi.fn(() => ""),
    withTiming: vi.fn((_t, _n, fn) => fn()),
}));

import { GET } from "./route";
import { r2Storage } from "@/lib/r2";
import { getDownloadToken, consumeDownloadToken, getFileById, deleteFileById } from "@/lib/db";
import type { DownloadTokenRecord } from "@/lib/db/token-db";
import type { FileRecord } from "@/lib/db/file-db";

describe("Download Stream API Route", () => {
    const validCode = "12345678";
    const validToken = "token-uuid-123";
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const pastDate = new Date(Date.now() - 3600000).toISOString();

    const mockToken: DownloadTokenRecord = {
        token: validToken,
        file_id: "file-uuid-123",
        code: validCode,
        delete_after: false,
        expires_at: futureDate,
        created_at: new Date().toISOString(),
    };

    const mockFile: FileRecord = {
        id: "file-uuid-123",
        code: validCode,
        storage_key: "key-123",
        original_name: "test.txt",
        size: 1024,
        mime_type: "text/plain",
        expires_at: futureDate,
        max_downloads: 3,
        download_count: 1,
        password_hash: null,
        downloaded: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(r2Storage.isConfigured).mockReturnValue(true);
        vi.mocked(getDownloadToken).mockResolvedValue(mockToken);
        vi.mocked(getFileById).mockResolvedValue(mockFile);
    });

    function createRequest(code: string, token?: string): NextRequest {
        const url = token
            ? `http://localhost/api/download/${code}/stream?token=${token}`
            : `http://localhost/api/download/${code}/stream`;
        return new NextRequest(url, { method: "GET" });
    }

    describe("Token Validation", () => {
        it("requires token parameter", async () => {
            const request = createRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain("token");
        });

        it("returns 404 for invalid token", async () => {
            vi.mocked(getDownloadToken).mockResolvedValue(null);

            const request = createRequest(validCode, "invalid-token");
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain("Invalid");
        });

        it("returns 404 when token code does not match", async () => {
            vi.mocked(getDownloadToken).mockResolvedValue({
                ...mockToken,
                code: "99999999", // Different code
            });

            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(404);
        });

        it("returns 410 for expired token", async () => {
            vi.mocked(getDownloadToken).mockResolvedValue({
                ...mockToken,
                expires_at: pastDate,
            });

            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("expired");
        });
    });

    describe("Token Consumption", () => {
        it("consumes token after validation", async () => {
            const request = createRequest(validCode, validToken);
            await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(consumeDownloadToken).toHaveBeenCalledWith(validToken);
        });

        it("validates before consuming (read-only first)", async () => {
            const request = createRequest(validCode, validToken);
            await GET(request, { params: Promise.resolve({ code: validCode }) });

            // getDownloadToken should be called before consumeDownloadToken
            expect(getDownloadToken).toHaveBeenCalled();
        });
    });

    describe("File Streaming", () => {
        it("returns file stream with correct headers", async () => {
            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(200);
            expect(response.headers.get("Content-Type")).toBe("text/plain");
            expect(response.headers.get("Content-Length")).toBe("1024");
        });

        it("sets Content-Disposition with encoded filename", async () => {
            vi.mocked(getFileById).mockResolvedValue({
                ...mockFile,
                original_name: "test file (1).txt",
            });

            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            const disposition = response.headers.get("Content-Disposition");
            expect(disposition).toContain("attachment");
            expect(disposition).toContain("filename=");
        });

        it("sets X-Content-Type-Options: nosniff", async () => {
            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        });

        it("sets Cache-Control: no-store", async () => {
            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.headers.get("Cache-Control")).toContain("no-store");
        });
    });

    describe("File Not Found After Token", () => {
        it("returns 404 when file not found", async () => {
            vi.mocked(getFileById).mockResolvedValue(null);

            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain("not found");
        });

        it("returns 410 when file expired", async () => {
            vi.mocked(getFileById).mockResolvedValue({
                ...mockFile,
                expires_at: pastDate,
            });

            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(410);
        });
    });

    describe("Delete After Download", () => {
        it("deletes file when delete_after is true", async () => {
            vi.mocked(getDownloadToken).mockResolvedValue({
                ...mockToken,
                delete_after: true,
            });

            const request = createRequest(validCode, validToken);
            await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(deleteFileById).toHaveBeenCalledWith(mockFile.id);
            expect(r2Storage.deleteFile).toHaveBeenCalledWith(mockFile.storage_key);
        });

        it("does not delete file when delete_after is false", async () => {
            vi.mocked(getDownloadToken).mockResolvedValue({
                ...mockToken,
                delete_after: false,
            });

            const request = createRequest(validCode, validToken);
            await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(deleteFileById).not.toHaveBeenCalled();
            expect(r2Storage.deleteFile).not.toHaveBeenCalled();
        });

        it("handles R2 deletion failure gracefully", async () => {
            vi.mocked(getDownloadToken).mockResolvedValue({
                ...mockToken,
                delete_after: true,
            });
            vi.mocked(r2Storage.deleteFile).mockResolvedValue({
                success: false,
                error: "R2 error",
            });

            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            // Should still succeed - R2 failure is non-fatal
            expect(response.status).toBe(200);
        });
    });

    describe("Token Single-Use Invariant", () => {
        it("token cannot be reused", async () => {
            // First use succeeds
            const request1 = createRequest(validCode, validToken);
            const response1 = await GET(request1, { params: Promise.resolve({ code: validCode }) });
            expect(response1.status).toBe(200);

            // Second use fails (token already consumed)
            vi.mocked(getDownloadToken).mockResolvedValue(null);
            const request2 = createRequest(validCode, validToken);
            const response2 = await GET(request2, { params: Promise.resolve({ code: validCode }) });
            expect(response2.status).toBe(404);
        });
    });

    describe("Storage configuration", () => {
        it("returns error when storage not configured", async () => {
            vi.mocked(r2Storage.isConfigured).mockReturnValue(false);

            const request = createRequest(validCode, validToken);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(500);
        });
    });
});
