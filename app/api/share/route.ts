import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { ShareMetadata, CreateShareRequest, ShareType } from "@/lib/share-types";

// Generate a 6-character alphanumeric code
function generateCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Hash password
function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateShareRequest = await request.json();
        const {
            type,
            content,
            expiryMinutes = 60,
            password,
            burnAfterReading = false,
            language,
            originalName,
            mimeType
        } = body;

        if (!content || !type) {
            return NextResponse.json({ error: "Content and type required" }, { status: 400 });
        }

        // Validate type
        const validTypes: ShareType[] = ['link', 'paste', 'image', 'note', 'code', 'json', 'csv'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: "Invalid share type" }, { status: 400 });
        }

        // For links, validate URL
        if (type === 'link') {
            try {
                new URL(content);
            } catch {
                return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
            }
        }

        // For JSON, validate
        if (type === 'json') {
            try {
                JSON.parse(content);
            } catch {
                return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
            }
        }

        // Check content size (max 1MB for text content)
        if (type !== 'image' && content.length > 1024 * 1024) {
            return NextResponse.json({ error: "Content too large (max 1MB)" }, { status: 400 });
        }

        if (!r2Storage.isConfigured()) {
            return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
        }

        // Generate unique code
        let code = generateCode();
        let attempts = 0;
        while (await r2Storage.getShareMetadata(code) && attempts < 10) {
            code = generateCode();
            attempts++;
        }

        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        const metadata: ShareMetadata = {
            type,
            content,
            originalName,
            mimeType,
            language,
            expiresAt,
            password: password ? hashPassword(password) : null,
            burnAfterReading,
            viewCount: 0,
            burned: false,
            createdAt: new Date(),
        };

        await r2Storage.saveShareMetadata(code, metadata);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vxid.cc';
        const url = type === 'link' ? `${baseUrl}/s/${code}` : `${baseUrl}/s/${code}`;

        return NextResponse.json({
            code,
            url,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("Share creation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create share";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
