import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { fileStore, FileMetadata } from "@/lib/file-store";

// Generate a 6-digit code
function generateCode(): string {
    let code: string;
    do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (fileStore.has(code));
    return code;
}

// Hash password
function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

// Clean up expired files
async function cleanupExpired() {
    const now = new Date();
    for (const [code, file] of fileStore.entries()) {
        if (file.expiresAt < now || (file.maxDownloads !== Infinity && file.downloadCount >= file.maxDownloads)) {
            try {
                if (file.storageType === "r2") {
                    await r2Storage.deleteFile(file.filename);
                }
            } catch (e) {
                console.error("Error deleting file:", e);
            }
            fileStore.delete(code);
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        // Clean up expired files first
        await cleanupExpired();

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

        // Generate unique code
        const code = generateCode();

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

        // Try R2 first (primary storage)
        let storageType: "local" | "r2" = "local";
        let storedFilename: string = "";

        if (r2Storage.isConfigured()) {
            try {
                console.log("Attempting R2 upload...");
                // Use code + random + filename to avoid collisions
                const randomSuffix = crypto.randomBytes(4).toString("hex");
                const key = `${code}-${randomSuffix}-${fileName}`;

                await r2Storage.uploadFile(buffer, key, mimeType);
                storedFilename = key;
                storageType = "r2";
                console.log(`File uploaded to R2: ${key}`);
            } catch (error) {
                console.error("R2 upload failed:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return NextResponse.json({
                    error: `Storage upload failed: ${errorMessage}`
                }, { status: 500 });
            }
        } else {
            console.log("R2 not configured, trying local storage...");
            // Fall back to local storage (only works in dev)
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({
                    error: "Storage not configured. Please contact admin."
                }, { status: 500 });
            }

            try {
                storedFilename = await saveLocally(buffer, fileName);
                storageType = "local";
                console.log(`File saved locally: ${storedFilename}`);
            } catch (error) {
                console.error("Local storage failed:", error);
                return NextResponse.json({
                    error: "No storage available."
                }, { status: 500 });
            }
        }

        // Store metadata
        const metadata: FileMetadata = {
            storageType,
            filename: storedFilename,
            originalName: fileName,
            size: totalSize,
            mimeType,
            expiresAt,
            maxDownloads: maxDownloads === -1 ? Infinity : maxDownloads,
            downloadCount: 0,
            password: password ? hashPassword(password) : null,
            downloaded: false,
        };

        fileStore.set(code, metadata);
        console.log(`File stored with code: ${code}, storage: ${storageType}`);

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

async function saveLocally(buffer: Buffer, originalName: string): Promise<string> {
    const ext = path.extname(originalName);
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;

    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    return filename;
}
