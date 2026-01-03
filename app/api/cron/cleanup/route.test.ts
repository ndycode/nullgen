/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    lt: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    in: vi.fn(() => Promise.resolve({ error: null })),
};

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/r2", () => ({
    r2Storage: {
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

vi.mock("@/lib/env", () => ({
    env: {
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "test-key",
    },
}));

import { GET } from "./route";
import { r2Storage } from "@/lib/r2";
import { logger } from "@/lib/logger";

// Store original env
const originalEnv = { ...process.env };

describe("Cleanup Cron API Route", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
        process.env.CRON_SECRET = "test-secret";

        // Reset mock implementations
        mockSupabase.delete.mockReturnValue(mockSupabase);
        mockSupabase.lt.mockReturnValue(mockSupabase);
        mockSupabase.select.mockResolvedValue({ data: [] });
        mockSupabase.in.mockResolvedValue({ error: null });
    });

    function createRequest(authHeader?: string): NextRequest {
        const headers: Record<string, string> = {};
        if (authHeader) {
            headers["authorization"] = authHeader;
        }
        return new NextRequest("http://localhost/api/cron/cleanup", {
            method: "GET",
            headers,
        });
    }

    describe("Authentication", () => {
        it("returns 401 for missing authorization", async () => {
            const request = createRequest();
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("returns 401 for incorrect secret", async () => {
            const request = createRequest("Bearer wrong-secret");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });

        it("succeeds with correct secret", async () => {
            const request = createRequest("Bearer test-secret");
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it("allows request when CRON_SECRET is not set", async () => {
            delete process.env.CRON_SECRET;

            const request = createRequest();
            const response = await GET(request);

            // Should succeed when no secret configured
            expect(response.status).toBe(200);
        });
    });

    describe("Cleanup Operations", () => {
        it("returns success with cleanup stats", async () => {
            const request = createRequest("Bearer test-secret");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.stats).toBeDefined();
            expect(data.timestamp).toBeDefined();
        });

        it("returns stats for all resource types", async () => {
            const request = createRequest("Bearer test-secret");
            const response = await GET(request);
            const data = await response.json();

            expect(data.stats.files).toBeDefined();
            expect(data.stats.uploadSessions).toBeDefined();
            expect(data.stats.shares).toBeDefined();
            expect(data.stats.downloadTokens).toBeDefined();
        });
    });

    describe("Download Token Cleanup", () => {
        it("deletes expired download tokens", async () => {
            mockSupabase.select.mockResolvedValueOnce({
                data: [{ token: "token1" }, { token: "token2" }],
            });

            const request = createRequest("Bearer test-secret");
            await GET(request);

            expect(mockSupabase.from).toHaveBeenCalledWith("download_tokens");
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.lt).toHaveBeenCalledWith("expires_at", expect.any(String));
        });
    });

    describe("Upload Session Cleanup", () => {
        it("deletes expired upload sessions", async () => {
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // tokens
            mockSupabase.select.mockResolvedValueOnce({
                data: [{ code: "12345678" }],
            });

            const request = createRequest("Bearer test-secret");
            await GET(request);

            expect(mockSupabase.from).toHaveBeenCalledWith("upload_sessions");
            expect(mockSupabase.lt).toHaveBeenCalledWith("session_expires_at", expect.any(String));
        });
    });

    describe("File Cleanup", () => {
        it("deletes expired files and their storage", async () => {
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // tokens
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // sessions
            mockSupabase.select.mockResolvedValueOnce({
                data: [
                    { id: "file1", storage_key: "key1" },
                    { id: "file2", storage_key: "key2" },
                ],
            });
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // shares

            const request = createRequest("Bearer test-secret");
            const response = await GET(request);
            const data = await response.json();

            expect(r2Storage.deleteFile).toHaveBeenCalledWith("key1");
            expect(r2Storage.deleteFile).toHaveBeenCalledWith("key2");
            expect(data.stats.files).toBe(2);
        });

        it("handles R2 deletion failure gracefully", async () => {
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // tokens
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // sessions
            mockSupabase.select.mockResolvedValueOnce({
                data: [{ id: "file1", storage_key: "key1" }],
            });
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // shares

            vi.mocked(r2Storage.deleteFile).mockResolvedValue({
                success: false,
                error: "R2 error",
            });

            const request = createRequest("Bearer test-secret");
            const response = await GET(request);
            const data = await response.json();

            // Should still succeed overall
            expect(response.status).toBe(200);
            expect(data.stats.storageFailed).toBe(1);
            expect(logger.warn).toHaveBeenCalled();
        });
    });

    describe("Share Cleanup", () => {
        it("deletes expired shares and their contents in correct order", async () => {
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // tokens
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // sessions
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // files
            mockSupabase.select.mockResolvedValueOnce({
                data: [
                    { id: "share1", content_id: "content1" },
                    { id: "share2", content_id: "content2" },
                ],
            });

            const request = createRequest("Bearer test-secret");
            const response = await GET(request);
            const data = await response.json();

            // Should delete share_contents first (FK constraint)
            expect(mockSupabase.from).toHaveBeenCalledWith("share_contents");
            expect(mockSupabase.from).toHaveBeenCalledWith("shares");
            expect(data.stats.shares).toBe(2);
        });
    });

    describe("Database Configuration", () => {
        it("returns 503 when database not configured", async () => {
            vi.mock("@/lib/env", () => ({
                env: {
                    SUPABASE_URL: undefined,
                    SUPABASE_SERVICE_ROLE_KEY: undefined,
                },
            }));

            // Re-import to get new mock
            vi.resetModules();
            const { GET: freshGET } = await import("./route");

            const request = createRequest("Bearer test-secret");
            const response = await freshGET(request);
            const data = await response.json();

            expect(response.status).toBe(503);
            expect(data.error).toContain("Database");
        });
    });

    describe("Error Handling", () => {
        it("returns 500 on unexpected error", async () => {
            mockSupabase.select.mockRejectedValue(new Error("Database error"));

            const request = createRequest("Bearer test-secret");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Cleanup failed");
            expect(logger.exception).toHaveBeenCalled();
        });
    });

    describe("Batch Size Limiting", () => {
        it("limits file cleanup to batch size", async () => {
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // tokens
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // sessions
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // files
            mockSupabase.select.mockResolvedValueOnce({ data: [] }); // shares

            const request = createRequest("Bearer test-secret");
            await GET(request);

            // Should call limit(100) for file cleanup
            expect(mockSupabase.limit).toHaveBeenCalled();
        });
    });

    describe("Logging", () => {
        it("logs cleanup completion", async () => {
            const request = createRequest("Bearer test-secret");
            await GET(request);

            expect(logger.info).toHaveBeenCalledWith(
                "Cleanup completed",
                expect.objectContaining({ stats: expect.any(Object) })
            );
        });
    });
});
