import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { StorageError, ValidationError, formatErrorResponse } from "@/lib/errors";
import { consumeDownloadToken, deleteFileById, getFileById, getDownloadToken, type FileRecord } from "@/lib/db";
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
            const deleteResult = await withTiming(timings, "r2", () => r2Storage.deleteFile(record.storage_key));
            if (!deleteResult.success) {
                logger.warn("R2 cleanup failed (non-fatal)", { code: record.code, error: deleteResult.error });
            }
        } else {
            await deleteFileById(record.id);
            const deleteResult = await r2Storage.deleteFile(record.storage_key);
            if (!deleteResult.success) {
                logger.warn("R2 cleanup failed (non-fatal)", { code: record.code, error: deleteResult.error });
            }
        }
    } catch (error) {
        logger.exception("Failed to delete expired file", error, { code: record.code });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timings: Record<string, number> = {};

    try {
        const { code } = await params;
        const token = request.nextUrl.searchParams.get("token");

        if (!token) {
            throw new ValidationError("Download token required", "token");
        }

        if (!r2Storage.isConfigured()) {
            throw new StorageError("Storage not configured");
        }

        // First, validate token without consuming it
        const tokenRecord = await withTiming(timings, "db", () => getDownloadToken(token));
        if (!tokenRecord || tokenRecord.code !== code) {
            return jsonResponse({ error: "Invalid or expired token" }, { status: 404 }, timings);
        }

        if (new Date(tokenRecord.expires_at) < new Date()) {
            return jsonResponse({ error: "Download token expired" }, { status: 410 }, timings);
        }

        // Only consume (delete) token after validation passes
        await withTiming(timings, "db", () => consumeDownloadToken(token));

        const record = await withTiming(timings, "db", () => getFileById(tokenRecord.file_id));
        if (!record) {
            return jsonResponse({ error: "File not found or expired" }, { status: 404 }, timings);
        }

        const expiresAt = new Date(record.expires_at);
        if (new Date() > expiresAt) {
            await cleanupExpired(record, timings);
            return jsonResponse({ error: "File has expired" }, { status: 410 }, timings);
        }

        const stream = await withTiming(timings, "r2", () => r2Storage.downloadStream(record.storage_key));

        if (tokenRecord.delete_after) {
            await withTiming(timings, "db", () => deleteFileById(record.id));
            const deleteResult = await withTiming(timings, "r2", () => r2Storage.deleteFile(record.storage_key));
            if (!deleteResult.success) {
                logger.warn("R2 delete failed after download (non-fatal)", {
                    code: record.code,
                    error: deleteResult.error
                });
            }
        }

        return new NextResponse(stream, {
            headers: {
                ...NO_STORE_HEADERS,
                ...(Object.keys(timings).length > 0 ? { "Server-Timing": formatServerTiming(timings) } : {}),
                "Content-Type": record.mime_type || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${encodeURIComponent(record.original_name)}"`,
                "Content-Length": record.size.toString(),
                // Security: Prevent MIME sniffing attacks
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        logger.exception("Download stream error", error, { requestId });
        const { error: errorMessage, statusCode } = formatErrorResponse(error);
        return jsonResponse({ error: errorMessage }, { status: statusCode }, timings);
    }
}
