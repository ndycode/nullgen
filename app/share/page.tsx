"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import {
    ArrowLeft,
    CloudArrowUp,
    CloudArrowDown,
    CheckCircle,
    Copy,
    Link as LinkIcon,
    QrCode,
    X,
    Warning,
    File,
    Image,
    HardDrive,
    Timer,
    Lock,
    Check,
    FileArchive,
    ClockCounterClockwise,
    Trash,
    Eye,
    EyeSlash,
    GearSix,
} from "@phosphor-icons/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type UploadState = "idle" | "uploading" | "success" | "error";
type DownloadState = "idle" | "loading" | "ready" | "downloading" | "success" | "error";

interface FileInfo {
    name: string;
    size: number;
    expiresAt: string;
}

interface RecentTransfer {
    code: string;
    fileName: string;
    timestamp: number;
    expiresAt: number;
}

interface UploadOptions {
    expiryMinutes: number;
    maxDownloads: number;
    password: string;
    usePassword: boolean;
}

// Spring configurations
const springBouncy = { type: "spring" as const, stiffness: 400, damping: 17 };
const springGentle = { type: "spring" as const, stiffness: 300, damping: 25 };

// Expiry options
const expiryOptions = [
    { value: 15, label: "15m" },
    { value: 60, label: "1h" },
    { value: 1440, label: "24h" },
];

// Download limit options
const downloadOptions = [
    { value: 1, label: "1x" },
    { value: 3, label: "3x" },
    { value: -1, label: "∞" },
];

