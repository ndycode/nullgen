import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.json({ error: "Authorization failed", details: error });
    }

    if (!code) {
        return NextResponse.json({ error: "No code provided" });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            // Must match exactly what was configured in Google Cloud Console
            `${process.env.NEXT_PUBLIC_APP_URL || "https://nullgen-tau.vercel.app"}/api/auth/callback/google`
        );

        const { tokens } = await oauth2Client.getToken(code);

        return new NextResponse(
            `<html>
        <head>
          <title>Google Drive Connected</title>
          <style>
              body { font-family: sans-serif; background: #111; color: #eee; display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; }
              .box { background: #222; padding: 2rem; border-radius: 8px; border: 1px solid #333; max-width: 600px; width: 90%; }
              code { display: block; background: #000; padding: 1rem; border: 1px solid #333; border-radius: 4px; overflow-x: auto; margin: 1rem 0; color: #4ade80; }
              h1 { color: #fff; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>✅ Refresh Token Generated</h1>
            <p>Copy the token below and add it to your Vercel Environment Variables as <strong>GOOGLE_REFRESH_TOKEN</strong>.</p>
            <code>${tokens.refresh_token}</code>
            <p>After adding it, redeploy your project!</p>
          </div>
        </body>
      </html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    } catch (error: any) {
        console.error("Token exchange failed:", error);
        return NextResponse.json({ error: "Failed to exchange token", details: error.message });
    }
}
