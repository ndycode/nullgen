import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// Google Drive Service Account configuration

class GoogleDriveStorage {
    private drive: drive_v3.Drive | null = null;
    private folderId: string = "";

    async initialize(): Promise<void> {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        // Handle both escaped \n (from .env files) and actual newlines (from Vercel)
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (privateKey) {
            privateKey = privateKey.replace(/\\n/g, "\n");
        }
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!clientEmail || !privateKey || !folderId) {
            console.warn("Google Drive credentials not configured. Using local storage fallback.");
            return;
        }

        console.log("Initializing Google Drive with:", { clientEmail, folderId });

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ["https://www.googleapis.com/auth/drive"],
        });

        this.drive = google.drive({ version: "v3", auth });
        this.folderId = folderId;
        console.log("Google Drive initialized successfully");
    }

    isConfigured(): boolean {
        return this.drive !== null;
    }

    async uploadFile(
        buffer: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<{ fileId: string; webViewLink: string }> {
        if (!this.drive) {
            throw new Error("Google Drive not configured");
        }

        console.log(`Uploading file: ${fileName} (${buffer.length} bytes)`);

        // Convert buffer to readable stream
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Try uploading - first with parent folder, then without if it fails
        let response;
        try {
            response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    ...(this.folderId ? { parents: [this.folderId] } : {}),
                },
                media: {
                    mimeType,
                    body: stream,
                },
                fields: "id, webViewLink",
                supportsAllDrives: true,
            });
        } catch (error: unknown) {
            console.error("Upload with folder failed, trying without folder:", error);
            // Retry without parent folder
            const stream2 = new Readable();
            stream2.push(buffer);
            stream2.push(null);

            response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                },
                media: {
                    mimeType,
                    body: stream2,
                },
                fields: "id, webViewLink",
            });
        }

        if (!response.data.id) {
            throw new Error("Failed to upload file to Google Drive");
        }

        console.log(`File uploaded successfully: ${response.data.id}`);

        // Make file accessible via link
        try {
            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: "reader",
                    type: "anyone",
                },
                supportsAllDrives: true,
            });
        } catch (permError) {
            console.warn("Could not set public permissions:", permError);
        }

        return {
            fileId: response.data.id,
            webViewLink: response.data.webViewLink || "",
        };
    }

    async downloadFile(fileId: string): Promise<Buffer> {
        if (!this.drive) {
            throw new Error("Google Drive not configured");
        }

        const response = await this.drive.files.get(
            { fileId, alt: "media", supportsAllDrives: true },
            { responseType: "arraybuffer" }
        );

        return Buffer.from(response.data as ArrayBuffer);
    }

    async deleteFile(fileId: string): Promise<void> {
        if (!this.drive) {
            throw new Error("Google Drive not configured");
        }

        try {
            await this.drive.files.delete({ fileId, supportsAllDrives: true });
        } catch (error) {
            console.error("Failed to delete file from Google Drive:", error);
        }
    }
}

// Singleton instance
export const googleDriveStorage = new GoogleDriveStorage();

// Initialize on module load
googleDriveStorage.initialize().catch(console.error);
