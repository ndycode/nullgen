import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { FileMetadata } from "@/lib/file-store";

// Hash password for comparison
function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const { searchParams } = new URL(request.url);
        const isDownload = searchParams.get("download") === "true";
        const providedPassword = searchParams.get("password");

        console.log(`Looking for metadata for code: ${code}`);

        // Fetch metadata from R2
        let fileInfo: FileMetadata | null = null;

        if (r2Storage.isConfigured()) {
            fileInfo = await r2Storage.getMetadata(code);
        }

        if (!fileInfo) {
            console.log(`Metadata not found on R2 for code: ${code}`);
            return NextResponse.json({ error: "File not found or expired" }, { status: 404 });
        }

        // Convert date string back to Date object if needed
        fileInfo.expiresAt = new Date(fileInfo.expiresAt);

        // Check if expired
        if (new Date() > fileInfo.expiresAt) {
            // Clean up
            try {
                await r2Storage.deleteFile(fileInfo.filename);
                await r2Storage.deleteFile(`${code}.metadata.json`);
            } catch (e) {
                console.error("Error deleting expired file:", e);
            }
            return NextResponse.json({ error: "File has expired" }, { status: 410 });
        }

        // Check download limit
        if (fileInfo.maxDownloads !== Infinity && fileInfo.downloadCount >= fileInfo.maxDownloads) {
            // Should have been deleted but if not, delete now
            try {
                await r2Storage.deleteFile(fileInfo.filename);
                await r2Storage.deleteFile(`${code}.metadata.json`);
            } catch (e) { console.error(e); }
            return NextResponse.json({ error: "Download limit reached" }, { status: 410 });
        }

        if (!isDownload) {
            // Just return file info (for preview)
            return NextResponse.json({
                name: fileInfo.originalName,
                size: fileInfo.size,
                expiresAt: fileInfo.expiresAt.toISOString(),
                requiresPassword: fileInfo.password !== null,
                downloadsRemaining: fileInfo.maxDownloads === Infinity
                    ? "unlimited"
                    : fileInfo.maxDownloads - fileInfo.downloadCount,
            });
        }

        // Verify password if required
        if (fileInfo.password) {
            if (!providedPassword) {
                return NextResponse.json({ error: "Password required" }, { status: 401 });
            }
            if (hashPassword(providedPassword) !== fileInfo.password) {
                return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
            }
        }

        // Get file content
        let fileBuffer: Buffer;

        try {
            fileBuffer = await r2Storage.downloadRaw(fileInfo.filename);
        } catch (error) {
            console.error("R2 download error:", error);
            return NextResponse.json({ error: "Failed to retrieve file content" }, { status: 500 });
        }

        // Increment download count and update metadata
        fileInfo.downloadCount++;
        const shouldDelete = fileInfo.maxDownloads !== Infinity &&
            fileInfo.downloadCount >= fileInfo.maxDownloads;

        if (shouldDelete) {
            // Delete immediately
            try {
                await r2Storage.deleteFile(fileInfo.filename);
                await r2Storage.deleteFile(`${code}.metadata.json`);
            } catch (e) {
                console.error("Error deleting file:", e);
            }
        } else {
            // Update metadata
            await r2Storage.saveMetadata(code, fileInfo);
        }

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                "Content-Type": fileInfo.mimeType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${encodeURIComponent(fileInfo.originalName)}"`,
                "Content-Length": fileInfo.size.toString(),
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }
}
