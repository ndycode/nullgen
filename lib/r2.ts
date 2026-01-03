import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { logger } from "./logger";
import { StorageError } from "./errors";
import type { FileMetadata } from "@/types";
import type { ShareMetadata } from "./share-types";

/**
 * Result of a delete operation
 */
export interface DeleteResult {
    success: boolean;
    error?: string;
}

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
        body: Buffer | string | Uint8Array | ReadableStream,
        key: string,
        mimeType: string,
        options: { ifMatch?: string; size?: number } = {}
    ): Promise<string> {
        if (!this.client || !this.bucketName) {
            throw new StorageError("R2 storage not configured");
        }

        const size = typeof options.size === "number"
            ? options.size
            : Buffer.isBuffer(body)
                ? body.length
                : undefined;
        logger.debug("Uploading to R2", { key, mimeType, size });

        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                    Body: body,
                    ContentType: mimeType,
                    ...(options.ifMatch ? { IfMatch: options.ifMatch } : {}),
                })
            );

            return key;
        } catch (error) {
            if (this.isConditionalError(error)) {
                throw new StorageError("Conditional write failed", 409);
            }
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
            if (this.isNotFoundError(error)) {
                throw new StorageError("File not found", 404);
            }
            throw new StorageError(
                error instanceof Error ? error.message : "Download failed"
            );
        }
    }

    /**
     * Generate a signed upload URL for direct client uploads
     */
    async getSignedUploadUrl(
        key: string,
        mimeType: string,
        expiresInSeconds = 300
    ): Promise<string> {
        if (!this.client || !this.bucketName) {
            throw new StorageError("R2 storage not configured");
        }

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: mimeType,
            });

            return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
        } catch (error) {
            logger.exception("Failed to sign upload URL", error, { key });
            throw new StorageError("Failed to generate upload URL");
        }
    }

    /**
     * Download a file as a stream from R2
     */
    async downloadStream(key: string): Promise<ReadableStream> {
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

            if (typeof response.Body.transformToWebStream === "function") {
                return response.Body.transformToWebStream() as unknown as ReadableStream;
            }

            return Readable.toWeb(response.Body as unknown as Readable) as unknown as ReadableStream;
        } catch (error: unknown) {
            if (this.isNotFoundError(error)) {
                throw new StorageError("File not found", 404);
            }
            throw new StorageError(
                error instanceof Error ? error.message : "Download failed"
            );
        }
    }

    private async getJsonObject<T>(key: string): Promise<{ data: T; etag: string }> {
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

            const byteArray = await response.Body.transformToByteArray();
            const etag = response.ETag;
            if (!etag) {
                throw new StorageError("Missing ETag", 500);
            }

            return {
                data: JSON.parse(Buffer.from(byteArray).toString()) as T,
                etag,
            };
        } catch (error: unknown) {
            if (this.isNotFoundError(error)) {
                throw new StorageError("File not found", 404);
            }
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                error instanceof Error ? error.message : "Download failed"
            );
        }
    }

    /**
     * Get file metadata (dead drop)
     */
    async getMetadata(code: string): Promise<FileMetadata | null> {
        try {
            const result = await this.getJsonObject<FileMetadata>(`${code}.metadata.json`);
            return result.data;
        } catch (error) {
            if (error instanceof StorageError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async getMetadataWithEtag(
        code: string
    ): Promise<{ metadata: FileMetadata; etag: string } | null> {
        try {
            const result = await this.getJsonObject<FileMetadata>(`${code}.metadata.json`);
            return { metadata: result.data, etag: result.etag };
        } catch (error) {
            if (error instanceof StorageError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Save file metadata (dead drop)
     */
    async saveMetadata(
        code: string,
        metadata: FileMetadata,
        options: { ifMatch?: string } = {}
    ): Promise<void> {
        await this.uploadFile(
            Buffer.from(JSON.stringify(metadata)),
            `${code}.metadata.json`,
            "application/json",
            options
        );
    }

    /**
     * Delete a file from R2.
     * IMPORTANT: Returns a result object - callers MUST check success.
     * Does NOT throw on failure to allow graceful degradation.
     */
    async deleteFile(key: string): Promise<DeleteResult> {
        if (!this.client || !this.bucketName) {
            return { success: false, error: "R2 storage not configured" };
        }

        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                })
            );
            logger.debug("Deleted from R2", { key });
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            logger.exception("Failed to delete from R2", error, { key });
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Delete a file from R2, throwing on failure.
     * Use when deletion failure should abort the operation.
     */
    async deleteFileOrThrow(key: string): Promise<void> {
        const result = await this.deleteFile(key);
        if (!result.success) {
            throw new StorageError(`Failed to delete file: ${result.error}`);
        }
    }

    /**
     * Get share metadata (prefixed with 'share-')
     */
    async getShareMetadata(code: string): Promise<ShareMetadata | null> {
        try {
            const result = await this.getJsonObject<ShareMetadata>(`share-${code}.json`);
            return result.data;
        } catch (error) {
            if (error instanceof StorageError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async getShareMetadataWithEtag(
        code: string
    ): Promise<{ metadata: ShareMetadata; etag: string } | null> {
        try {
            const result = await this.getJsonObject<ShareMetadata>(`share-${code}.json`);
            return { metadata: result.data, etag: result.etag };
        } catch (error) {
            if (error instanceof StorageError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Save share metadata
     */
    async saveShareMetadata(
        code: string,
        metadata: ShareMetadata,
        options: { ifMatch?: string } = {}
    ): Promise<void> {
        await this.uploadFile(
            Buffer.from(JSON.stringify(metadata)),
            `share-${code}.json`,
            "application/json",
            options
        );
    }

    /**
     * Delete share metadata
     */
    async deleteShareMetadata(code: string): Promise<DeleteResult> {
        return this.deleteFile(`share-${code}.json`);
    }

    private isNotFoundError(error: unknown): boolean {
        if (error instanceof StorageError) {
            return error.statusCode === 404;
        }
        if (error && typeof error === "object") {
            const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
            if (err.name === "NoSuchKey" || err.name === "NotFound") {
                return true;
            }
            if (err.$metadata?.httpStatusCode === 404) {
                return true;
            }
        }
        return false;
    }

    private isConditionalError(error: unknown): boolean {
        if (error && typeof error === "object") {
            const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
            if (err.name === "PreconditionFailed" || err.name === "ConditionalRequestConflict") {
                return true;
            }
            if (err.$metadata?.httpStatusCode === 409 || err.$metadata?.httpStatusCode === 412) {
                return true;
            }
        }
        return false;
    }
}

export const r2Storage = new R2StorageService();
