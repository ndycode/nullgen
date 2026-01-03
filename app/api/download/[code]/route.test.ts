import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/r2", () => ({
    r2Storage: {
        isConfigured: vi.fn(() => true),
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

vi.mock("@/lib/passwords", () => ({
    verifyPassword: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("@/lib/db", () => ({
    getFileByCode: vi.fn(),
    updateFileDownloadCount: vi.fn(),
    createDownloadToken: vi.fn(() => Promise.resolve()),
    deleteFileById: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/timing", () => ({
    formatServerTiming: vi.fn(() => ""),
    withTiming: vi.fn((_t, _n, fn) => fn()),
}));

import { GET, POST } from "./route";
import { r2Storage } from "@/lib/r2";
import { getFileByCode, updateFileDownloadCount, createDownloadToken, deleteFileById } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";
import type { FileRecord } from "@/lib/db/file-db";

describe("Download API Route", () => {
    const validCode = "12345678";
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const pastDate = new Date(Date.now() - 3600000).toISOString();

    const mockFile: FileRecord = {
        id: "uuid-123",
        code: validCode,
        storage_key: "key-123",
        original_name: "test.txt",
        size: 1024,
        mime_type: "text/plain",
        expires_at: futureDate,
        max_downloads: 3,
        download_count: 0,
        password_hash: null,
        downloaded: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(r2Storage.isConfigured).mockReturnValue(true);
        vi.mocked(getFileByCode).mockResolvedValue(mockFile);
        vi.mocked(updateFileDownloadCount).mockResolvedValue({ ...mockFile, download_count: 1 });
    });

    function createGetRequest(code: string): NextRequest {
        return new NextRequest(`http://localhost/api/download/${code}`, {
            method: "GET",
        });
    }

    function createPostRequest(code: string, body: object = {}): NextRequest {
        return new NextRequest(`http://localhost/api/download/${code}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        });
    }

    describe("GET - File Metadata", () => {
        it("returns file metadata for valid code", async () => {
            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.name).toBe("test.txt");
            expect(data.size).toBe(1024);
            expect(data.requiresPassword).toBe(false);
        });

        it("returns 404 for missing file", async () => {
            vi.mocked(getFileByCode).mockResolvedValue(null);

            const request = createGetRequest("99999999");
            const response = await GET(request, { params: Promise.resolve({ code: "99999999" }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain("not found");
        });

        it("returns 410 for expired file", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({ ...mockFile, expires_at: pastDate });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("expired");
        });

        it("returns 410 when download limit reached", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({
                ...mockFile,
                max_downloads: 3,
                download_count: 3,
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(410);
            expect(data.error).toContain("limit");
        });

        it("shows unlimited downloads correctly", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({ ...mockFile, max_downloads: -1 });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.downloadsRemaining).toBe("unlimited");
        });

        it("shows remaining downloads correctly", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({
                ...mockFile,
                max_downloads: 5,
                download_count: 2,
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.downloadsRemaining).toBe(3);
        });

        it("indicates password required", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({
                ...mockFile,
                password_hash: "hashed_password",
            });

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(data.requiresPassword).toBe(true);
        });
    });

    describe("GET - Code Validation", () => {
        it("rejects invalid code format (non-numeric)", async () => {
            const request = createGetRequest("abcd1234");
            const response = await GET(request, { params: Promise.resolve({ code: "abcd1234" }) });

            expect(response.status).toBe(400);
        });

        it("rejects invalid code format (wrong length)", async () => {
            const request = createGetRequest("1234567");
            const response = await GET(request, { params: Promise.resolve({ code: "1234567" }) });

            expect(response.status).toBe(400);
        });
    });

    describe("POST - Download Request", () => {
        it("creates download token on success", async () => {
            const request = createPostRequest(validCode);
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.token).toBeDefined();
            expect(data.downloadUrl).toBeDefined();
            expect(createDownloadToken).toHaveBeenCalled();
        });

        it("returns 404 for missing file", async () => {
            vi.mocked(getFileByCode).mockResolvedValue(null);

            const request = createPostRequest("99999999");
            const response = await POST(request, { params: Promise.resolve({ code: "99999999" }) });

            expect(response.status).toBe(404);
        });

        it("returns 410 for expired file", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({ ...mockFile, expires_at: pastDate });

            const request = createPostRequest(validCode);
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(410);
        });
    });

    describe("POST - Password Protection", () => {
        it("returns 401 when password required but not provided", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({
                ...mockFile,
                password_hash: "hashed_password",
            });

            const request = createPostRequest(validCode, {});
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toContain("Password required");
        });

        it("returns 403 for incorrect password", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({
                ...mockFile,
                password_hash: "hashed_password",
            });
            vi.mocked(verifyPassword).mockResolvedValue(false);

            const request = createPostRequest(validCode, { password: "wrong" });
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toContain("Incorrect");
        });

        it("succeeds with correct password", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({
                ...mockFile,
                password_hash: "hashed_password",
            });
            vi.mocked(verifyPassword).mockResolvedValue(true);

            const request = createPostRequest(validCode, { password: "correct" });
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(200);
        });
    });

    describe("POST - Optimistic Locking", () => {
        it("uses expected count for update", async () => {
            const request = createPostRequest(validCode);
            await POST(request, { params: Promise.resolve({ code: validCode }) });

            expect(updateFileDownloadCount).toHaveBeenCalledWith(
                mockFile.id,
                mockFile.download_count,
                mockFile.download_count + 1
            );
        });

        it("retries on concurrent modification", async () => {
            vi.mocked(updateFileDownloadCount)
                .mockResolvedValueOnce(null) // First attempt fails
                .mockResolvedValueOnce({ ...mockFile, download_count: 1 }); // Second succeeds

            const request = createPostRequest(validCode);
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(200);
            expect(updateFileDownloadCount).toHaveBeenCalledTimes(2);
        });

        it("returns 409 after max retries", async () => {
            vi.mocked(updateFileDownloadCount).mockResolvedValue(null);

            const request = createPostRequest(validCode);
            const response = await POST(request, { params: Promise.resolve({ code: validCode }) });
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain("retry");
        });
    });

    describe("POST - Delete After Flag", () => {
        it("sets delete_after true when max downloads reached", async () => {
            vi.mocked(getFileByCode).mockResolvedValue({
                ...mockFile,
                max_downloads: 1,
                download_count: 0,
            });
            vi.mocked(updateFileDownloadCount).mockResolvedValue({
                ...mockFile,
                max_downloads: 1,
                download_count: 1,
            });

            const request = createPostRequest(validCode);
            await POST(request, { params: Promise.resolve({ code: validCode }) });

            expect(createDownloadToken).toHaveBeenCalledWith(
                expect.objectContaining({ delete_after: true })
            );
        });

        it("sets delete_after false when downloads remain", async () => {
            vi.mocked(updateFileDownloadCount).mockResolvedValue({
                ...mockFile,
                max_downloads: 5,
                download_count: 1,
            });

            const request = createPostRequest(validCode);
            await POST(request, { params: Promise.resolve({ code: validCode }) });

            expect(createDownloadToken).toHaveBeenCalledWith(
                expect.objectContaining({ delete_after: false })
            );
        });
    });

    describe("Storage configuration", () => {
        it("returns error when storage not configured", async () => {
            vi.mocked(r2Storage.isConfigured).mockReturnValue(false);

            const request = createGetRequest(validCode);
            const response = await GET(request, { params: Promise.resolve({ code: validCode }) });

            expect(response.status).toBe(500);
        });
    });
});
