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
    update: vi.fn(() => mockSupabase),
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
    createShareContent,
    deleteShareContent,
    createShareRecord,
    getShareWithContentByCode,
    updateShareViewCount,
    createShareAtomic,
    type ShareRecord,
    type ShareContentRecord,
    type ShareWithContentRecord,
    type CreateShareAtomicParams,
} from "./share-db";

describe("Share Database Operations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockData.data = [];
        mockData.error = null;
    });

    describe("createShareContent", () => {
        it("creates content record", async () => {
            const mockContent: ShareContentRecord = {
                id: "uuid-content-123",
                content: "test content",
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockContent];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const _result = await createShareContent("test content");

            expect(mockSupabase.from).toHaveBeenCalledWith("share_contents");
            expect(mockSupabase.insert).toHaveBeenCalledWith({ content: "test content" });
        });

        it("throws if content was not created", async () => {
            mockData.data = [];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            await expect(createShareContent("test")).rejects.toThrow("Share content was not created");
        });
    });

    describe("deleteShareContent", () => {
        it("deletes content by id", async () => {
            const uuid = "123e4567-e89b-12d3-a456-426614174000";

            mockData.data = null;
            mockData.error = null;

            mockSupabase.eq.mockImplementationOnce(() => Promise.resolve(mockData));

            await deleteShareContent(uuid);

            expect(mockSupabase.from).toHaveBeenCalledWith("share_contents");
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith("id", uuid);
        });

        it("throws for invalid UUID", async () => {
            await expect(deleteShareContent("invalid")).rejects.toThrow();
        });
    });

    describe("createShareRecord", () => {
        it("creates share record with all fields", async () => {
            const mockShare: ShareRecord = {
                id: "uuid-share-123",
                code: "abc12345",
                type: "paste",
                content_id: "uuid-content-123",
                original_name: null,
                mime_type: null,
                size: null,
                language: null,
                expires_at: new Date().toISOString(),
                password_hash: null,
                burn_after_reading: false,
                view_count: 0,
                burned: false,
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockShare];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const input = {
                code: "abc12345",
                type: "paste",
                content_id: "uuid-content-123",
                original_name: null,
                mime_type: null,
                size: null,
                language: null,
                expires_at: new Date().toISOString(),
                password_hash: null,
                burn_after_reading: false,
                view_count: 0,
                burned: false,
            };

            const _result = await createShareRecord(input);

            expect(mockSupabase.from).toHaveBeenCalledWith("shares");
            expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
                code: "abc12345",
                type: "paste",
            }));
        });

        it("returns null on duplicate code", async () => {
            mockData.data = null;
            mockData.error = { code: "23505", message: "duplicate key", details: null, hint: null };

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const input = {
                code: "abc12345",
                type: "paste",
                content_id: "uuid-content-123",
                original_name: null,
                mime_type: null,
                size: null,
                language: null,
                expires_at: new Date().toISOString(),
                password_hash: null,
                burn_after_reading: false,
                view_count: 0,
                burned: false,
            };

            const result = await createShareRecord(input);
            expect(result).toBeNull();
        });
    });

    describe("getShareWithContentByCode", () => {
        it("returns share with joined content", async () => {
            const mockShare = {
                id: "uuid-share-123",
                code: "abc12345",
                type: "paste",
                content_id: "uuid-content-123",
                original_name: null,
                mime_type: null,
                size: null,
                language: null,
                expires_at: new Date().toISOString(),
                password_hash: null,
                burn_after_reading: false,
                view_count: 0,
                burned: false,
                created_at: new Date().toISOString(),
                content: {
                    id: "uuid-content-123",
                    content: "the actual content",
                    created_at: new Date().toISOString(),
                },
            };

            mockData.data = mockShare;
            mockData.error = null;

            mockSupabase.maybeSingle.mockImplementationOnce(() => Promise.resolve(mockData));

            const _result = await getShareWithContentByCode("abc12345");

            expect(mockSupabase.from).toHaveBeenCalledWith("shares");
            expect(mockSupabase.select).toHaveBeenCalledWith("*, content:share_contents(*)");
            expect(mockSupabase.eq).toHaveBeenCalledWith("code", "abc12345");
        });

        it("returns null for missing share", async () => {
            mockData.data = null;
            mockData.error = null;

            mockSupabase.maybeSingle.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await getShareWithContentByCode("notfound");
            expect(result).toBeNull();
        });
    });

    describe("updateShareViewCount", () => {
        it("increments view count with optimistic locking", async () => {
            const uuid = "123e4567-e89b-12d3-a456-426614174000";
            const mockShare: ShareRecord = {
                id: uuid,
                code: "abc12345",
                type: "paste",
                content_id: "uuid-content-123",
                original_name: null,
                mime_type: null,
                size: null,
                language: null,
                expires_at: new Date().toISOString(),
                password_hash: null,
                burn_after_reading: false,
                view_count: 2,
                burned: false,
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockShare];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const _result = await updateShareViewCount(uuid, 1, false);

            expect(mockSupabase.eq).toHaveBeenCalledWith("id", uuid);
            expect(mockSupabase.eq).toHaveBeenCalledWith("view_count", 1);
        });

        it("sets burned flag when burnAfterReading is true", async () => {
            const uuid = "123e4567-e89b-12d3-a456-426614174000";
            const mockShare: ShareRecord = {
                id: uuid,
                code: "abc12345",
                type: "note",
                content_id: "uuid-content-123",
                original_name: null,
                mime_type: null,
                size: null,
                language: null,
                expires_at: new Date().toISOString(),
                password_hash: null,
                burn_after_reading: true,
                view_count: 1,
                burned: true,
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockShare];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const _result = await updateShareViewCount(uuid, 0, true);

            expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
                view_count: 1,
                burned: true,
            }));
        });

        it("returns null on concurrent modification", async () => {
            const uuid = "123e4567-e89b-12d3-a456-426614174000";

            mockData.data = [];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await updateShareViewCount(uuid, 5, false);
            expect(result).toBeNull();
        });
    });

    describe("createShareAtomic", () => {
        it("creates share atomically via RPC", async () => {
            const mockResult = {
                share_id: "uuid-share-123",
                content_id: "uuid-content-123",
                code: "abc12345",
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockResult];
            mockData.error = null;

            mockSupabase.rpc.mockImplementationOnce(() => Promise.resolve(mockData));

            const params: CreateShareAtomicParams = {
                content: "test content",
                code: "abc12345",
                type: "paste",
                expires_at: new Date().toISOString(),
            };

            const _result = await createShareAtomic(params);

            expect(mockSupabase.rpc).toHaveBeenCalledWith("create_share_atomic", expect.objectContaining({
                p_content: "test content",
                p_code: "abc12345",
                p_type: "paste",
            }));
        });

        it("returns null on code collision", async () => {
            mockData.data = [];
            mockData.error = null;

            mockSupabase.rpc.mockImplementationOnce(() => Promise.resolve(mockData));

            const params: CreateShareAtomicParams = {
                content: "test content",
                code: "existing",
                type: "paste",
                expires_at: new Date().toISOString(),
            };

            const result = await createShareAtomic(params);
            expect(result).toBeNull();
        });

        it("passes all optional parameters", async () => {
            const mockResult = {
                share_id: "uuid-share-123",
                content_id: "uuid-content-123",
                code: "abc12345",
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockResult];
            mockData.error = null;

            mockSupabase.rpc.mockImplementationOnce(() => Promise.resolve(mockData));

            const params: CreateShareAtomicParams = {
                content: "test content",
                code: "abc12345",
                type: "code",
                original_name: "script.js",
                mime_type: "application/javascript",
                size: 1024,
                language: "javascript",
                expires_at: new Date().toISOString(),
                password_hash: "hash123",
                burn_after_reading: true,
            };

            await createShareAtomic(params);

            expect(mockSupabase.rpc).toHaveBeenCalledWith("create_share_atomic", expect.objectContaining({
                p_original_name: "script.js",
                p_mime_type: "application/javascript",
                p_size: 1024,
                p_language: "javascript",
                p_password_hash: "hash123",
                p_burn_after_reading: true,
            }));
        });
    });
});