export default function SharePage() {
    // Upload state
    const [activeTab, setActiveTab] = useState("send");
    const [files, setFiles] = useState<File[]>([]);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [progress, setProgress] = useState(0);
    const [code, setCode] = useState<string>("");
    const [uploadError, setUploadError] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // For upload password input
    const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
        expiryMinutes: 60,
        maxDownloads: 1,
        password: "",
        usePassword: false,
    });

    // Download state
    const [downloadCode, setDownloadCode] = useState("");
    const [downloadState, setDownloadState] = useState<DownloadState>("idle");
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
    const [downloadError, setDownloadError] = useState("");
    const [downloadPassword, setDownloadPassword] = useState("");

    // Recent transfers
    const [recentTransfers, setRecentTransfers] = useState<RecentTransfer[]>([]);

    // File preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

    // Load recent transfers from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("nullgen_recent");
        if (stored) {
            const transfers: RecentTransfer[] = JSON.parse(stored);
            // Filter out expired transfers
            const valid = transfers.filter((t) => t.expiresAt > Date.now());
            setRecentTransfers(valid);
            localStorage.setItem("nullgen_recent", JSON.stringify(valid));
        }
    }, []);

    // Generate preview for images
    useEffect(() => {
        if (files.length === 1 && files[0].type.startsWith("image/")) {
            const url = URL.createObjectURL(files[0]);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [files]);

    // Play sound effect
    const playSound = (type: "success" | "error") => {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === "success") {
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        } else {
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        }

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };

    // Save to recent transfers
    const saveToRecent = (code: string, fileName: string, expiresAt: number) => {
        const transfer: RecentTransfer = {
            code,
            fileName,
            timestamp: Date.now(),
            expiresAt,
        };
        const updated = [transfer, ...recentTransfers.slice(0, 4)];
        setRecentTransfers(updated);
        localStorage.setItem("nullgen_recent", JSON.stringify(updated));
    };

    // ===== Upload Functions =====
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelect(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleFilesSelect = (selectedFiles: File[]) => {
        const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
        if (totalSize > MAX_FILE_SIZE) {
            setUploadError("Total file size exceeds 1 GB limit");
            return;
        }
        setFiles(selectedFiles);
        setUploadError("");
        setUploadState("idle");
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelect(Array.from(e.target.files));
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const uploadFile = async () => {
        if (files.length === 0) return;

        setUploadState("uploading");
        setProgress(0);
        setUploadError("");

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));
            formData.append("expiryMinutes", uploadOptions.expiryMinutes.toString());
            formData.append("maxDownloads", uploadOptions.maxDownloads.toString());
            if (uploadOptions.usePassword && uploadOptions.password) {
                formData.append("password", uploadOptions.password);
            }

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    setProgress(percent);
                }
            });

            const response = await new Promise<{ code: string; expiresAt: string }>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            reject(new Error(data.error || "Upload failed"));
                        } catch {
                            reject(new Error("Upload failed"));
                        }
                    }
                };
                xhr.onerror = () => reject(new Error("Upload failed"));
                xhr.open("POST", "/api/upload");
                xhr.send(formData);
            });

            setProgress(100);
            setCode(response.code);
            setUploadState("success");

            // Save to recent transfers
            const fileName = files.length === 1 ? files[0].name : `${files.length} files`;
            saveToRecent(response.code, fileName, new Date(response.expiresAt).getTime());

            playSound("success");
        } catch (err) {
            setUploadState("error");
            setUploadError(err instanceof Error ? err.message : "Upload failed");
            playSound("error");
        }
    };

    const copyCode = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyLink = async () => {
        const link = `${window.location.origin}/share?code=${code}`;
        await navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const resetUpload = () => {
        setFiles([]);
        setUploadState("idle");
        setProgress(0);
        setCode("");
        setUploadError("");
        setShowQR(false);
        setPreviewUrl(null);
    };

    // ===== Download Functions =====
    const formatTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();

        if (diff <= 0) return "Expired";

        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    const checkCode = async (codeToCheck?: string) => {
        const checkingCode = codeToCheck || downloadCode;
        if (checkingCode.length !== 6) return;

        setDownloadState("loading");
        setDownloadError("");

        try {
            const response = await fetch(`/api/download/${checkingCode}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "File not found");
            }

            const data = await response.json();
            setFileInfo(data);
            setDownloadState("ready");
            if (codeToCheck) setDownloadCode(codeToCheck);
        } catch (err) {
            setDownloadState("error");
            setDownloadError(err instanceof Error ? err.message : "Failed to find file");
        }
    };

    const downloadFile = async () => {
        if (!fileInfo) return;

        setDownloadState("downloading");

        try {
            const params = new URLSearchParams({ download: "true" });
            if (downloadPassword) params.append("password", downloadPassword);

            const response = await fetch(`/api/download/${downloadCode}?${params}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Download failed");
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
            playSound("success");
        } catch (err) {
            setDownloadState("error");
            setDownloadError(err instanceof Error ? err.message : "Download failed");
            playSound("error");
        }
    };

    const resetDownload = () => {
        setDownloadCode("");
        setDownloadState("idle");
        setFileInfo(null);
        setDownloadError("");
        setDownloadPassword("");
    };

    const clearRecentTransfers = () => {
        setRecentTransfers([]);
        localStorage.removeItem("nullgen_recent");
    };

    const getShareLink = () => `${typeof window !== "undefined" ? window.location.origin : ""}/share?code=${code}`;

    // Check for code in URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlCode = params.get("code");
        if (urlCode && urlCode.length === 6) {
            setActiveTab("receive");
            setDownloadCode(urlCode);
            checkCode(urlCode);
        }
    }, []);

    return (
        <main className="min-h-screen bg-background overflow-hidden relative flex flex-col items-center justify-center p-4">
            {/* Flickering Grid Background */}
            <FlickeringGrid
                className="absolute inset-0 z-0"
                squareSize={4}
                gridGap={6}
                color="rgb(16, 185, 129)"
                maxOpacity={0.08}
                flickerChance={0.05}
            />

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft weight="bold" className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">NullGen Share</h1>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>

                {/* Main Card */}
                <Card className="border bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-6 pt-6">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="send" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                    <CloudArrowUp className="w-4 h-4 mr-2" />
                                    Send
                                </TabsTrigger>
                                <TabsTrigger value="receive" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                    <CloudArrowDown className="w-4 h-4 mr-2" />
                                    Receive
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <CardContent className="p-6">
                            <TabsContent value="send" className="mt-0 space-y-4">
                                <AnimatePresence mode="wait">
                                    {uploadState === "success" ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center space-y-4"
                                        >
                                            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                                <CheckCircle weight="fill" className="w-8 h-8 text-primary" />
                                            </div>

                                            <div className="bg-muted/50 rounded-lg p-4 border border-dashed border-primary/20">
                                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Your Code</p>
                                                <div className="text-3xl font-mono font-bold tracking-[0.2em] text-primary">
                                                    {code}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <Button onClick={copyCode} variant="outline" className="gap-2">
                                                    {copied ? <Check weight="bold" /> : <Copy weight="bold" />}
                                                    {copied ? "Copied" : "Copy Code"}
                                                </Button>
                                                <Button onClick={copyLink} variant="outline" className="gap-2">
                                                    {copiedLink ? <Check weight="bold" /> : <LinkIcon weight="bold" />}
                                                    {copiedLink ? "Copied" : "Copy Link"}
                                                </Button>
                                            </div>

                                            <Button onClick={resetUpload} variant="ghost" className="w-full text-muted-foreground text-xs">
                                                Send another file
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="upload-form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-4"
                                        >
                                            <div
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                                className={`
                                                    relative border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center text-center transition-all duration-200
                                                    ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"}
                                                    ${files.length > 0 ? "border-primary/50 bg-primary/5" : ""}
                                                `}
                                            >
                                                <input
                                                    type="file"
                                                    onChange={handleFileInput}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    disabled={uploadState === "uploading"}
                                                    multiple
                                                />
                                                {files.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {previewUrl ? (
                                                            <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded mx-auto" />
                                                        ) : (
                                                            <FileArchive className="w-8 h-8 text-primary mx-auto" />
                                                        )}
                                                        <div className="px-4">
                                                            <p className="font-medium text-sm truncate max-w-[200px] mx-auto">
                                                                {files.length === 1 ? files[0].name : `${files.length} files`}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(files.reduce((a, f) => a + f.size, 0))}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <CloudArrowUp className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                                                        <p className="font-medium text-sm">Drop files here</p>
                                                        <p className="text-xs text-muted-foreground">Max 1 GB</p>
                                                    </div>
                                                )}

                                                {files.length > 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setFiles([]); }}
                                                        className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="w-full flex justify-between text-xs text-muted-foreground font-normal h-8">
                                                        <span>Options (Expiry, Limit, Password)</span>
                                                        <GearSix className={`w-3.5 h-3.5 transition-transform ${optionsOpen ? "rotate-90" : ""}`} />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="space-y-4 pt-2">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Expires In</label>
                                                            <div className="flex rounded-md shadow-sm">
                                                                {expiryOptions.map((opt, i) => (
                                                                    <button
                                                                        key={opt.value}
                                                                        onClick={() => setUploadOptions(prev => ({ ...prev, expiryMinutes: opt.value }))}
                                                                        className={`
                                                                            flex-1 text-xs py-1.5 first:rounded-l-md last:rounded-r-md border-y border-r first:border-l
                                                                            ${uploadOptions.expiryMinutes === opt.value
                                                                                ? "bg-primary text-primary-foreground border-primary z-10"
                                                                                : "bg-background border-input hover:bg-accent hover:text-accent-foreground"}
                                                                        `}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Limit</label>
                                                            <div className="flex rounded-md shadow-sm">
                                                                {downloadOptions.map((opt, i) => (
                                                                    <button
                                                                        key={opt.value}
                                                                        onClick={() => setUploadOptions(prev => ({ ...prev, maxDownloads: opt.value }))}
                                                                        className={`
                                                                            flex-1 text-xs py-1.5 first:rounded-l-md last:rounded-r-md border-y border-r first:border-l
                                                                            ${uploadOptions.maxDownloads === opt.value
                                                                                ? "bg-primary text-primary-foreground border-primary z-10"
                                                                                : "bg-background border-input hover:bg-accent hover:text-accent-foreground"}
                                                                        `}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Password Protection</label>
                                                            <Switch
                                                                checked={uploadOptions.usePassword}
                                                                onCheckedChange={(c) => setUploadOptions(prev => ({ ...prev, usePassword: c }))}
                                                                className="scale-75 origin-right"
                                                            />
                                                        </div>
                                                        {uploadOptions.usePassword && (
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="Enter password"
                                                                    value={uploadOptions.password}
                                                                    onChange={(e) => setUploadOptions(prev => ({ ...prev, password: e.target.value }))}
                                                                    className="h-8 text-xs pr-8"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                                >
                                                                    {showPassword ? (
                                                                        <EyeSlash weight="bold" className="w-3 h-3" />
                                                                    ) : (
                                                                        <Eye weight="bold" className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>

                                            {uploadError && (
                                                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center gap-2">
                                                    <Warning weight="fill" /> {uploadError}
                                                </div>
                                            )}

                                            {uploadState === "uploading" && (
                                                <div className="space-y-1">
                                                    <Progress value={progress} className="h-1" />
                                                    <p className="text-[10px] text-muted-foreground text-center">Uploading... {progress}%</p>
                                                </div>
                                            )}

                                            <Button
                                                onClick={uploadFile}
                                                disabled={files.length === 0 || uploadState === "uploading"}
                                                className="w-full gap-2"
                                            >
                                                {uploadState === "uploading" ? "Uploading..." : "Generate Link"}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </TabsContent>

                            <TabsContent value="receive" className="mt-0 space-y-6">
                                <AnimatePresence mode="wait">
                                    {(downloadState === "ready" || downloadState === "downloading" || downloadState === "success") && fileInfo ? (
                                        <motion.div
                                            key="ready"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                                <div className="flex items-start gap-4">
                                                    <div className="bg-background p-2 rounded-lg shadow-sm">
                                                        <File weight="duotone" className="w-8 h-8 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-medium text-sm truncate">{fileInfo.name}</h3>
                                                        <div className="flex gap-3 mt-1">
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <HardDrive weight="bold" /> {formatFileSize(fileInfo.size)}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Timer weight="bold" /> {formatTimeRemaining(fileInfo.expiresAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Password Input for Download */}
                                            {(fileInfo as any).requiresPassword && (
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Password Required</label>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter file password"
                                                        value={downloadPassword}
                                                        onChange={(e) => setDownloadPassword(e.target.value)}
                                                        className="h-9 text-sm"
                                                    />
                                                </div>
                                            )}

                                            <Button onClick={downloadFile} disabled={downloadState === "downloading"} className="w-full gap-2">
                                                <CloudArrowDown weight="bold" className="w-4 h-4" />
                                                {downloadState === "downloading" ? "Downloading..." : "Download File"}
                                            </Button>

                                            <Button onClick={resetDownload} variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                                                Looking for another file?
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="input-code"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-6 py-4"
                                        >
                                            <div className="text-center space-y-2">
                                                <p className="text-sm text-muted-foreground">Enter the 6-digit code to download.</p>
                                            </div>

                                            <div className="flex justify-center">
                                                <InputOTP value={downloadCode} onChange={(val) => {
                                                    setDownloadCode(val);
                                                    if (val.length === 6) checkCode(val);
                                                }} maxLength={6}>
                                                    <InputOTPGroup className="gap-2">
                                                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                                            <InputOTPSlot key={i} index={i} className="w-10 h-12 text-xl border rounded-md" />
                                                        ))}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </div>

                                            {downloadError && (
                                                <div className="text-center text-xs text-destructive">
                                                    {downloadError}
                                                </div>
                                            )}

                                            <Button
                                                onClick={() => checkCode()}
                                                disabled={downloadCode.length !== 6 || downloadState === "loading"}
                                                className="w-full"
                                                variant="secondary"
                                            >
                                                {downloadState === "loading" ? "Checking..." : "Find File"}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>

                {/* Compact Recent Files */}
                <AnimatePresence>
                    {recentTransfers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <div className="flex items-center justify-between mb-2 px-2">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Files</h3>
                                <button onClick={clearRecentTransfers} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">CLEAR</button>
                            </div>
                            <div className="space-y-2">
                                {recentTransfers.map((t) => (
                                    <div
                                        key={t.code}
                                        onClick={() => {
                                            navigator.clipboard.writeText(t.code);
                                        }}
                                        className="bg-background/40 hover:bg-background/60 backdrop-blur-sm border rounded-lg p-2.5 flex items-center gap-3 transition-colors cursor-pointer group"
                                    >
                                        <div className="bg-primary/10 text-primary p-1.5 rounded">
                                            <File className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <p className="text-xs font-medium truncate max-w-[150px]">{t.fileName}</p>
                                                <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded group-hover:bg-background transition-colors">
                                                    {t.code}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
