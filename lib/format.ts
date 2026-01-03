/**
 * Format bytes into human-readable file size.
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format time remaining until expiration.
 * @param expiresAt - ISO date string
 * @returns Human-readable time remaining (e.g., "2h 30m" or "Expired")
 */
export function formatTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Truncate text with ellipsis.
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
}
