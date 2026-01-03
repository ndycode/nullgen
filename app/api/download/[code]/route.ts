import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { StorageError, ValidationError, formatErrorResponse } from "@/lib/errors";
import {
    CODE_LENGTH,
    DOWNLOAD_TOKEN_TTL_MINUTES,
    isValidDownloadCode,
    isDownloadEnabled,
} from "@/lib/constants";
import { verifyPassword } from "@/lib/passwords";
import {
    createDownloadToken,
    deleteFileById,
    getFileByCode,
    updateFileDownloadCount,
    type FileRecord,
} from "@/lib/db";
import { formatServerTiming, withTiming } from "@/lib/timing";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, private" };

function jsonResponse(
    data: Record<string, unknown>,
    init: ResponseInit = {},
    timings?: Record<string, number>
) {
    const headers = {
        ...NO_STORE_HEADERS,
        ...(init.headers || {}),
        ...(timings && Object.keys(timings).length > 0
            ? { "Server-Timing": formatServerTiming(timings) }
            : {}),
    };
    return NextResponse.json(data, {
        ...init,
        headers,
    });
}

/**
 * Best-effort cleanup of expired file data.
 * Logs failures but does not throw - cleanup failures are non-fatal.
 */
async function cleanupExpired(record: FileRecord, timings?: Record<string, number>): Promise<void> {
    try {
        if (timings) {
            await withTiming(timings, "db", () => deleteFileById(record.id));
            const deleteResult = await withTiming(timings, "r2", () =>
                r2Storage.deleteFile(record.storage_key)
            );
            if (!deleteResult.success) {
                logger.warn("R2 cleanup failed (non-fatal)", {
                    code: record.code,
                    error: deleteResult.error,
                });
            }
        } else {
            await deleteFileById(record.id);
            const deleteResult = await r2Storage.deleteFile(record.storage_key);
            if (!deleteResult.success) {
                logger.warn("R2 cleanup failed (non-fatal)", {
                    code: record.code,
                    error: deleteResult.error,
                });
            }
        }
    } catch (error) {
        logger.exception("Failed to delete expired file", error, { code: record.code });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timings: Record<string, number> = {};

    // Feature flag check
    if (!isDownloadEnabled()) {
        return jsonResponse({ error: "Downloads are temporarily disabled" }, { status: 503 });
    }

    try {
        const { code } = await params;

        if (!isValidDownloadCode(code)) {
            throw new ValidationError("Invalid code format", "code");
        }

        if (!r2Storage.isConfigured()) {
            throw new StorageError("Storage not configured");
        }

        const record = await withTiming(timings, "db", () => getFileByCode(code));
        if (!record) {
            return jsonResponse({ error: "File not found or expired" }, { status: 404 }, timings);
        }

        const expiresAt = new Date(record.expires_at);
        if (new Date() > expiresAt) {
            await cleanupExpired(record, timings);
            return jsonResponse({ error: "File has expired" }, { status: 410 }, timings);
        }

        if (record.max_downloads !== -1 && record.download_count >= record.max_downloads) {
            await cleanupExpired(record, timings);
            return jsonResponse({ error: "Download limit reached" }, { status: 410 }, timings);
        }

        return jsonResponse(
            {
                name: record.original_name,
                size: record.size,
                expiresAt: record.expires_at,
                requiresPassword: record.password_hash !== null,
                downloadsRemaining:
                    record.max_downloads === -1
                        ? "unlimited"
                        : Math.max(record.max_downloads - record.download_count, 0),
            },
            undefined,
            timings
        );
    } catch (error) {
        logger.exception("Download metadata error", error, { requestId });
        const { error: errorMessage, statusCode } = formatErrorResponse(error);
        return jsonResponse({ error: errorMessage }, { status: statusCode }, timings);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timings: Record<string, number> = {};

    // Feature flag check
    if (!isDownloadEnabled()) {
        return jsonResponse({ error: "Downloads are temporarily disabled" }, { status: 503 });
    }

    try {
        const { code } = await params;

        if (!isValidDownloadCode(code)) {
            throw new ValidationError("Invalid code format", "code");
        }

        if (!r2Storage.isConfigured()) {
            throw new StorageError("Storage not configured");
        }

        const body = await request.json().catch(() => ({}));
        const providedPassword = typeof body.password === "string" ? body.password : null;

        const maxAttempts = 3;
        let attempt = 0;
        let updated: FileRecord | null = null;
        let shouldDelete = false;

        while (attempt < maxAttempts) {
            const record = await withTiming(timings, "db", () => getFileByCode(code));
            if (!record) {
                return jsonResponse(
                    { error: "File not found or expired" },
                    { status: 404 },
                    timings
                );
            }

            const expiresAt = new Date(record.expires_at);
            if (new Date() > expiresAt) {
                await cleanupExpired(record, timings);
                return jsonResponse({ error: "File has expired" }, { status: 410 }, timings);
            }

            if (record.max_downloads !== -1 && record.download_count >= record.max_downloads) {
                await cleanupExpired(record, timings);
                return jsonResponse({ error: "Download limit reached" }, { status: 410 }, timings);
            }

            if (record.password_hash) {
                if (!providedPassword) {
                    return jsonResponse({ error: "Password required" }, { status: 401 });
                }
                if (!(await verifyPassword(providedPassword, record.password_hash))) {
                    return jsonResponse({ error: "Incorrect password" }, { status: 403 });
                }
            }

            const nextCount = record.download_count + 1;
            const result = await withTiming(timings, "db", () =>
                updateFileDownloadCount(record.id, record.download_count, nextCount)
            );
            if (result) {
                updated = result;
                shouldDelete =
                    result.max_downloads !== -1 && result.download_count >= result.max_downloads;
                break;
            }

            attempt += 1;
        }

        if (!updated) {
            return jsonResponse({ error: "Download busy, retry" }, { status: 409 }, timings);
        }

        const token = crypto.randomUUID();
        const tokenExpiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MINUTES * 60 * 1000);
        await withTiming(timings, "db", () =>
            createDownloadToken({
                token,
                file_id: updated.id,
                code: updated.code,
                delete_after: shouldDelete,
                expires_at: tokenExpiresAt.toISOString(),
            })
        );

        return jsonResponse(
            {
                token,
                downloadUrl: `/api/download/${updated.code}/stream?token=${encodeURIComponent(token)}`,
                expiresAt: tokenExpiresAt.toISOString(),
            },
            undefined,
            timings
        );
    } catch (error) {
        logger.exception("Download error", error, { requestId });
        const { error: errorMessage, statusCode } = formatErrorResponse(error);
        return jsonResponse({ error: errorMessage }, { status: statusCode }, timings);
    }
}
