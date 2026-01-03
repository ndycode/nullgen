import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import crypto from "crypto";
import {
    getShareWithContentByCode,
    updateShareViewCount,
    type ShareWithContentRecord,
} from "@/lib/db";
import { ValidationError, formatErrorResponse } from "@/lib/errors";
import { verifyPassword } from "@/lib/passwords";
import { SHARE_CODE_LENGTH, isValidShareCode } from "@/lib/constants";
import { formatServerTiming, withTiming } from "@/lib/timing";
import { logger } from "@/lib/logger";

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

function normalizeShare(record: ShareWithContentRecord) {
    return {
        type: record.type,
        content: record.content?.content || "",
        originalName: record.original_name || undefined,
        mimeType: record.mime_type || undefined,
        size: record.size || undefined,
        language: record.language || undefined,
        expiresAt: record.expires_at,
        passwordHash: record.password_hash,
        burnAfterReading: record.burn_after_reading,
        viewCount: record.view_count,
        burned: record.burned,
        createdAt: record.created_at,
    };
}

async function processShare(
    code: string,
    providedPassword: string | null,
    timings: Record<string, number>
): Promise<ReturnType<typeof normalizeShare> | Response> {
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
        const record = await withTiming(timings, "db", () => getShareWithContentByCode(code));
        if (!record) {
            return jsonResponse({ error: "Share not found" }, { status: 404 }, timings);
        }

        const normalized = normalizeShare(record);
        const expiresAt = new Date(normalized.expiresAt);

        if (new Date(expiresAt) < new Date()) {
            return jsonResponse({ error: "Share has expired" }, { status: 410 }, timings);
        }

        if (normalized.burned) {
            return jsonResponse(
                { error: "This share has been destroyed" },
                { status: 410 },
                timings
            );
        }

        if (normalized.passwordHash) {
            if (!providedPassword) {
                return jsonResponse(
                    {
                        error: "Password required",
                        requiresPassword: true,
                        type: normalized.type,
                        burnAfterReading: normalized.burnAfterReading,
                    },
                    { status: 401 },
                    timings
                );
            }
            const storedHash = normalized.passwordHash;
            const passwordValid = await withTiming(timings, "crypto", () =>
                verifyPassword(providedPassword, storedHash)
            );
            if (!passwordValid) {
                return jsonResponse({ error: "Incorrect password" }, { status: 403 }, timings);
            }
        }

        const updated = await withTiming(timings, "db", () =>
            updateShareViewCount(record.id, normalized.viewCount, normalized.burnAfterReading)
        );
        if (updated) {
            return {
                ...normalized,
                viewCount: updated.view_count,
                burned: updated.burned,
            };
        }

        attempt += 1;
    }

    return jsonResponse({ error: "Share busy, retry" }, { status: 409 }, timings);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timings: Record<string, number> = {};
    try {
        const { code } = await params;
        const normalizedCode = code?.toLowerCase() || "";
        if (!isValidShareCode(normalizedCode)) {
            throw new ValidationError("Invalid share code", "code");
        }

        const result = await processShare(normalizedCode, null, timings);
        if (result instanceof Response) {
            return result;
        }

        return jsonResponse(
            {
                type: result.type,
                content: result.content,
                language: result.language,
                originalName: result.originalName,
                mimeType: result.mimeType,
                expiresAt: result.expiresAt,
                burnAfterReading: result.burnAfterReading,
                burned: result.burned,
                requiresPassword: !!result.passwordHash,
            },
            undefined,
            timings
        );
    } catch (error) {
        logger.exception("Share retrieval error", error, { requestId });
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
    try {
        const { code } = await params;
        const normalizedCode = code?.toLowerCase() || "";
        if (!isValidShareCode(normalizedCode)) {
            throw new ValidationError("Invalid share code", "code");
        }

        const body = await request.json().catch(() => ({}));
        const providedPassword = typeof body.password === "string" ? body.password : null;

        const result = await processShare(normalizedCode, providedPassword, timings);
        if (result instanceof Response) {
            return result;
        }

        return jsonResponse(
            {
                type: result.type,
                content: result.content,
                language: result.language,
                originalName: result.originalName,
                mimeType: result.mimeType,
                expiresAt: result.expiresAt,
                burnAfterReading: result.burnAfterReading,
                burned: result.burned,
                requiresPassword: !!result.passwordHash,
            },
            undefined,
            timings
        );
    } catch (error) {
        logger.exception("Share retrieval error", error, { requestId });
        const { error: errorMessage, statusCode } = formatErrorResponse(error);
        return jsonResponse({ error: errorMessage }, { status: statusCode }, timings);
    }
}
