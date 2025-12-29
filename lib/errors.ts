/**
 * Custom error classes for structured error handling
 */

/**
 * Base application error with status code
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: this.message,
            statusCode: this.statusCode,
        };
    }
}

/**
 * Storage-related errors (R2, file system)
 */
export class StorageError extends AppError {
    constructor(message: string, statusCode = 500) {
        super(`Storage error: ${message}`, statusCode);
    }
}

/**
 * Validation errors (invalid input, missing fields)
 */
export class ValidationError extends AppError {
    public readonly field?: string;

    constructor(message: string, field?: string) {
        super(message, 400);
        this.field = field;
    }

    toJSON() {
        return {
            error: this.message,
            statusCode: this.statusCode,
            ...(this.field && { field: this.field }),
        };
    }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404);
    }
}

/**
 * Authentication/Authorization errors
 */
export class AuthError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
    public readonly retryAfter?: number;

    constructor(retryAfter?: number) {
        super("Too many requests, please try again later", 429);
        this.retryAfter = retryAfter;
    }
}

/**
 * File validation errors
 */
export class FileValidationError extends ValidationError {
    constructor(message: string) {
        super(message, "file");
    }
}

/**
 * Type guard to check if error is operational (expected)
 */
export function isOperationalError(error: unknown): error is AppError {
    return error instanceof AppError && error.isOperational;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): { error: string; statusCode: number } {
    if (error instanceof AppError) {
        return error.toJSON();
    }

    // Unknown errors - don't leak details in production
    const message = process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : error instanceof Error ? error.message : "Unknown error";

    return { error: message, statusCode: 500 };
}
