import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Readable } from "stream";

// Google Drive - Server-Side OAuth Strategy
// Authenticates as the ADMIN (you) using a Refresh Token.
// Allows PUBLIC uploads without users needing to sign in.

class GoogleDriveService {
    private oauth2Client: OAuth2Client;
    private drive: any;
    private folderId: string;
    private initialized: boolean = false;

    constructor() {
        // Initialize config from environment variables
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

        if (!clientId || !clientSecret || !refreshToken) {
            console.warn("Google Drive: Missing OAuth credentials (CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN)");
            // We'll throw errors later if methods are called without config
        }

        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

        if (refreshToken) {
            this.oauth2Client.setCredentials({
                refresh_token: refreshToken
            });
        }

        this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
    }

    isConfigured(): boolean {
        const hasCreds = !!process.env.GOOGLE_CLIENT_ID &&
            !!process.env.GOOGLE_CLIENT_SECRET &&
            !!process.env.GOOGLE_REFRESH_TOKEN;
        // Attempt to refresh credentials to verify? No, too expensive. 
        // Just check if vars exist.
        return hasCreds;
    }

    async uploadFile(
        buffer: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<{ fileId: string; webViewLink: string }> {
        if (!this.isConfigured()) {
            throw new Error("Google Drive not configured on server. Check Vercel env vars.");
        }

        // Check if folder ID is set (optional but recommended for organization)
        if (!this.folderId) {
            console.warn("Google Drive: No folder ID configured. Uploading to root.");
        }

        console.log(`Uploading file (Public): ${fileName} (${buffer.length} bytes) to folder: ${this.folderId || 'root'}`);

        // Convert buffer to readable stream
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        try {
            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: this.folderId ? [this.folderId] : undefined,
                },
                media: {
                    mimeType,
                    body: stream,
                },
                fields: "id, webViewLink",
            });

            if (!response.data.id) {
                throw new Error("Failed to upload file to Google Drive");
            }

            console.log(`File uploaded successfully: ${response.data.id}`);

            // Make file accessible via link (Public Read)
            // This ensures the person with the link can view it if needed
            try {
                await this.drive.permissions.create({
                    fileId: response.data.id,
                    requestBody: {
                        role: "reader",
                        type: "anyone",
                    },
                });
            } catch (permError) {
                console.warn("Could not set public permissions:", permError);
            }

            return {
                fileId: response.data.id,
                webViewLink: response.data.webViewLink || "",
            };
        } catch (error: any) {
            // Handle common OAuth errors
            if (error.response?.data?.error === "invalid_grant") {
                console.error("Critical: Google Refresh Token is invalid or expired. Please generate a new one.");
                throw new Error("Server authentication failed (Invalid Token). Contact admin.");
            }
            throw error;
        }
    }

    async downloadFile(fileId: string): Promise<Buffer> {
        if (!this.isConfigured()) {
            throw new Error("Google Drive not configured");
        }

        const response = await this.drive.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
        );

        return Buffer.from(response.data as ArrayBuffer);
    }

    async deleteFile(fileId: string): Promise<void> {
        if (!this.isConfigured()) return;

        try {
            await this.drive.files.delete({ fileId });
        } catch (error) {
            console.error("Failed to delete file from Google Drive:", error);
        }
    }
}

// Singleton export
export const googleDriveStorage = new GoogleDriveService();
