import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Cloudflare R2 Storage Service
// Using AWS SDK v3 as R2 is S3-compatible

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
        } else {
            console.warn("R2 credentials missing. Storage will not work.");
        }
    }

    isConfigured(): boolean {
        return this.client !== null && this.bucketName !== "";
    }

    async uploadFile(
        buffer: Buffer,
        key: string,
        mimeType: string
    ): Promise<string> {
        if (!this.client || !this.bucketName) {
            throw new Error("R2 storage not configured");
        }

        console.log(`Uploading to R2: ${key} (${buffer.length} bytes)`);

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            })
        );

        return key;
    }

    async downloadFile(key: string): Promise<Buffer> {
        if (!this.client || !this.bucketName) {
            throw new Error("R2 storage not configured");
        }

        const response = await this.client.send(
            new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            })
        );

        if (!response.Body) {
            throw new Error("File empty or not found");
        }

        // Convert stream to buffer
        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
    }

    async deleteFile(key: string): Promise<void> {
        if (!this.client || !this.bucketName) return;

        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                })
            );
        } catch (error) {
            console.error("Failed to delete from R2:", error);
        }
    }
}

export const r2Storage = new R2StorageService();
