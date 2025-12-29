import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { logger } from "./logger";
import { StorageError } from "./errors";
import type { FileMetadata } from "@/types";
import type { ShareMetadata } from "./share-types";

/**
 * Cloudflare R2 Storage Service
 * Using AWS SDK v3 as R2 is S3-compatible
 */
class R2StorageService {
    private client: S3Client | null = null;
    private bucketName: string = "";

    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        this.bucketName = process.env.R2_BUCKET_NAME || "";

        if (accountId && accessKeyId && secretAccessKey) {
            this.client = new S3Client({
                region: "auto",
                endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
            logger.debug("R2 storage service initialized");
        } else {
            logger.warn("R2 credentials missing. Storage will not work.");
        }
    }

    /**
     * Check if storage is properly configured
     */
    isConfigured(): boolean {
        return this.client !== null && this.bucketName !== "";
    }

    /**
     * Upload a file to R2
     */
    async uploadFile(
        buffer: Buffer | string,
        key: string,
        mimeType: string
    ): Promise<string> {
        if (!this.client || !this.bucketName) {
            throw new StorageError("R2 storage not configured");
        }

        logger.debug("Uploading to R2", { key, mimeType, size: buffer.length });

        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: mimeType,
                })
            );

            return key;
        } catch (error) {
            logger.exception("R2 upload failed", error, { key });
            throw new StorageError(
                error instanceof Error ? error.message : "Upload failed"
            );
        }
    }

    /**
     * Download raw file content from R2
     */
    async downloadRaw(key: string): Promise<Buffer> {
        if (!this.client || !this.bucketName) {
            throw new StorageError("R2 storage not configured");
        }

        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                })
            );

            if (!response.Body) {
                throw new StorageError("File empty");
            }

            // Convert stream to buffer
            const byteArray = await response.Body.transformToByteArray();
            return Buffer.from(byteArray);
        } catch (error: unknown) {
            if (error instanceof Error && error.name === "NoSuchKey") {
                throw new StorageError("File not found", 404);
            }
            throw error;
        }
    }

    /**
     * Get file metadata (dead drop)
     */
    async getMetadata(code: string): Promise<FileMetadata | null> {
        try {
            const buffer = await this.downloadRaw(`${code}.metadata.json`);
            return JSON.parse(buffer.toString()) as FileMetadata;
        } catch {
            return null;
        }
    }

    /**
     * Save file metadata (dead drop)
     */
    async saveMetadata(code: string, metadata: FileMetadata): Promise<void> {
        await this.uploadFile(
            Buffer.from(JSON.stringify(metadata)),
            `${code}.metadata.json`,
            "application/json"
        );
    }

    /**
     * Delete a file from R2
     */
    async deleteFile(key: string): Promise<void> {
        if (!this.client || !this.bucketName) return;

        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                })
            );
            logger.debug("Deleted from R2", { key });
        } catch (error) {
            logger.exception("Failed to delete from R2", error, { key });
        }
    }

    /**
     * Get share metadata (prefixed with 'share-')
     */
    async getShareMetadata(code: string): Promise<ShareMetadata | null> {
        try {
            const buffer = await this.downloadRaw(`share-${code}.json`);
            return JSON.parse(buffer.toString()) as ShareMetadata;
        } catch {
            return null;
        }
    }

    /**
     * Save share metadata
     */
    async saveShareMetadata(code: string, metadata: ShareMetadata): Promise<void> {
        await this.uploadFile(
            Buffer.from(JSON.stringify(metadata)),
            `share-${code}.json`,
            "application/json"
        );
    }

    /**
     * Delete share metadata
     */
    async deleteShareMetadata(code: string): Promise<void> {
        await this.deleteFile(`share-${code}.json`);
    }
}

export const r2Storage = new R2StorageService();
