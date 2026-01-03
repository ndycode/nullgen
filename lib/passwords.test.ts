import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import {
    hashPassword,
    verifyPassword,
    verifyPasswordWithMigration,
    isModernHash,
    isLegacyHash,
} from "./passwords";

// Mock logger to prevent console output during tests
vi.mock("./logger", () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

describe("Password Utilities", () => {
    describe("hashPassword", () => {
        it("produces valid scrypt format", async () => {
            const hash = await hashPassword("testPassword123");
            expect(hash).toMatch(/^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
        });

        it("produces different hashes for same password (random salt)", async () => {
            const hash1 = await hashPassword("testPassword");
            const hash2 = await hashPassword("testPassword");
            expect(hash1).not.toBe(hash2);
        });

        it("works with empty password", async () => {
            const hash = await hashPassword("");
            expect(hash).toMatch(/^scrypt\$/);
        });

        it("works with unicode password", async () => {
            const hash = await hashPassword("密码🔐");
            expect(hash).toMatch(/^scrypt\$/);
        });

        it("works with very long password", async () => {
            const longPassword = "a".repeat(10000);
            const hash = await hashPassword(longPassword);
            expect(hash).toMatch(/^scrypt\$/);
        });
    });

    describe("verifyPassword", () => {
        it("accepts correct password", async () => {
            const password = "correctPassword123";
            const hash = await hashPassword(password);
            const result = await verifyPassword(password, hash);
            expect(result).toBe(true);
        });

        it("rejects incorrect password", async () => {
            const hash = await hashPassword("correctPassword");
            const result = await verifyPassword("wrongPassword", hash);
            expect(result).toBe(false);
        });

        it("rejects empty password against valid hash", async () => {
            const hash = await hashPassword("somePassword");
            const result = await verifyPassword("", hash);
            expect(result).toBe(false);
        });

        it("returns false for empty stored hash", async () => {
            const result = await verifyPassword("anyPassword", "");
            expect(result).toBe(false);
        });

        it("handles unicode passwords correctly", async () => {
            const password = "密码🔐test";
            const hash = await hashPassword(password);
            expect(await verifyPassword(password, hash)).toBe(true);
            expect(await verifyPassword("wrong", hash)).toBe(false);
        });
    });

    describe("verifyPasswordWithMigration", () => {
        it("handles modern scrypt format correctly", async () => {
            const password = "modernPassword";
            const hash = await hashPassword(password);
            const result = await verifyPasswordWithMigration(password, hash);
            expect(result.verified).toBe(true);
            expect(result.needsRehash).toBe(false);
            expect(result.newHash).toBeUndefined();
        });

        it("rejects incorrect password with modern hash", async () => {
            const hash = await hashPassword("correctPassword");
            const result = await verifyPasswordWithMigration("wrongPassword", hash);
            expect(result.verified).toBe(false);
            expect(result.needsRehash).toBe(false);
        });

        it("handles legacy SHA-256 format and recommends rehash", async () => {
            const password = "legacyPassword";
            // Create legacy SHA-256 hash (64-char hex)
            const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
            expect(legacyHash.length).toBe(64);

            const result = await verifyPasswordWithMigration(password, legacyHash);
            expect(result.verified).toBe(true);
            expect(result.needsRehash).toBe(true);
            expect(result.newHash).toMatch(/^scrypt\$/);
        });

        it("rejects incorrect password with legacy hash", async () => {
            const legacyHash = crypto.createHash("sha256").update("correctPassword").digest("hex");
            const result = await verifyPasswordWithMigration("wrongPassword", legacyHash);
            expect(result.verified).toBe(false);
            expect(result.needsRehash).toBe(false);
        });

        it("returns false for empty stored hash", async () => {
            const result = await verifyPasswordWithMigration("anyPassword", "");
            expect(result.verified).toBe(false);
            expect(result.needsRehash).toBe(false);
        });

        it("returns false for malformed scrypt hash (wrong parts)", async () => {
            // Only 2 parts instead of 3
            const malformed = "scrypt$onlyonepartafterdollar";
            const result = await verifyPasswordWithMigration("password", malformed);
            expect(result.verified).toBe(false);
        });

        it("returns false for malformed scrypt hash (4 parts)", async () => {
            const malformed = "scrypt$part1$part2$part3";
            const result = await verifyPasswordWithMigration("password", malformed);
            expect(result.verified).toBe(false);
        });
    });

    describe("isModernHash", () => {
        it("returns true for scrypt format", () => {
            expect(isModernHash("scrypt$salt$hash")).toBe(true);
        });

        it("returns false for legacy SHA-256 format", () => {
            const legacy = crypto.createHash("sha256").update("test").digest("hex");
            expect(isModernHash(legacy)).toBe(false);
        });

        it("returns false for empty string", () => {
            expect(isModernHash("")).toBe(false);
        });

        it("returns false for random string", () => {
            expect(isModernHash("randomstring")).toBe(false);
        });
    });

    describe("isLegacyHash", () => {
        it("returns true for 64-char hex string", () => {
            const legacy = crypto.createHash("sha256").update("test").digest("hex");
            expect(isLegacyHash(legacy)).toBe(true);
        });

        it("returns false for scrypt format", () => {
            expect(isLegacyHash("scrypt$salt$hash")).toBe(false);
        });

        it("returns false for wrong length hex", () => {
            expect(isLegacyHash("abc123")).toBe(false);
        });

        it("returns false for 64-char non-hex string", () => {
            expect(isLegacyHash("g".repeat(64))).toBe(false);
        });

        it("returns false for empty string", () => {
            expect(isLegacyHash("")).toBe(false);
        });
    });

    describe("Timing-safe comparison", () => {
        it("timing-safe equal is used internally", async () => {
            // This test verifies the behavior is correct, not the internal implementation
            // Incorrect passwords should be rejected regardless of similar prefixes
            const hash = await hashPassword("password123");

            // All these should be rejected
            expect(await verifyPassword("password12", hash)).toBe(false);
            expect(await verifyPassword("password1234", hash)).toBe(false);
            expect(await verifyPassword("Password123", hash)).toBe(false);
            expect(await verifyPassword("", hash)).toBe(false);
        });
    });

    describe("Edge cases", () => {
        it("handles null-like values gracefully", async () => {
            // @ts-expect-error Testing null handling
            const result1 = await verifyPasswordWithMigration("password", null);
            expect(result1.verified).toBe(false);

            // @ts-expect-error Testing undefined handling
            const result2 = await verifyPasswordWithMigration("password", undefined);
            expect(result2.verified).toBe(false);
        });

        it("handles special characters in password", async () => {
            const password = "p@$$w0rd!#$%^&*()_+-=[]{}|;':\",./<>?`~";
            const hash = await hashPassword(password);
            expect(await verifyPassword(password, hash)).toBe(true);
        });

        it("handles newlines and whitespace in password", async () => {
            const password = "password\nwith\nnewlines\tand\ttabs  spaces";
            const hash = await hashPassword(password);
            expect(await verifyPassword(password, hash)).toBe(true);
            expect(await verifyPassword(password.trim(), hash)).toBe(false);
        });
    });
});
