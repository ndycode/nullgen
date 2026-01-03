import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { StorageError, ValidationError, formatErrorResponse } from "@/lib/errors";
import { r2Storage } from "@/lib/r2";
import { finalizeUploadAtomic } from "@/lib/db";
import { formatServerTiming, withTiming } from "@/lib/timing";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, private" };

export async function POST(request: NextRequest) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timings: Record<string, number> = {};

    try {
        const body = await request.json().catch(() => ({}));
        const code = typeof body.code === "string" ? body.code : "";

        if (!code) {
            throw new ValidationError("Upload code required", "code");
        }

        if (!r2Storage.isConfigured()) {
            throw new StorageError("Storage not configured");
        }

        // Atomic finalization: moves session to file_metadata in single transaction
        // Prevents orphaned sessions or duplicate files on crash/retry
        const record = await withTiming(timings, "db", () => finalizeUploadAtomic(code));

        if (!record) {
            // Session not found, expired, or already finalized
            return NextResponse.json(
                { error: "Upload session expired or already finalized" },
                { status: 410, headers: NO_STORE_HEADERS }
            );
        }

        logger.info("Upload finalized", { requestId, code: record.code });

        const headers = {
            ...NO_STORE_HEADERS,
            ...(Object.keys(timings).length > 0 ? { "Server-Timing": formatServerTiming(timings) } : {}),
        };

        return NextResponse.json(
            {
                code: record.code,
                expiresAt: record.expires_at,
                storageType: "r2",
            },
            { headers }
        );
    } catch (error) {
        logger.exception("Upload finalize error", error, { requestId });
        const { error: errorMessage, statusCode } = formatErrorResponse(error);
        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode, headers: NO_STORE_HEADERS }
        );
    }
}
