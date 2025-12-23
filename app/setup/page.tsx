"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleLogo } from "@phosphor-icons/react";

export default function SetupPage() {
    const handleConnect = () => {
        const clientId = "862636331416-l5ei5rokgm1uikdaoqas6r4erkouphcb.apps.googleusercontent.com"; // User's Client ID
        // Dynamic redirect URI based on window location or hardcode
        const redirectUri = "https://nullgen-tau.vercel.app/api/auth/callback/google";

        // Scopes needed
        const scopes = [
            "https://www.googleapis.com/auth/drive.file"
        ];

        const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes.join(" "))}` +
            `&access_type=offline` +
            `&prompt=consent`; // FORCE consent to get refresh token

        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>NullGen Setup</CardTitle>
                    <CardDescription>
                        One-time setup to connect your Google Drive for public uploads.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleConnect} className="w-full gap-2">
                        <GoogleLogo className="w-5 h-5" />
                        Connect Google Drive
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        This will generate a Refresh Token. You must then add it to Vercel env vars.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
