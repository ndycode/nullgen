/**
 * Application constants
 * Centralized magic numbers and configuration values
 */

// =============================================================================
// File Upload Limits
// =============================================================================

/** Maximum total upload size in bytes (1 GB) */
export const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024;

/** Maximum individual file size in bytes (100 MB) */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Allowed MIME types for uploads */
export const ALLOWED_MIME_TYPES = [
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "text/*",
    "application/json",
    "application/xml",
] as const;

// =============================================================================
// Dead Drop Settings
// =============================================================================

/** Length of download codes (numeric) */
export const CODE_LENGTH = 8;

/** Length of share codes (alphanumeric) */
export const SHARE_CODE_LENGTH = 8;

/** Default expiry time in minutes */
export const DEFAULT_EXPIRY_MINUTES = 60;

/** Maximum expiry time in minutes (7 days) */
export const MAX_EXPIRY_MINUTES = 60 * 24 * 7;

/** Default max downloads */
export const DEFAULT_MAX_DOWNLOADS = 1;

/** Allowed max downloads values (-1 means unlimited) */
export const ALLOWED_MAX_DOWNLOADS = [1, 5, 10, -1] as const;

/** Upload session time-to-live in minutes */
export const UPLOAD_SESSION_TTL_MINUTES = 15;

/** Download token time-to-live in minutes */
export const DOWNLOAD_TOKEN_TTL_MINUTES = 5;

/** Rate limit window in milliseconds */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Rate limit: max uploads per minute per IP */
export const UPLOAD_RATE_LIMIT = 10;

/** Rate limit: max downloads per minute per IP */
export const DOWNLOAD_RATE_LIMIT = 60;

/** Rate limit: max share reads/creates per minute per IP */
export const SHARE_RATE_LIMIT = 60;

/** Max text share content size in bytes */
export const MAX_SHARE_TEXT_SIZE = 1024 * 1024;

/** Max image share content size in bytes */
export const MAX_SHARE_IMAGE_BYTES = 5 * 1024 * 1024;

/** Maximum share expiry time in minutes (30 days) */
export const MAX_SHARE_EXPIRY_MINUTES = 60 * 24 * 30;

// =============================================================================
// UI Constants
// =============================================================================

/** Number of recent tools to show */
export const RECENT_TOOLS_COUNT = 6;

/** Animation durations in ms */
export const ANIMATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const;

/** Breakpoints matching Tailwind */
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    "2XL": 1536,
} as const;

// =============================================================================
// API Routes
// =============================================================================

export const API_ROUTES = {
    UPLOAD: "/api/upload",
    DOWNLOAD: (code: string) => `/api/download/${code}`,
    SHARE: "/api/share",
    SHARE_GET: (code: string) => `/api/share/${code}`,
} as const;

// =============================================================================
// Storage Keys (localStorage)
// =============================================================================

export const STORAGE_KEYS = {
    THEME: "theme",
    FAVORITES: "vxid-favorites",
    RECENT: "vxid-recent",
} as const;
