"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
    ArrowLeft,
    Download,
    File,
    Warning,
    CheckCircle,
    Timer,
    HardDrive,
} from "@phosphor-icons/react";

type DownloadState = "idle" | "loading" | "ready" | "downloading" | "success" | "error";

interface FileInfo {
    name: string;
    size: number;
    expiresAt: string;
}

export default function DownloadPage() {
    const [code, setCode] = useState("");
    const [downloadState, setDownloadState] = useState<DownloadState>("idle");
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
    const [error, setError] = useState("");

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();

        if (diff <= 0) return "Expired";

        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes} minutes`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    const checkCode = async () => {
        if (code.length !== 6) return;

        setDownloadState("loading");
        setError("");

        try {
            const response = await fetch(`/api/download/${code}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "File not found");
            }

            const data = await response.json();
            setFileInfo(data);
            setDownloadState("ready");
        } catch (err) {
            setDownloadState("error");
            setError(err instanceof Error ? err.message : "Failed to find file");
        }
    };

    const downloadFile = async () => {
        if (!fileInfo) return;

        setDownloadState("downloading");

        try {
            const response = await fetch(`/api/download/${code}?download=true`);

            if (!response.ok) {
                throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileInfo.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            setDownloadState("success");
        } catch (err) {
            setDownloadState("error");
            setError(err instanceof Error ? err.message : "Download failed");
        }
    };

    const resetDownload = () => {
        setCode("");
        setDownloadState("idle");
        setFileInfo(null);
        setError("");
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Decorative background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
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
                        Enter the 6-digit code to download your file
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
                            Enter the 6-digit code shared with you
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

                                <p className="text-sm text-muted-foreground">
                                    ℹ️ This file has been deleted from our servers
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

                                <Button
                                    onClick={downloadFile}
                                    disabled={downloadState === "downloading"}
                                    size="lg"
                                    className="w-full gap-2"
                                >
                                    <Download weight="bold" className="w-5 h-5" />
                                    {downloadState === "downloading" ? "Downloading..." : "Download File"}
                                </Button>

                                <Button variant="ghost" onClick={resetDownload} className="w-full">
                                    Use Different Code
                                </Button>

                                <p className="text-sm text-muted-foreground text-center">
                                    ⚠️ This file can only be downloaded once
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Code Input */}
                                <div className="flex flex-col items-center space-y-6 py-4">
                                    <InputOTP
                                        value={code}
                                        onChange={setCode}
                                        maxLength={6}
                                        disabled={downloadState === "loading"}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} className="w-14 h-16 text-2xl" />
                                            <InputOTPSlot index={1} className="w-14 h-16 text-2xl" />
                                            <InputOTPSlot index={2} className="w-14 h-16 text-2xl" />
                                            <InputOTPSlot index={3} className="w-14 h-16 text-2xl" />
                                            <InputOTPSlot index={4} className="w-14 h-16 text-2xl" />
                                            <InputOTPSlot index={5} className="w-14 h-16 text-2xl" />
                                        </InputOTPGroup>
                                    </InputOTP>

                                    <p className="text-sm text-muted-foreground">
                                        Enter the 6-digit code to access your file
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                                        <Warning weight="fill" className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Check Code Button */}
                                <Button
                                    onClick={checkCode}
                                    disabled={code.length !== 6 || downloadState === "loading"}
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
