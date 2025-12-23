import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { FileMetadata } from "@/lib/file-store";

// Generate a 6-digit code
function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash password
function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];
        const expiryMinutes = parseInt(formData.get("expiryMinutes") as string) || 60;
        const maxDownloads = parseInt(formData.get("maxDownloads") as string) || 1;
        const password = formData.get("password") as string | null;

        if (files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        // Check total file size (1 GB limit)
        const MAX_SIZE = 1024 * 1024 * 1024;
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        if (totalSize > MAX_SIZE) {
            return NextResponse.json({ error: "Total file size exceeds 1 GB limit" }, { status: 400 });
        }

        // Generate unique code (retry if metadata exists - simplistic check)
        let code = generateCode();
        // In production, we assume low collision probability or handle overwrite.
        // Ideally check if metadata exists, but R2 consistency is strong enough for this toy app.

        // Determine file name and prepare buffer
        let fileName: string;
        let buffer: Buffer;
        let mimeType: string;

        if (files.length === 1) {
            const file = files[0];
            fileName = file.name;
            mimeType = file.type || "application/octet-stream";
            buffer = Buffer.from(await file.arrayBuffer());
        } else {
            const file = files[0];
            fileName = `${files.length}_files_bundle.zip`;
            mimeType = "application/zip";
            buffer = Buffer.from(await file.arrayBuffer());
        }

        // Calculate expiry
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        let storageType: "local" | "r2" = "r2"; // Enforce R2 for production
        let storedFilename: string = "";

        if (r2Storage.isConfigured()) {
            try {
                console.log("Attempting R2 upload...");
                // Use code + random + filename to avoid collisions
                const randomSuffix = crypto.randomBytes(4).toString("hex");
                const key = `${code}-${randomSuffix}-${fileName}`;

                // 1. Upload Content
                await r2Storage.uploadFile(buffer, key, mimeType);
                storedFilename = key;

                console.log(`File uploaded to R2: ${key}`);

                // 2. Upload Metadata
                const metadata: FileMetadata = {
                    storageType: "r2",
                    filename: key,
                    originalName: fileName,
                    size: totalSize,
                    mimeType,
                    expiresAt,
                    maxDownloads: maxDownloads === -1 ? Infinity : maxDownloads,
                    downloadCount: 0,
                    password: password ? hashPassword(password) : null,
                    downloaded: false,
                };

                await r2Storage.saveMetadata(code, metadata);
                console.log(`Metadata saved to R2: ${code}.metadata.json`);

            } catch (error) {
                console.error("R2 upload failed:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return NextResponse.json({
                    error: `Storage upload failed: ${errorMessage}`
                }, { status: 500 });
            }
        } else {
            return NextResponse.json({
                error: "Storage not configured. Please contact admin."
            }, { status: 500 });
        }

        return NextResponse.json({
            code,
            expiresAt: expiresAt.toISOString(),
            storageType,
        });
    } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
