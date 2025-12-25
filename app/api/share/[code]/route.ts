import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { ShareMetadata } from "@/lib/share-types";

function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const password = request.nextUrl.searchParams.get("password");

        if (!r2Storage.isConfigured()) {
            return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
        }

        const metadata: ShareMetadata | null = await r2Storage.getShareMetadata(code);

        if (!metadata) {
            return NextResponse.json({ error: "Share not found" }, { status: 404 });
        }

        // Check if expired
        if (new Date(metadata.expiresAt) < new Date()) {
            await r2Storage.deleteShareMetadata(code);
            return NextResponse.json({ error: "Share has expired" }, { status: 410 });
        }

        // Check if burned
        if (metadata.burned) {
            return NextResponse.json({ error: "This share has been destroyed" }, { status: 410 });
        }

        // Check password
        if (metadata.password) {
            if (!password) {
                return NextResponse.json({
                    error: "Password required",
                    requiresPassword: true,
                    type: metadata.type,
                    burnAfterReading: metadata.burnAfterReading,
                }, { status: 401 });
            }
            if (hashPassword(password) !== metadata.password) {
                return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
            }
        }

        // Increment view count
        metadata.viewCount++;

        // Handle burn after reading
        if (metadata.burnAfterReading) {
            metadata.burned = true;
        }

        // Save updated metadata
        await r2Storage.saveShareMetadata(code, metadata);

        return NextResponse.json({
            type: metadata.type,
            content: metadata.content,
            language: metadata.language,
            originalName: metadata.originalName,
            mimeType: metadata.mimeType,
            expiresAt: metadata.expiresAt,
            burnAfterReading: metadata.burnAfterReading,
            burned: metadata.burned,
            requiresPassword: !!metadata.password,
        });
    } catch (error) {
        console.error("Share retrieval error:", error);
        return NextResponse.json({ error: "Failed to retrieve share" }, { status: 500 });
    }
}
