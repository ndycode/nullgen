/**
 * @deprecated This in-memory file store is for development testing only.
 * All production code MUST use lib/db.ts for database operations.
 *
 * DO NOT import this file in production code.
 * It will reset on server restart and does not work across server instances.
 */

export interface FileMetadata {
    // Storage info
    storageType: "local" | "r2";
    filename: string; // Local filename or R2 Key

    // File info
    originalName: string;
    size: number;
    mimeType: string;

    // Options
    expiresAt: string;
    maxDownloads: number;
    downloadCount: number;
    password: string | null;

    // Status
    downloaded: boolean;
}

// Throw in production - this module should never be used
if (process.env.NODE_ENV === "production") {
    throw new Error(
        "FATAL: lib/file-store.ts imported in production. " +
        "This in-memory store does not persist data. Use lib/db.ts instead."
    );
}

// Global store that persists across requests (in development only)
declare global {
    // eslint-disable-next-line no-var
    var fileStore: Map<string, FileMetadata> | undefined;
}

/**
 * @deprecated Use lib/db.ts for database operations.
 */
export const fileStore: Map<string, FileMetadata> = global.fileStore || new Map();

global.fileStore = fileStore;

// Log warning on first import - even in development, this is suspect
console.warn(
    "[DEPRECATED] lib/file-store.ts imported. This in-memory store is for testing only. " +
    "Use lib/db.ts for persistent storage."
);
