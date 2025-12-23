import { google } from "googleapis";
import { Readable } from "stream";

// Google Drive OAuth-based storage
// Uses the user's own Google Drive with OAuth tokens

export class GoogleDriveOAuth {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private getDrive() {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: this.accessToken });
        return google.drive({ version: "v3", auth });
    }

    async uploadFile(
        buffer: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<{ fileId: string; webViewLink: string }> {
        const drive = this.getDrive();

        console.log(`OAuth: Uploading file: ${fileName} (${buffer.length} bytes)`);

        // Convert buffer to readable stream
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload to user's Drive root (or we can create a NullGen folder)
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
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

        console.log(`OAuth: File uploaded successfully: ${response.data.id}`);

        // Make file accessible via link
        try {
            await drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: "reader",
                    type: "anyone",
                },
            });
        } catch (permError) {
            console.warn("OAuth: Could not set public permissions:", permError);
        }

        return {
            fileId: response.data.id,
            webViewLink: response.data.webViewLink || "",
        };
    }

    async downloadFile(fileId: string): Promise<Buffer> {
        const drive = this.getDrive();

        const response = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
        );

        return Buffer.from(response.data as ArrayBuffer);
    }

    async deleteFile(fileId: string): Promise<void> {
        const drive = this.getDrive();

        try {
            await drive.files.delete({ fileId });
        } catch (error) {
            console.error("OAuth: Failed to delete file:", error);
        }
    }
}
