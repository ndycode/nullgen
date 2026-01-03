/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock Supabase responses
const mockData: { data: unknown[] | null; error: unknown } = { data: [], error: null };
const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    maybeSingle: vi.fn(() => mockData),
    rpc: vi.fn(() => Promise.resolve(mockData)),
};

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => mockSupabase),
}));

// Mock env
vi.mock("../env", () => ({
    env: {
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "test-key",
    },
}));

// Mock logger
vi.mock("../logger", () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

// Mock client module exports
vi.mock("./client", async () => {
    const actual = await vi.importActual("./client");
    return {
        ...actual,
        getSupabase: vi.fn(() => mockSupabase),
        logDbTiming: vi.fn(),
    };
});

import {
    reserveUploadSession,
    getUploadSession,
    deleteUploadSession,
    finalizeUploadAtomic,
    type UploadSessionRecord,
    type FileRecord,
} from "./session-db";

// TODO: These tests require Supabase chainable mock refactoring
describe.skip("Session Database Operations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockData.data = [];
        mockData.error = null;
    });

    describe("reserveUploadSession", () => {
        it("creates upload session and returns true", async () => {
            const session: UploadSessionRecord = {
                code: "12345678",
                storage_key: "key-123",
                original_name: "test.txt",
                size: 1024,
                mime_type: "text/plain",
                expires_at: new Date().toISOString(),
                max_downloads: 1,
                password_hash: null,
                session_expires_at: new Date().toISOString(),
            };

            mockData.data = null;
            mockData.error = null;

            mockSupabase.insert.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await reserveUploadSession(session);

            expect(mockSupabase.from).toHaveBeenCalledWith("upload_sessions");
            expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
                code: "12345678",
                storage_key: "key-123",
                original_name: "test.txt",
            }));
            expect(result).toBe(true);
        });

        it("returns false on duplicate code", async () => {
            const session: UploadSessionRecord = {
                code: "12345678",
                storage_key: "key-123",
                original_name: "test.txt",
                size: 1024,
                mime_type: "text/plain",
                expires_at: new Date().toISOString(),
                max_downloads: 1,
                password_hash: null,
                session_expires_at: new Date().toISOString(),
            };

            mockData.data = null;
            mockData.error = { code: "23505", message: "duplicate key", details: null, hint: null };

            mockSupabase.insert.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await reserveUploadSession(session);
            expect(result).toBe(false);
        });
    });

    describe("getUploadSession", () => {
        it("returns session for valid code", async () => {
            const mockSession: UploadSessionRecord = {
                code: "12345678",
                storage_key: "key-123",
                original_name: "test.txt",
                size: 1024,
                mime_type: "text/plain",
                expires_at: new Date().toISOString(),
                max_downloads: 1,
                password_hash: null,
                session_expires_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            mockData.data = mockSession;
            mockData.error = null;

            mockSupabase.maybeSingle.mockImplementationOnce(() => Promise.resolve(mockData));

            const _result = await getUploadSession("12345678");

            expect(mockSupabase.from).toHaveBeenCalledWith("upload_sessions");
            expect(mockSupabase.eq).toHaveBeenCalledWith("code", "12345678");
        });

        it("returns null for missing session", async () => {
            mockData.data = null;
            mockData.error = null;

            mockSupabase.maybeSingle.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await getUploadSession("99999999");
            expect(result).toBeNull();
        });
    });

    describe("deleteUploadSession", () => {
        it("deletes session by code", async () => {
            mockData.data = null;
            mockData.error = null;

            mockSupabase.eq.mockImplementationOnce(() => Promise.resolve(mockData));

            await deleteUploadSession("12345678");

            expect(mockSupabase.from).toHaveBeenCalledWith("upload_sessions");
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith("code", "12345678");
        });
    });

    describe("finalizeUploadAtomic", () => {
        it("finalizes upload via RPC", async () => {
            const mockFile: FileRecord = {
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

            mockData.data = [mockFile];
            mockData.error = null;

            mockSupabase.rpc.mockImplementationOnce(() => Promise.resolve(mockData));

            const _result = await finalizeUploadAtomic("12345678");

            expect(mockSupabase.rpc).toHaveBeenCalledWith("finalize_upload_atomic", {
                p_code: "12345678",
            });
        });

        it("returns null for expired/missing session", async () => {
            mockData.data = [];
            mockData.error = null;

            mockSupabase.rpc.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await finalizeUploadAtomic("99999999");
            expect(result).toBeNull();
        });

        it("returns null for already finalized session", async () => {
            mockData.data = [];
            mockData.error = null;

            mockSupabase.rpc.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await finalizeUploadAtomic("12345678");
            expect(result).toBeNull();
        });
    });
});
