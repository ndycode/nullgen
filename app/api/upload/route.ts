import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GoogleDriveOAuth } from "@/lib/google-drive-oauth";
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

// Clean up expired files (note: can't delete from user's drive without their token)
async function cleanupExpired() {
    const now = new Date();
    for (const [code, file] of fileStore.entries()) {
        if (file.expiresAt < now || (file.maxDownloads !== Infinity && file.downloadCount >= file.maxDownloads)) {
            fileStore.delete(code);
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        // Clean up expired files first
        await cleanupExpired();

        // Get the user's session with access token
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json({
                error: "Not authenticated. Please sign in with Google first."
            }, { status: 401 });
        }

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

        // Upload to user's Google Drive using OAuth
        const driveClient = new GoogleDriveOAuth(session.accessToken);

        let storedFilename: string;
        let storageType: "local" | "gdrive" = "gdrive";

        try {
            console.log("Uploading to user's Google Drive via OAuth...");
            const result = await driveClient.uploadFile(buffer, `NullGen_${code}_${fileName}`, mimeType);
            storedFilename = result.fileId;
            console.log(`File uploaded to Google Drive: ${result.fileId}`);
        } catch (error) {
            console.error("Google Drive OAuth upload failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Upload failed";
            return NextResponse.json({
                error: `Google Drive upload failed: ${errorMessage}`
            }, { status: 500 });
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
        console.log(`File stored with code: ${code}`);

        return NextResponse.json({
            code,
            expiresAt: expiresAt.toISOString(),
            storageType: "gdrive",
        });
    } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
