import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put, del } from "@vercel/blob";
import { googleDriveStorage } from "@/lib/google-drive";
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
            // Delete from storage
            try {
                if (file.storageType === "gdrive") {
                    await googleDriveStorage.deleteFile(file.filename);
                } else if (file.storageType === "blob") {
                    await del(file.filename);
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

        // Try storage options in order: Google Drive -> Vercel Blob -> Local
        let storageType: "local" | "gdrive" | "blob" = "local";
        let storedFilename: string = "";

        // Try Google Drive first
        if (googleDriveStorage.isConfigured()) {
            try {
                const result = await googleDriveStorage.uploadFile(buffer, `${code}_${fileName}`, mimeType);
                storedFilename = result.fileId;
                storageType = "gdrive";
                console.log(`File uploaded to Google Drive: ${result.fileId}`);
            } catch (error) {
                console.error("Google Drive upload failed:", error);
            }
        }

        // Try Vercel Blob if Google Drive failed
        if (!storedFilename && process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                const blob = await put(`${code}_${fileName}`, buffer, {
                    access: "public",
                    contentType: mimeType,
                });
                storedFilename = blob.url;
                storageType = "blob";
                console.log(`File uploaded to Vercel Blob: ${blob.url}`);
            } catch (error) {
                console.error("Vercel Blob upload failed:", error);
            }
        }

        // Fall back to local storage (only works in dev)
        if (!storedFilename) {
            try {
                storedFilename = await saveLocally(buffer, fileName);
                storageType = "local";
                console.log(`File saved locally: ${storedFilename}`);
            } catch (error) {
                console.error("Local storage failed:", error);
                return NextResponse.json({ error: "No storage available" }, { status: 500 });
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
        console.log(`File stored with code: ${code}, storage: ${storageType}, total in store: ${fileStore.size}`);

        return NextResponse.json({
            code,
            expiresAt: expiresAt.toISOString(),
            storageType,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
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
