// Shared file store for file metadata
// In production, replace this with a database (Supabase, Planetscale, etc.)

export interface FileMetadata {
    // Storage info
    storageType: "local" | "gdrive";
    filename: string; // Local filename or Google Drive file ID

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
