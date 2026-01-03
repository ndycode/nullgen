import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AWS SDK
const mockS3Send = vi.fn();
vi.mock("@aws-sdk/client-s3", () => ({
    S3Client: vi.fn(() => ({
        send: mockS3Send,
    })),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
    getSignedUrl: vi.fn(() => Promise.resolve("https://signed-url.example.com")),
}));

// Mock logger
vi.mock("./logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        exception: vi.fn(),
    },
}));

// Store original env
const originalEnv = { ...process.env };

describe("R2 Storage Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        // Reset env
        process.env = { ...originalEnv };
    });

    describe("isConfigured", () => {
        it("returns false when R2 credentials are missing", async () => {
            delete process.env.R2_ACCOUNT_ID;
            delete process.env.R2_ACCESS_KEY_ID;
            delete process.env.R2_SECRET_ACCESS_KEY;
            delete process.env.R2_BUCKET_NAME;

            const { r2Storage } = await import("./r2");
            expect(r2Storage.isConfigured()).toBe(false);
        });

        it("returns true when all R2 credentials are set", async () => {
            process.env.R2_ACCOUNT_ID = "test-account";
            process.env.R2_ACCESS_KEY_ID = "test-key";
            process.env.R2_SECRET_ACCESS_KEY = "test-secret";
            process.env.R2_BUCKET_NAME = "test-bucket";

            const { r2Storage } = await import("./r2");
            expect(r2Storage.isConfigured()).toBe(true);
        });
    });

    describe("getSignedUploadUrl", () => {
        beforeEach(() => {
            process.env.R2_ACCOUNT_ID = "test-account";
            process.env.R2_ACCESS_KEY_ID = "test-key";
            process.env.R2_SECRET_ACCESS_KEY = "test-secret";
            process.env.R2_BUCKET_NAME = "test-bucket";
        });

        it("generates a signed URL", async () => {
            const { r2Storage } = await import("./r2");
            const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

            const url = await r2Storage.getSignedUploadUrl("test-key", "text/plain");

            expect(url).toBeDefined();
            expect(getSignedUrl).toHaveBeenCalled();
        });

        it("uses correct content type", async () => {
            const { r2Storage } = await import("./r2");
            const { PutObjectCommand } = await import("@aws-sdk/client-s3");

            await r2Storage.getSignedUploadUrl("test-key", "image/png");

            expect(PutObjectCommand).toHaveBeenCalledWith(
                expect.objectContaining({
                    ContentType: "image/png",
                })
            );
        });
    });

    describe("deleteFile", () => {
        beforeEach(() => {
            process.env.R2_ACCOUNT_ID = "test-account";
            process.env.R2_ACCESS_KEY_ID = "test-key";
            process.env.R2_SECRET_ACCESS_KEY = "test-secret";
            process.env.R2_BUCKET_NAME = "test-bucket";
        });

        it("returns success on successful deletion", async () => {
            mockS3Send.mockResolvedValue({});

            const { r2Storage } = await import("./r2");
            const result = await r2Storage.deleteFile("test-key");

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("returns error on failure", async () => {
            mockS3Send.mockRejectedValue(new Error("S3 error"));

            const { r2Storage } = await import("./r2");
            const result = await r2Storage.deleteFile("test-key");

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe("deleteFileOrThrow", () => {
        beforeEach(() => {
            process.env.R2_ACCOUNT_ID = "test-account";
            process.env.R2_ACCESS_KEY_ID = "test-key";
            process.env.R2_SECRET_ACCESS_KEY = "test-secret";
            process.env.R2_BUCKET_NAME = "test-bucket";
        });

        it("does not throw on success", async () => {
            mockS3Send.mockResolvedValue({});

            const { r2Storage } = await import("./r2");
            await expect(r2Storage.deleteFileOrThrow("test-key")).resolves.not.toThrow();
        });

        it("throws on failure", async () => {
            mockS3Send.mockRejectedValue(new Error("S3 error"));

            const { r2Storage } = await import("./r2");
            await expect(r2Storage.deleteFileOrThrow("test-key")).rejects.toThrow();
        });
    });

    describe("downloadStream", () => {
        beforeEach(() => {
            process.env.R2_ACCOUNT_ID = "test-account";
            process.env.R2_ACCESS_KEY_ID = "test-key";
            process.env.R2_SECRET_ACCESS_KEY = "test-secret";
            process.env.R2_BUCKET_NAME = "test-bucket";
        });

        it("returns a ReadableStream on success", async () => {
            const mockStream = new ReadableStream();
            mockS3Send.mockResolvedValue({
                Body: {
                    transformToWebStream: () => mockStream,
                },
            });

            const { r2Storage } = await import("./r2");
            const stream = await r2Storage.downloadStream("test-key");

            expect(stream).toBeInstanceOf(ReadableStream);
        });

        it("throws on not found", async () => {
            const error = new Error("NoSuchKey");
            (error as Error & { name: string }).name = "NoSuchKey";
            mockS3Send.mockRejectedValue(error);

            const { r2Storage } = await import("./r2");
            await expect(r2Storage.downloadStream("nonexistent")).rejects.toThrow();
        });
    });

    describe("uploadFile", () => {
        beforeEach(() => {
            process.env.R2_ACCOUNT_ID = "test-account";
            process.env.R2_ACCESS_KEY_ID = "test-key";
            process.env.R2_SECRET_ACCESS_KEY = "test-secret";
            process.env.R2_BUCKET_NAME = "test-bucket";
        });

        it("uploads file content", async () => {
            mockS3Send.mockResolvedValue({ ETag: '"test-etag"' });

            const { r2Storage } = await import("./r2");
            const etag = await r2Storage.uploadFile(
                Buffer.from("test content"),
                "test-key",
                "text/plain"
            );

            expect(etag).toBeDefined();
        });
    });
});
