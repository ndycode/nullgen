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
    createDownloadToken,
    consumeDownloadToken,
    deleteAndReturnDownloadToken,
    getDownloadToken,
    type DownloadTokenRecord,
} from "./token-db";
import { ValidationError } from "../errors";

describe("Token Database Operations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockData.data = [];
        mockData.error = null;
    });

    describe("createDownloadToken", () => {
        it("creates token record", async () => {
            const tokenRecord: Omit<DownloadTokenRecord, "created_at"> = {
                token: "uuid-token-123",
                file_id: "uuid-file-123",
                code: "12345678",
                delete_after: false,
                expires_at: new Date().toISOString(),
            };

            mockData.data = null;
            mockData.error = null;

            mockSupabase.insert.mockImplementationOnce(() => Promise.resolve(mockData));

            await createDownloadToken(tokenRecord);

            expect(mockSupabase.from).toHaveBeenCalledWith("download_tokens");
            expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
                token: "uuid-token-123",
                file_id: "uuid-file-123",
                code: "12345678",
                delete_after: false,
            }));
        });

        it("creates token with delete_after flag", async () => {
            const tokenRecord: Omit<DownloadTokenRecord, "created_at"> = {
                token: "uuid-token-123",
                file_id: "uuid-file-123",
                code: "12345678",
                delete_after: true,
                expires_at: new Date().toISOString(),
            };

            mockData.data = null;
            mockData.error = null;

            mockSupabase.insert.mockImplementationOnce(() => Promise.resolve(mockData));

            await createDownloadToken(tokenRecord);

            expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
                delete_after: true,
            }));
        });
    });

    describe("deleteAndReturnDownloadToken", () => {
        it("deletes and returns token atomically", async () => {
            const mockToken: DownloadTokenRecord = {
                token: "uuid-token-123",
                file_id: "uuid-file-123",
                code: "12345678",
                delete_after: false,
                expires_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockToken];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await deleteAndReturnDownloadToken("uuid-token-123");

            expect(mockSupabase.from).toHaveBeenCalledWith("download_tokens");
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith("token", "uuid-token-123");
        });

        it("returns null for missing token", async () => {
            mockData.data = [];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await deleteAndReturnDownloadToken("nonexistent-token");
            expect(result).toBeNull();
        });

        it("throws ValidationError for empty token", async () => {
            await expect(deleteAndReturnDownloadToken("")).rejects.toThrow(ValidationError);
        });
    });

    describe("consumeDownloadToken (deprecated)", () => {
        it("delegates to deleteAndReturnDownloadToken", async () => {
            const mockToken: DownloadTokenRecord = {
                token: "uuid-token-123",
                file_id: "uuid-file-123",
                code: "12345678",
                delete_after: false,
                expires_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockToken];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await consumeDownloadToken("uuid-token-123");

            // Should behave same as deleteAndReturnDownloadToken
            expect(mockSupabase.delete).toHaveBeenCalled();
        });
    });

    describe("getDownloadToken", () => {
        it("returns token without deletion (read-only)", async () => {
            const mockToken: DownloadTokenRecord = {
                token: "uuid-token-123",
                file_id: "uuid-file-123",
                code: "12345678",
                delete_after: false,
                expires_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            mockData.data = mockToken;
            mockData.error = null;

            mockSupabase.maybeSingle.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await getDownloadToken("uuid-token-123");

            expect(mockSupabase.from).toHaveBeenCalledWith("download_tokens");
            expect(mockSupabase.select).toHaveBeenCalledWith("*");
            expect(mockSupabase.eq).toHaveBeenCalledWith("token", "uuid-token-123");
            // Should NOT call delete
            expect(mockSupabase.delete).not.toHaveBeenCalled();
        });

        it("returns null for missing token", async () => {
            mockData.data = null;
            mockData.error = null;

            mockSupabase.maybeSingle.mockImplementationOnce(() => Promise.resolve(mockData));

            const result = await getDownloadToken("nonexistent-token");
            expect(result).toBeNull();
        });

        it("returns null for empty token", async () => {
            const result = await getDownloadToken("");
            expect(result).toBeNull();
        });
    });

    describe("Token single-use invariant", () => {
        it("token cannot be consumed twice", async () => {
            // First consumption returns the token
            const mockToken: DownloadTokenRecord = {
                token: "uuid-token-123",
                file_id: "uuid-file-123",
                code: "12345678",
                delete_after: false,
                expires_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            mockData.data = [mockToken];
            mockData.error = null;

            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));
            const first = await deleteAndReturnDownloadToken("uuid-token-123");
            expect(first).not.toBeNull();

            // Second consumption returns null (token already deleted)
            mockData.data = [];
            mockSupabase.select.mockImplementationOnce(() => Promise.resolve(mockData));
            const second = await deleteAndReturnDownloadToken("uuid-token-123");
            expect(second).toBeNull();
        });
    });
});
