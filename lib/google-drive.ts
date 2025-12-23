import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// Google Drive Service Account configuration
// IMPORTANT: Service accounts have ZERO storage quota.
// Files MUST be uploaded to a folder owned by a real user account.

class GoogleDriveStorage {
    private drive: drive_v3.Drive | null = null;
    private folderId: string = "";
    private initialized: boolean = false;
    private initPromise: Promise<void> | null = null;

    async ensureInitialized(): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.initialize();
        await this.initPromise;
    }

    private async initialize(): Promise<void> {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (privateKey) {
            // Handle both escaped \n and actual newlines
            privateKey = privateKey.replace(/\\n/g, "\n");
        }
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.log("Google Drive init check:", {
            hasClientEmail: !!clientEmail,
            hasPrivateKey: !!privateKey,
            hasFolderId: !!folderId,
            folderId
        });

        if (!clientEmail || !privateKey || !folderId) {
            console.warn("Google Drive credentials not configured:", {
                clientEmail: clientEmail ? "set" : "missing",
                privateKey: privateKey ? "set" : "missing",
                folderId: folderId ? "set" : "missing",
            });
            this.initialized = true;
            return;
        }

        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                },
                scopes: ["https://www.googleapis.com/auth/drive"],
            });

            this.drive = google.drive({ version: "v3", auth });
            this.folderId = folderId;
            this.initialized = true;
            console.log("Google Drive initialized successfully");
        } catch (error) {
            console.error("Google Drive initialization failed:", error);
            this.initialized = true;
        }
    }

    isConfigured(): boolean {
        return this.drive !== null && this.folderId !== "";
    }

    async uploadFile(
        buffer: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<{ fileId: string; webViewLink: string }> {
        await this.ensureInitialized();

        if (!this.drive) {
            throw new Error("Google Drive not configured");
        }

        if (!this.folderId) {
            throw new Error("Google Drive folder ID not configured - files must be uploaded to a user-owned folder");
        }

        console.log(`Uploading file: ${fileName} (${buffer.length} bytes) to folder: ${this.folderId}`);

        // Convert buffer to readable stream
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload to the user's folder (REQUIRED - service accounts have zero storage quota)
        const response = await this.drive.files.create({
            requestBody: {
                name: fileName,
                parents: [this.folderId], // MUST specify parent folder
            },
            media: {
                mimeType,
                body: stream,
            },
            fields: "id, webViewLink",
            supportsAllDrives: true,
        });

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
        await this.ensureInitialized();

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
        await this.ensureInitialized();

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
