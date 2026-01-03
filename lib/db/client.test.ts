import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock Supabase client
const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    maybeSingle: vi.fn(),
    rpc: vi.fn(),
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

// Import after mocks
import {
    isValidUUID,
    validateUUID,
    getSupabase,
    isDuplicateError,
    handleDbError,
} from "./client";
import { ValidationError, StorageError } from "../errors";

describe("Database Client Utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("isValidUUID", () => {
        it("returns true for valid UUID", () => {
            expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
        });

        it("returns true for uppercase UUID", () => {
            expect(isValidUUID("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
        });

        it("returns true for mixed case UUID", () => {
            expect(isValidUUID("123e4567-E89B-12d3-A456-426614174000")).toBe(true);
        });

        it("returns false for empty string", () => {
            expect(isValidUUID("")).toBe(false);
        });

        it("returns false for wrong length", () => {
            expect(isValidUUID("123e4567-e89b-12d3-a456")).toBe(false);
        });

        it("returns false for missing dashes", () => {
            expect(isValidUUID("123e4567e89b12d3a456426614174000")).toBe(false);
        });

        it("returns false for invalid characters", () => {
            expect(isValidUUID("123e4567-e89b-12d3-a456-42661417400g")).toBe(false);
        });

        it("returns false for wrong dash positions", () => {
            expect(isValidUUID("12-3e4567-e89b-12d3-a456-426614174000")).toBe(false);
        });
    });

    describe("validateUUID", () => {
        it("does not throw for valid UUID", () => {
            expect(() => validateUUID("123e4567-e89b-12d3-a456-426614174000", "test")).not.toThrow();
        });

        it("throws ValidationError for invalid UUID", () => {
            expect(() => validateUUID("invalid-uuid", "test.field")).toThrow(ValidationError);
        });

        it("throws ValidationError for empty string", () => {
            expect(() => validateUUID("", "test.field")).toThrow(ValidationError);
        });

        it("includes context in error message", () => {
            try {
                validateUUID("invalid", "file_metadata.id");
                expect.fail("Should have thrown");
            } catch (error) {
                expect((error as Error).message).toContain("file_metadata.id");
            }
        });
    });

    describe("getSupabase", () => {
        it("returns supabase client", () => {
            const client = getSupabase();
            expect(client).toBeDefined();
        });
    });

    describe("isDuplicateError", () => {
        it("returns true for PostgreSQL 23505 error code", () => {
            const error = { name: "PostgrestError", code: "23505", message: "duplicate key", details: "", hint: "" } as const;
            expect(isDuplicateError(error)).toBe(true);
        });

        it("returns false for other error codes", () => {
            const error = { name: "PostgrestError", code: "42P01", message: "table not found", details: "", hint: "" } as const;
            expect(isDuplicateError(error)).toBe(false);
        });

        it("returns false for null code", () => {
            const error = { name: "PostgrestError", code: null as unknown as string, message: "error", details: "", hint: "" };
            expect(isDuplicateError(error)).toBe(false);
        });
    });

    describe("handleDbError", () => {
        it("throws StorageError with message", () => {
            const error = { name: "PostgrestError", code: "42P01", message: "table not found", details: "details", hint: "hint" };
            expect(() => handleDbError(error, "Custom error message")).toThrow(StorageError);
        });

        it("includes custom message in thrown error", () => {
            const error = { name: "PostgrestError", code: "42P01", message: "pg error", details: "", hint: "" } as const;
            try {
                handleDbError(error, "Failed to save data");
                expect.fail("Should have thrown");
            } catch (err) {
                expect((err as Error).message).toContain("Failed to save data");
            }
        });
    });
});
