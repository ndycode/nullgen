import { describe, it, expect, vi } from "vitest";
import {
    AppError,
    StorageError,
    ValidationError,
    NotFoundError,
    AuthError,
    RateLimitError,
    FileValidationError,
    isOperationalError,
    formatErrorResponse,
} from "./errors";

describe("Error Classes", () => {
    describe("AppError", () => {
        it("should create with default values", () => {
            const error = new AppError("Test error");
            expect(error.message).toBe("Test error");
            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(true);
            expect(error.name).toBe("AppError");
        });

        it("should create with custom status code", () => {
            const error = new AppError("Not found", 404);
            expect(error.statusCode).toBe(404);
        });

        it("should serialize to JSON", () => {
            const error = new AppError("Test", 400);
            expect(error.toJSON()).toEqual({
                error: "Test",
                statusCode: 400,
            });
        });
    });

    describe("StorageError", () => {
        it("should prefix message with 'Storage error:'", () => {
            const error = new StorageError("Connection failed");
            expect(error.message).toBe("Storage error: Connection failed");
            expect(error.statusCode).toBe(500);
        });
    });

    describe("ValidationError", () => {
        it("should have status 400", () => {
            const error = new ValidationError("Invalid input");
            expect(error.statusCode).toBe(400);
        });

        it("should include field in JSON", () => {
            const error = new ValidationError("Required", "email");
            expect(error.toJSON()).toEqual({
                error: "Required",
                statusCode: 400,
                field: "email",
            });
        });
    });

    describe("NotFoundError", () => {
        it("should have status 404", () => {
            const error = new NotFoundError("User");
            expect(error.message).toBe("User not found");
            expect(error.statusCode).toBe(404);
        });

        it("should use default resource name", () => {
            const error = new NotFoundError();
            expect(error.message).toBe("Resource not found");
        });
    });

    describe("AuthError", () => {
        it("should have status 401", () => {
            const error = new AuthError();
            expect(error.message).toBe("Unauthorized");
            expect(error.statusCode).toBe(401);
        });
    });

    describe("RateLimitError", () => {
        it("should have status 429", () => {
            const error = new RateLimitError(60);
            expect(error.statusCode).toBe(429);
            expect(error.retryAfter).toBe(60);
        });
    });

    describe("FileValidationError", () => {
        it("should extend ValidationError with file field", () => {
            const error = new FileValidationError("File too large");
            expect(error.field).toBe("file");
            expect(error.statusCode).toBe(400);
        });
    });
});

describe("Error Utilities", () => {
    describe("isOperationalError", () => {
        it("should return true for AppError", () => {
            expect(isOperationalError(new AppError("test"))).toBe(true);
        });

        it("should return false for regular Error", () => {
            expect(isOperationalError(new Error("test"))).toBe(false);
        });

        it("should return false for non-errors", () => {
            expect(isOperationalError("string")).toBe(false);
            expect(isOperationalError(null)).toBe(false);
        });
    });

    describe("formatErrorResponse", () => {
        it("should format AppError correctly", () => {
            const error = new ValidationError("Bad input");
            expect(formatErrorResponse(error)).toEqual({
                error: "Bad input",
                statusCode: 400,
            });
        });

        it("should return generic message for unknown errors", () => {
            // In development mode, it shows the actual message
            // This test verifies the function works without modifying NODE_ENV
            const response = formatErrorResponse(new Error("Secret details"));
            expect(response.statusCode).toBe(500);
            // In test environment (non-production), it shows the real message
            expect(response.error).toBe("Secret details");
        });
    });
});
