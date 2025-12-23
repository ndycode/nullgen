// Shared file store for file metadata
// In production, replace this with a database (Supabase, Planetscale, etc.)

export interface FileMetadata {
    // Storage info
    storageType: "local" | "r2";
    filename: string; // Local filename or R2 Key

    // File info
    originalName: string;
    size: number;
    mimeType: string;

    // Options
    expiresAt: Date;
    maxDownloads: number;
    downloadCount: number;
    password: string | null;

    // Status
    downloaded: boolean;
}

// Global store that persists across requests (in development)
// Note: This will reset on server restart - use a database in production
declare global {
    // eslint-disable-next-line no-var
    var fileStore: Map<string, FileMetadata> | undefined;
}

export const fileStore: Map<string, FileMetadata> = global.fileStore || new Map();

if (process.env.NODE_ENV !== "production") {
    global.fileStore = fileStore;
}
