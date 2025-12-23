import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { del } from "@vercel/blob";
import { googleDriveStorage } from "@/lib/google-drive";
import { fileStore } from "@/lib/file-store";

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

        console.log(`Looking for code: ${code}, fileStore size: ${fileStore.size}`);

        const fileInfo = fileStore.get(code);

        if (!fileInfo) {
            console.log(`File not found for code: ${code}`);
            return NextResponse.json({ error: "File not found or expired" }, { status: 404 });
        }

        // Check if expired
        if (new Date() > fileInfo.expiresAt) {
            // Clean up
            try {
                if (fileInfo.storageType === "gdrive") {
                    await googleDriveStorage.deleteFile(fileInfo.filename);
                } else if (fileInfo.storageType === "blob") {
                    await del(fileInfo.filename);
                }
            } catch (e) {
                console.error("Error deleting expired file:", e);
            }
            fileStore.delete(code);
            return NextResponse.json({ error: "File has expired" }, { status: 410 });
        }

        // Check download limit
        if (fileInfo.maxDownloads !== Infinity && fileInfo.downloadCount >= fileInfo.maxDownloads) {
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

        if (fileInfo.storageType === "gdrive") {
            // Download from Google Drive
            try {
                fileBuffer = await googleDriveStorage.downloadFile(fileInfo.filename);
            } catch (error) {
                console.error("Google Drive download error:", error);
                return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
            }
        } else if (fileInfo.storageType === "blob") {
            // Download from Vercel Blob
            try {
                const response = await fetch(fileInfo.filename);
                if (!response.ok) throw new Error("Blob fetch failed");
                fileBuffer = Buffer.from(await response.arrayBuffer());
            } catch (error) {
                console.error("Vercel Blob download error:", error);
                return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
            }
        } else {
            // Read from local storage
            const uploadsDir = path.join(process.cwd(), "uploads");
            const filePath = path.join(uploadsDir, fileInfo.filename);

            try {
                fileBuffer = await readFile(filePath);
            } catch {
                return NextResponse.json({ error: "File not found on server" }, { status: 404 });
            }
        }

        // Increment download count
        fileInfo.downloadCount++;

        // Check if we should delete the file
        const shouldDelete = fileInfo.maxDownloads !== Infinity &&
            fileInfo.downloadCount >= fileInfo.maxDownloads;

        if (shouldDelete) {
            // Schedule deletion
            setTimeout(async () => {
                try {
                    if (fileInfo.storageType === "gdrive") {
                        await googleDriveStorage.deleteFile(fileInfo.filename);
                    } else if (fileInfo.storageType === "blob") {
                        await del(fileInfo.filename);
                    } else {
                        const uploadsDir = path.join(process.cwd(), "uploads");
                        const filePath = path.join(uploadsDir, fileInfo.filename);
                        await unlink(filePath);
                    }
                    fileStore.delete(code);
                } catch (e) {
                    console.error("Error deleting file:", e);
                }
            }, 1000);
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
