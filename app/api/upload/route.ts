import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { r2Storage } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { ValidationError, StorageError, formatErrorResponse } from "@/lib/errors";
import { MAX_UPLOAD_SIZE, CODE_LENGTH, DEFAULT_EXPIRY_MINUTES, DEFAULT_MAX_DOWNLOADS } from "@/lib/constants";
import type { FileMetadata } from "@/types";

// Generate a 6-digit code
function generateCode(): string {
    const min = Math.pow(10, CODE_LENGTH - 1);
    const max = Math.pow(10, CODE_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

// Hash password using SHA-256
function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[/\\]/g, "_") // Replace slashes
        .replace(/\.\./g, "_") // Prevent path traversal
        .replace(/[<>:"|?*]/g, "_") // Remove invalid chars
        .slice(0, 255); // Limit length
}

export async function POST(request: NextRequest) {
    const requestId = crypto.randomUUID().slice(0, 8);

    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];
        const expiryMinutes = parseInt(formData.get("expiryMinutes") as string) || DEFAULT_EXPIRY_MINUTES;
        const maxDownloads = parseInt(formData.get("maxDownloads") as string) || DEFAULT_MAX_DOWNLOADS;
        const password = formData.get("password") as string | null;

        // Validation
        if (files.length === 0) {
            throw new ValidationError("No files provided", "files");
        }

        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        if (totalSize > MAX_UPLOAD_SIZE) {
            throw new ValidationError(
                `Total file size exceeds ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)} MB limit`,
                "files"
            );
        }

        // Check storage availability
        if (!r2Storage.isConfigured()) {
            throw new StorageError("Storage not configured");
        }

        // Generate unique code
        const code = generateCode();

        // Determine file name and prepare buffer
        let fileName: string;
        let buffer: Buffer;
        let mimeType: string;

        if (files.length === 1) {
            const file = files[0];
            fileName = sanitizeFilename(file.name);
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

        logger.info("Starting file upload", {
            requestId,
            fileCount: files.length,
            totalSize,
            expiryMinutes,
        });

        try {
            // Use code + random + filename to avoid collisions
            const randomSuffix = crypto.randomBytes(4).toString("hex");
            const key = `${code}-${randomSuffix}-${fileName}`;

            // 1. Upload Content
            await r2Storage.uploadFile(buffer, key, mimeType);

            logger.debug("File uploaded to R2", { requestId, key });

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

            logger.info("Upload complete", { requestId, code });

            return NextResponse.json({
                code,
                expiresAt: expiresAt.toISOString(),
                storageType: "r2",
            });
        } catch (error) {
            logger.exception("R2 upload failed", error, { requestId });
            throw new StorageError(
                error instanceof Error ? error.message : "Upload failed"
            );
        }
    } catch (error) {
        logger.exception("Upload error", error, { requestId });
        const { error: errorMessage, statusCode } = formatErrorResponse(error);
        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}
