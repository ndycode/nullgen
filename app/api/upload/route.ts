import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { ValidationError, StorageError, formatErrorResponse } from "@/lib/errors";
import {
    MAX_UPLOAD_SIZE,
    MAX_FILE_SIZE,
    CODE_LENGTH,
    DEFAULT_EXPIRY_MINUTES,
    DEFAULT_MAX_DOWNLOADS,
    MAX_EXPIRY_MINUTES,
    ALLOWED_MIME_TYPES,
    ALLOWED_MAX_DOWNLOADS,
    UPLOAD_SESSION_TTL_MINUTES,
} from "@/lib/constants";
import { hashPassword } from "@/lib/passwords";
import { reserveUploadSession, type UploadSessionRecord } from "@/lib/db";
import { formatServerTiming, withTiming } from "@/lib/timing";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, private" };

// Generate a numeric code
function generateCode(): string {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += crypto.randomInt(0, 10).toString();
    }
    return code;
}

/**
 * Check if MIME type is in the allowed list.
 * 
 * SECURITY NOTE: This validates the *declared* MIME type from the client request,
 * NOT the actual file contents. Clients can lie about MIME types.
 * This is a first-line defense; for sensitive applications, also verify
 * file magic numbers/headers after upload.
 */
function isAllowedMimeType(mimeType: string): boolean {
    if (!mimeType) return false;
    return ALLOWED_MIME_TYPES.some((allowed) => {
        if (allowed.endsWith("/*")) {
            return mimeType.startsWith(allowed.slice(0, -1));
        }
        return mimeType === allowed;
    });
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[/\\]/g, "_")
        .replace(/\.\./g, "_")
        .replace(/[<>:"|?*]/g, "_")
        .slice(0, 255);
}

export async function POST(request: NextRequest) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timings: Record<string, number> = {};

    try {
        const body = await request.json().catch(() => ({}));
        const rawName = typeof body.filename === "string" ? body.filename : "";
        const rawSize = Number(body.size);
        const rawMime = typeof body.mimeType === "string" ? body.mimeType : "";
        const expiryRaw = Number.parseInt(body.expiryMinutes as string, 10);
        const maxDownloadsRaw = Number.parseInt(body.maxDownloads as string, 10);
        const password = typeof body.password === "string" ? body.password.trim() : "";

        if (!rawName) {
            throw new ValidationError("Invalid file name", "files");
        }
        if (!Number.isFinite(rawSize) || rawSize <= 0) {
            throw new ValidationError("Invalid file size", "files");
        }
        if (rawSize > MAX_FILE_SIZE) {
            throw new ValidationError(
                `File size exceeds ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB limit`,
                "files"
            );
        }
        if (rawSize > MAX_UPLOAD_SIZE) {
            throw new ValidationError(
                `Total file size exceeds ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)} MB limit`,
                "files"
            );
        }

        const mimeType = rawMime || "application/octet-stream";
        if (!isAllowedMimeType(mimeType)) {
            throw new ValidationError("File type is not allowed", "files");
        }

        const expiryMinutes = Number.isFinite(expiryRaw)
            ? Math.min(Math.max(expiryRaw, 1), MAX_EXPIRY_MINUTES)
            : DEFAULT_EXPIRY_MINUTES;
        const maxDownloads = ALLOWED_MAX_DOWNLOADS.includes(maxDownloadsRaw as (typeof ALLOWED_MAX_DOWNLOADS)[number])
            ? maxDownloadsRaw
            : DEFAULT_MAX_DOWNLOADS;

        if (!r2Storage.isConfigured()) {
            throw new StorageError("Storage not configured");
        }

        const sanitizedName = sanitizeFilename(rawName) || "upload.bin";
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        const sessionExpiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_MINUTES * 60 * 1000);
        const passwordHash = password
            ? await withTiming(timings, "crypto", () => hashPassword(password))
            : null;

        let code = generateCode();
        let attempts = 0;
        let session: UploadSessionRecord | null = null;

        while (attempts < 10) {
            const randomSuffix = crypto.randomBytes(4).toString("hex");
            const key = `${code}-${randomSuffix}-${sanitizedName}`;
            const candidate: UploadSessionRecord = {
                code,
                storage_key: key,
                original_name: sanitizedName,
                size: rawSize,
                mime_type: mimeType,
                expires_at: expiresAt.toISOString(),
                max_downloads: maxDownloads,
                password_hash: passwordHash,
                session_expires_at: sessionExpiresAt.toISOString(),
            };

            const reserved = await withTiming(timings, "db", () => reserveUploadSession(candidate));
            if (reserved) {
                session = candidate;
                break;
            }

            code = generateCode();
            attempts += 1;
        }

        if (!session) {
            throw new StorageError("Failed to generate unique code");
        }

        const uploadUrl = await withTiming(timings, "r2", () =>
            r2Storage.getSignedUploadUrl(session.storage_key, mimeType)
        );

        logger.info("Upload session created", {
            requestId,
            code: session.code,
            size: rawSize,
            expiresAt: session.expires_at,
        });

        const headers = {
            ...NO_STORE_HEADERS,
            ...(Object.keys(timings).length > 0 ? { "Server-Timing": formatServerTiming(timings) } : {}),
        };

        return NextResponse.json(
            {
                code: session.code,
                uploadUrl,
                expiresAt: session.expires_at,
                storageType: "r2",
            },
            { headers }
        );
    } catch (error) {
        logger.exception("Upload init error", error, { requestId });
        const { error: errorMessage, statusCode } = formatErrorResponse(error);
        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode, headers: NO_STORE_HEADERS }
        );
    }
}
