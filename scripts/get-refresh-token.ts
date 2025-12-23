import { OAuth2Client } from "google-auth-library";
import http from "http";
import url from "url";
import { exec } from "child_process";

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3000/api/auth/callback/google";

if (CLIENT_ID === "YOUR_CLIENT_ID") {
    console.error("Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local");
    process.exit(1);
}

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function main() {
    const server = http.createServer(async (req, res) => {
        try {
            if (req.url!.startsWith("/api/auth/callback/google")) {
                const qs = new url.URL(req.url!, "http://localhost:3000").searchParams;
                const code = qs.get("code");

                console.log(`Code received: ${code}`);
                res.end("Authentication successful! You can close this window and check your terminal.");

                if (code) {
                    const { tokens } = await client.getToken(code);
                    console.log("\n!!! SUCCESS !!!\n");
                    console.log("Here is your REFRESH TOKEN (Save this!):");
                    console.log("-----------------------------------------");
                    console.log(tokens.refresh_token);
                    console.log("-----------------------------------------\n");
                    console.log("Now add this as GOOGLE_REFRESH_TOKEN in Vercel!");
                    server.close();
                    process.exit(0);
                }
            }
        } catch (e) {
            console.error(e);
            res.end("Error during authentication");
        }
    });

    server.listen(3001, () => {
        // Generate auth URL
        const authorizeUrl = client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/drive.file"],
            prompt: "consent", // Force refresh token generation
        });

        console.log("Opening browser for authentication...");
        console.log(`URL: ${authorizeUrl}`);

        // Open browser
        const startCmd = process.platform == "win32" ? "start" : "open";
        exec(`${startCmd} "${authorizeUrl}"`);
    });
}

main().catch(console.error);
