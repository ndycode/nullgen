/**
 * Centralized type definitions for vxid.cc
 * All shared types should be defined here for consistency across the codebase
 */

// =============================================================================
// File & Storage Types
// =============================================================================

export type StorageType = "local" | "r2";

export interface FileMetadata {
    /** Storage backend type */
    storageType: StorageType;
    /** Storage key/filename */
    filename: string;
    /** Original filename from user */
    originalName: string;
    /** File size in bytes */
    size: number;
    /** MIME type */
    mimeType: string;
    /** Expiration timestamp */
    expiresAt: Date;
    /** Maximum allowed downloads (-1 for unlimited) */
    maxDownloads: number;
    /** Current download count */
    downloadCount: number;
    /** Hashed password (null if not protected) */
    password: string | null;
    /** Whether file has been downloaded at least once */
    downloaded: boolean;
}

// =============================================================================
// API Types
// =============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface UploadRequest {
    files: File[];
    expiryMinutes?: number;
    maxDownloads?: number;
    password?: string | null;
}

export interface UploadResponse {
    code: string;
    expiresAt: string;
    storageType: StorageType;
}

export interface DownloadInfo {
    name: string;
    size: number;
    expiresAt: string;
    requiresPassword: boolean;
    downloadsRemaining: number | string;
}

// =============================================================================
// Share Types
// =============================================================================

export type ShareType =
    | "paste"
    | "code"
    | "json"
    | "csv"
    | "image"
    | "secret"
    | "link"
    | "qr";

export interface ShareMetadata {
    type: ShareType;
    content: string;
    createdAt: string;
    expiresAt?: string;
    viewCount?: number;
    maxViews?: number;
    password?: string | null;
    /** For code shares */
    language?: string;
    /** For secret notes - burn after reading */
    burnAfterRead?: boolean;
}

// =============================================================================
// Tool Types
// =============================================================================

export type ToolCategory = "checker" | "sharing" | "generate" | "text" | "image";

export interface Tool {
    id: string;
    name: string;
    tagline: string;
    icon: React.ComponentType<{ className?: string; weight?: string }>;
    category: ToolCategory;
}

// =============================================================================
// Component Props
// =============================================================================

export interface ToolProps {
    className?: string;
}

export interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// =============================================================================
// Hook Return Types
// =============================================================================

export type LoadingStatus = "idle" | "loading" | "ready" | "downloading" | "error";

export interface UseDownloadState {
    code: string;
    status: LoadingStatus;
    error: string;
    fileInfo: DownloadInfo | null;
    password: string;
}

export interface UseUploadState {
    status: "idle" | "uploading" | "success" | "error";
    progress: number;
    error: string;
    code: string | null;
}
