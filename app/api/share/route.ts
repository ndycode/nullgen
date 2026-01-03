import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { CreateShareRequest, ShareType } from "@/lib/share-types";
import {
    SHARE_CODE_LENGTH,
    MAX_SHARE_TEXT_SIZE,
    MAX_SHARE_IMAGE_BYTES,
    MAX_SHARE_EXPIRY_MINUTES,
} from "@/lib/constants";
import { hashPassword } from "@/lib/passwords";
import { createShareContent, createShareRecord, deleteShareContent } from "@/lib/db";
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

// Generate an alphanumeric code
function generateCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.randomBytes(SHARE_CODE_LENGTH);
    let code = "";
    for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
        code += chars[bytes[i] % chars.length];
    }
    return code;
}

function isValidUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
    if (!dataUrl.startsWith("data:")) return null;
    const match = /^data:([^;]+);base64,(.*)$/i.exec(dataUrl);
    if (!match) return null;
    return { mimeType: match[1], data: match[2] };
}

/**
 * Calculate the actual byte length of base64-encoded data.
 * Decodes a small sample to validate format, then calculates length.
 * Returns 0 for invalid base64 to fail validation safely.
 */
function base64ByteLength(base64: string): number {
    if (!base64) return 0;

    // Try to decode to verify it's valid base64 and get accurate size
    try {
        const buffer = Buffer.from(base64, "base64");
        return buffer.length;
    } catch {
        // If decoding fails, return 0 to fail size validation
        return 0;
    }
}

export async function POST(request: NextRequest) {
    const timings: Record<string, number> = {};
    try {
        const body: CreateShareRequest | null = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return jsonResponse({ error: "Invalid request body" }, { status: 400 });
        }
        const {
            type,
            content,
            expiryMinutes = 60,
            password,
            burnAfterReading,
            language,
            originalName,
            mimeType,
        } = body;

        if (typeof content !== "string" || typeof type !== "string") {
            return jsonResponse({ error: "Content and type required" }, { status: 400 });
        }

        const normalizedContent = type === "image" ? content : content.trim();
        const normalizedPassword = typeof password === "string" && password.trim()
            ? password.trim()
            : null;
        const normalizedBurn = Boolean(burnAfterReading);

        if (!normalizedContent || !type) {
            return jsonResponse({ error: "Content and type required" }, { status: 400 });
        }

        const validTypes: ShareType[] = ["link", "paste", "image", "note", "code", "json", "csv"];
        if (!validTypes.includes(type)) {
            return jsonResponse({ error: "Invalid share type" }, { status: 400 });
        }

        if (type === "link" && !isValidUrl(normalizedContent)) {
            return jsonResponse({ error: "Invalid URL" }, { status: 400 });
        }

        if (type === "json") {
            try {
                JSON.parse(normalizedContent);
            } catch {
                return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
            }
        }

        if (type !== "image" && normalizedContent.length > MAX_SHARE_TEXT_SIZE) {
            return jsonResponse({ error: "Content too large (max 1MB)" }, { status: 400 });
        }

        let imageSize = 0;
        let imageMimeType = mimeType;
        if (type === "image") {
            const parsed = parseDataUrl(content);
            if (!parsed) {
                return jsonResponse({ error: "Invalid image data" }, { status: 400 });
            }
            if (!parsed.mimeType.startsWith("image/")) {
                return jsonResponse({ error: "Invalid image type" }, { status: 400 });
            }
            imageSize = base64ByteLength(parsed.data);
            if (imageSize > MAX_SHARE_IMAGE_BYTES) {
                return jsonResponse({ error: "Image too large (max 5MB)" }, { status: 400 });
            }
            imageMimeType = parsed.mimeType;
        }

        const parsedExpiry = Number.isFinite(Number(expiryMinutes))
            ? Number(expiryMinutes)
            : 60;
        const safeExpiryMinutes = Math.min(Math.max(parsedExpiry, 1), MAX_SHARE_EXPIRY_MINUTES);
        const expiresAt = new Date(Date.now() + safeExpiryMinutes * 60 * 1000);
        const passwordHash = normalizedPassword
            ? await withTiming(timings, "crypto", () => hashPassword(normalizedPassword))
            : null;

        const contentRecord = await withTiming(timings, "db", () =>
            createShareContent(normalizedContent)
        );

        let code = generateCode();
        let attempts = 0;
        let reserved = false;

        while (attempts < 10) {
            const candidate = await withTiming(timings, "db", () =>
                createShareRecord({
                    code,
                    type,
                    content_id: contentRecord.id,
                    original_name: originalName ?? null,
                    mime_type: imageMimeType ?? null,
                    size: imageSize ? imageSize : null,
                    language: language ?? null,
                    expires_at: expiresAt.toISOString(),
                    password_hash: passwordHash,
                    burn_after_reading: normalizedBurn,
                    view_count: 0,
                    burned: false,
                })
            );

            if (candidate) {
                reserved = true;
                break;
            }

            code = generateCode();
            attempts += 1;
        }

        if (!reserved) {
            await withTiming(timings, "db", () => deleteShareContent(contentRecord.id));
            return jsonResponse({ error: "Failed to generate unique code" }, { status: 500 }, timings);
        }

        const baseUrl = request.nextUrl.origin;
        const url = `${baseUrl}/s/${code}`;

        return jsonResponse({
            code,
            url,
            expiresAt: expiresAt.toISOString(),
        }, undefined, timings);
    } catch (error) {
        console.error("Share creation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create share";
        return jsonResponse({ error: errorMessage }, { status: 500 }, timings);
    }
}
