"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { AlertBanner } from "@/components/ui/alert-banner";
import { DecorativeBackground } from "@/components/decorative-background";
import {
    ArrowLeft,
    Download,
    File,
    CheckCircle,
    Timer,
    HardDrive,
    Info,
    Warning,
} from "@phosphor-icons/react";
import { CODE_LENGTH } from "@/lib/constants";
import { formatFileSize, formatTimeRemaining } from "@/lib/format";

type DownloadState = "idle" | "loading" | "ready" | "downloading" | "success" | "error";

interface FileInfo {
    name: string;
    size: number;
    expiresAt: string;
    requiresPassword: boolean;
    downloadsRemaining?: number | string;
}

// Map backend error messages to user-friendly copy
function mapErrorToUserMessage(error: string): string {
    const errorMap: Record<string, string> = {
        "File not found or expired": "We couldn't find that file. It may have expired or the code is incorrect.",
        "File has expired": "This file has expired and is no longer available.",
        "Download limit reached": "This file has already been downloaded and is no longer available.",
        "Password required": "This file requires a password to download.",
        "Incorrect password": "The password you entered is incorrect.",
        "Download failed": "The download failed. Please try again.",
        "Downloads are temporarily disabled": "Downloads are temporarily unavailable. Please try again later.",
    };
    // Return mapped message or a generic fallback for unknown errors
    return errorMap[error] || "Something went wrong. Please try again.";
}

export default function DownloadClient() {
    const searchParams = useSearchParams();
    const [code, setCode] = useState("");
    const [downloadState, setDownloadState] = useState<DownloadState>("idle");
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");

    // formatFileSize and formatTimeRemaining are now imported from @/lib/format

    const checkCode = async (codeToCheck?: string) => {
        const codeValue = codeToCheck ?? code;
        if (codeValue.length !== CODE_LENGTH) return;

        setDownloadState("loading");
        setError("");
        setPassword("");

        try {
            const response = await fetch(`/api/download/${codeValue}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "File not found");
            }

            const data = await response.json();
            setFileInfo(data);
            setDownloadState("ready");
        } catch (err) {
            setDownloadState("error");
            const message = err instanceof Error ? err.message : "Failed to find file";
            setError(mapErrorToUserMessage(message));
        }
    };

    useEffect(() => {
        const queryCode = searchParams.get("code");
        if (queryCode && queryCode.length === CODE_LENGTH) {
            setCode(queryCode);
            checkCode(queryCode);
        }
    }, [searchParams]);

    const downloadFile = async () => {
        if (!fileInfo) return;

        setDownloadState("downloading");

        try {
            if (fileInfo.requiresPassword && !password) {
                throw new Error("Password required");
            }

            const response = await fetch(`/api/download/${code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: fileInfo.requiresPassword ? password : undefined,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Download failed");
            }

            if (!data.downloadUrl) {
                throw new Error("Download failed");
            }

            const link = document.createElement("a");
            link.href = data.downloadUrl as string;
            link.download = fileInfo.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setDownloadState("success");
        } catch (err) {
            setDownloadState("error");
            const message = err instanceof Error ? err.message : "Download failed";
            setError(mapErrorToUserMessage(message));
        }
    };

    const resetDownload = () => {
        setCode("");
        setDownloadState("idle");
        setFileInfo(null);
        setError("");
        setPassword("");
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-background via-background to-primary/5">
            <DecorativeBackground />

            <div className="relative z-10 w-full max-w-sm">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 mb-4">
                            <ArrowLeft weight="bold" className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Download File</h1>
                    <p className="text-muted-foreground mt-2">
                        Enter the {CODE_LENGTH}-digit code to download your file
                    </p>
                </div>

                {/* Download Card */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download weight="duotone" className="w-6 h-6 text-primary" />
                            Enter Code
                        </CardTitle>
                        <CardDescription>
                            Enter the {CODE_LENGTH}-digit code shared with you
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {downloadState === "success" ? (
                            /* Success State */
                            <div className="text-center space-y-6 py-8">
                                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                    <CheckCircle weight="fill" className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Download Complete!</h3>
                                    <p className="text-muted-foreground">
                                        Your file has been downloaded successfully
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <Button variant="outline" onClick={resetDownload} className="flex-1">
                                        Download Another
                                    </Button>
                                    <Link href="/" className="flex-1">
                                        <Button variant="ghost" className="w-full">
                                            Go Home
                                        </Button>
                                    </Link>
                                </div>

                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                                    <Info weight="fill" className="w-4 h-4" />
                                    This file has been deleted from our servers
                                </p>
                            </div>
                        ) : (downloadState === "ready" || downloadState === "downloading") && fileInfo ? (
                            /* Ready to Download State */
                            <div className="space-y-6">
                                <div className="bg-muted rounded-2xl p-6 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <File weight="duotone" className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{fileInfo.name}</p>
                                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <HardDrive weight="bold" className="w-4 h-4" />
                                                    {formatFileSize(fileInfo.size)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Timer weight="bold" className="w-4 h-4" />
                                                    Expires in {formatTimeRemaining(fileInfo.expiresAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {fileInfo.requiresPassword && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            Password required
                                        </p>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="h-10"
                                        />
                                    </div>
                                )}

                                <Button
                                    onClick={downloadFile}
                                    disabled={downloadState === "downloading" || (fileInfo.requiresPassword && !password)}
                                    size="lg"
                                    className="w-full gap-2"
                                >
                                    <Download weight="bold" className="w-5 h-5" />
                                    {downloadState === "downloading" ? "Downloading..." : "Download File"}
                                </Button>

                                <Button variant="ghost" onClick={resetDownload} className="w-full">
                                    Use Different Code
                                </Button>

                                <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1.5">
                                    <Warning weight="fill" className="w-4 h-4" />
                                    This file can only be downloaded once
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Code Input */}
                                <div className="flex flex-col items-center space-y-6 py-4">
                                    <InputOTP
                                        value={code}
                                        onChange={setCode}
                                        maxLength={CODE_LENGTH}
                                        disabled={downloadState === "loading"}
                                    >
                                        <InputOTPGroup>
                                            {Array.from({ length: CODE_LENGTH }, (_, i) => (
                                                <InputOTPSlot key={i} index={i} className="w-11 h-14 sm:w-14 sm:h-16 text-xl sm:text-2xl" />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>

                                    <p className="text-sm text-muted-foreground">
                                        Enter the {CODE_LENGTH}-digit code to access your file
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && <AlertBanner>{error}</AlertBanner>}

                                {/* Check Code Button */}
                                <Button
                                    onClick={() => checkCode()}
                                    disabled={code.length !== CODE_LENGTH || downloadState === "loading"}
                                    size="lg"
                                    className="w-full gap-2"
                                >
                                    <Download weight="bold" className="w-5 h-5" />
                                    {downloadState === "loading" ? "Checking..." : "Find File"}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
