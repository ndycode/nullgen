"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import {
    ArrowLeft,
    CloudArrowUp,
    CloudArrowDown,
    Copy,
    Check,
    File,
    X,
    Warning,
    CheckCircle,
    Timer,
    HardDrive,
    QrCode,
    Link as LinkIcon,
    Clock,
    Lock,
    Image,
    FileArchive,
    ClockCounterClockwise,
    Trash,
} from "@phosphor-icons/react";

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
const springSnappy = { type: "spring" as const, stiffness: 500, damping: 30 };

// Expiry options
const expiryOptions = [
    { value: 15, label: "15 min" },
    { value: 60, label: "1 hour" },
    { value: 1440, label: "24 hours" },
];

// Download limit options
const downloadOptions = [
    { value: 1, label: "1 download" },
    { value: 3, label: "3 downloads" },
    { value: -1, label: "Unlimited" },
];

export default function SharePage() {
    // Upload state
    const [files, setFiles] = useState<File[]>([]);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [progress, setProgress] = useState(0);
    const [code, setCode] = useState<string>("");
    const [uploadError, setUploadError] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showQR, setShowQR] = useState(false);
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

    // Fire confetti on success
    const fireConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10b981", "#34d399", "#6ee7b7"],
        });
    };

    // Play sound effect
    const playSound = (type: "success" | "error") => {
        // Using Web Audio API for simple sounds
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

            // Real progress tracking with XMLHttpRequest
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

            // Celebration!
            fireConfetti();
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
        if (minutes < 60) return `${minutes} minutes`;
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
            setDownloadCode(urlCode);
            checkCode(urlCode);
        }
    }, []);

    return (
        <main className="min-h-screen bg-background overflow-hidden relative">
            {/* Flickering Grid Background */}
            <FlickeringGrid
                className="absolute inset-0 z-0"
                squareSize={4}
                gridGap={6}
                color="rgb(16, 185, 129)"
                maxOpacity={0.08}
                flickerChance={0.05}
            />

            <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
                {/* Header */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springGentle}
                >
                    <Link href="/">
                        <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }} transition={springSnappy}>
                            <Button variant="ghost" size="sm" className="gap-2 mb-3">
                                <ArrowLeft weight="bold" className="w-4 h-4" />
                                Back
                            </Button>
                        </motion.div>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Share File</h1>
                    <p className="text-base text-muted-foreground mt-2">
                        Send or receive files with a 6-digit code
                    </p>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Send & Receive */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ===== SEND SECTION ===== */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...springBouncy, delay: 0.1 }}
                        >
                            <Card className="border flex flex-col h-full bg-background/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <motion.div
                                            animate={{ rotate: [0, -10, 10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                        >
                                            <CloudArrowUp weight="duotone" className="w-5 h-5 text-primary" />
                                        </motion.div>
                                        Send
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Upload files • Max 1 GB total
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <AnimatePresence mode="wait">
                                        {uploadState === "success" ? (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={springBouncy}
                                                className="flex-1 flex flex-col justify-center text-center space-y-3"
                                            >
                                                <motion.div
                                                    className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ ...springBouncy, delay: 0.2 }}
                                                >
                                                    <CheckCircle weight="fill" className="w-6 h-6 text-primary" />
                                                </motion.div>

                                                {/* QR Code Toggle */}
                                                <AnimatePresence mode="wait">
                                                    {showQR ? (
                                                        <motion.div
                                                            key="qr"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                            className="bg-white p-3 rounded-lg mx-auto"
                                                        >
                                                            <QRCodeSVG value={getShareLink()} size={120} />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="code"
                                                            className="bg-muted rounded-lg p-3"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            transition={springGentle}
                                                        >
                                                            <p className="text-xs text-muted-foreground mb-1">Your code</p>
                                                            <div className="text-2xl font-mono font-bold tracking-[0.3em] text-primary flex justify-center">
                                                                {code.split("").map((digit, i) => (
                                                                    <motion.span
                                                                        key={i}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ ...springBouncy, delay: 0.4 + i * 0.1 }}
                                                                    >
                                                                        {digit}
                                                                    </motion.span>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                                        <Button onClick={copyCode} size="sm" className="gap-1 w-full text-xs">
                                                            {copied ? <Check weight="bold" className="w-3 h-3" /> : <Copy weight="bold" className="w-3 h-3" />}
                                                            {copied ? "Copied!" : "Code"}
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                                        <Button onClick={copyLink} size="sm" variant="outline" className="gap-1 w-full text-xs">
                                                            {copiedLink ? <Check weight="bold" className="w-3 h-3" /> : <LinkIcon weight="bold" className="w-3 h-3" />}
                                                            {copiedLink ? "Copied!" : "Link"}
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                        <Button onClick={() => setShowQR(!showQR)} size="sm" variant="outline" className="px-2">
                                                            <QrCode weight="bold" className="w-4 h-4" />
                                                        </Button>
                                                    </motion.div>
                                                </div>

                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    <Button variant="ghost" onClick={resetUpload} size="sm" className="w-full text-xs">
                                                        Upload Another
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="upload"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex-1 flex flex-col"
                                            >
                                                {/* Dropzone with Preview */}
                                                <motion.div
                                                    onDragEnter={handleDrag}
                                                    onDragLeave={handleDrag}
                                                    onDragOver={handleDrag}
                                                    onDrop={handleDrop}
                                                    animate={{
                                                        scale: dragActive ? 1.02 : 1,
                                                    }}
                                                    transition={springSnappy}
                                                    className={`
                            relative border-2 border-dashed rounded-lg h-28 flex items-center justify-center text-center transition-colors
                            ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
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
                                                    <AnimatePresence mode="wait">
                                                        {files.length > 0 ? (
                                                            <motion.div
                                                                key="files"
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                transition={springBouncy}
                                                                className="flex items-center gap-3 px-3"
                                                            >
                                                                {previewUrl ? (
                                                                    <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded" />
                                                                ) : files.length > 1 ? (
                                                                    <FileArchive weight="duotone" className="w-8 h-8 text-primary" />
                                                                ) : files[0].type.startsWith("image/") ? (
                                                                    <Image weight="duotone" className="w-8 h-8 text-primary" />
                                                                ) : (
                                                                    <File weight="duotone" className="w-8 h-8 text-primary" />
                                                                )}
                                                                <div className="text-left">
                                                                    <p className="font-medium text-sm truncate max-w-[120px]">
                                                                        {files.length === 1 ? files[0].name : `${files.length} files`}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatFileSize(files.reduce((a, f) => a + f.size, 0))}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div
                                                                key="empty"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                className="space-y-1"
                                                            >
                                                                <motion.div
                                                                    animate={{ y: [0, -3, 0] }}
                                                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                                >
                                                                    <CloudArrowUp weight="duotone" className="w-6 h-6 mx-auto text-muted-foreground" />
                                                                </motion.div>
                                                                <p className="font-medium text-sm">Drop files here</p>
                                                                <p className="text-xs text-muted-foreground">or click to browse</p>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>

                                                {/* Options */}
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Clock weight="bold" className="w-3 h-3 text-muted-foreground" />
                                                        <div className="flex gap-1 flex-1">
                                                            {expiryOptions.map((opt) => (
                                                                <Button
                                                                    key={opt.value}
                                                                    size="sm"
                                                                    variant={uploadOptions.expiryMinutes === opt.value ? "default" : "ghost"}
                                                                    className="flex-1 h-6 text-xs px-1"
                                                                    onClick={() => setUploadOptions({ ...uploadOptions, expiryMinutes: opt.value })}
                                                                >
                                                                    {opt.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Lock weight="bold" className="w-3 h-3 text-muted-foreground" />
                                                            <span className="text-xs">Password</span>
                                                        </div>
                                                        <Switch
                                                            checked={uploadOptions.usePassword}
                                                            onCheckedChange={(checked) => setUploadOptions({ ...uploadOptions, usePassword: checked })}
                                                        />
                                                    </div>

                                                    <AnimatePresence>
                                                        {uploadOptions.usePassword && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                <Input
                                                                    type="password"
                                                                    placeholder="Enter password"
                                                                    value={uploadOptions.password}
                                                                    onChange={(e) => setUploadOptions({ ...uploadOptions, password: e.target.value })}
                                                                    className="h-7 text-xs"
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Remove button */}
                                                <AnimatePresence>
                                                    {files.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={springSnappy}
                                                        >
                                                            <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="mt-2 h-6 text-xs gap-1 w-full">
                                                                <X weight="bold" className="w-3 h-3" /> Clear files
                                                            </Button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Error */}
                                                <AnimatePresence>
                                                    {uploadError && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                                            animate={{ opacity: 1, y: 0, height: "auto" }}
                                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                                            transition={springSnappy}
                                                            className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs mt-2"
                                                        >
                                                            <Warning weight="fill" className="w-4 h-4" />
                                                            {uploadError}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Progress */}
                                                <AnimatePresence>
                                                    {uploadState === "uploading" && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="space-y-1 mt-2"
                                                        >
                                                            <Progress value={progress} className="h-1.5" />
                                                            <p className="text-xs text-muted-foreground text-center">{progress}%</p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="flex-1" />

                                                {/* Button */}
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={springSnappy}
                                                    className="mt-3"
                                                >
                                                    <Button onClick={uploadFile} disabled={files.length === 0 || uploadState === "uploading"} size="sm" className="w-full gap-2">
                                                        <CloudArrowUp weight="bold" className="w-4 h-4" />
                                                        {uploadState === "uploading" ? "Uploading..." : "Upload"}
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* ===== RECEIVE SECTION ===== */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...springBouncy, delay: 0.2 }}
                        >
                            <Card className="border flex flex-col h-full bg-background/80 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                        >
                                            <CloudArrowDown weight="duotone" className="w-5 h-5 text-primary" />
                                        </motion.div>
                                        Receive
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Enter the 6-digit code to download
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <AnimatePresence mode="wait">
                                        {downloadState === "success" ? (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={springBouncy}
                                                className="flex-1 flex flex-col justify-center text-center space-y-3"
                                            >
                                                <motion.div
                                                    className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ ...springBouncy, delay: 0.2 }}
                                                >
                                                    <CheckCircle weight="fill" className="w-6 h-6 text-primary" />
                                                </motion.div>
                                                <div>
                                                    <p className="font-medium text-sm">Download Complete!</p>
                                                    <p className="text-xs text-muted-foreground">File saved</p>
                                                </div>
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    <Button variant="ghost" onClick={resetDownload} size="sm" className="w-full text-xs">
                                                        Download Another
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        ) : (downloadState === "ready" || downloadState === "downloading") && fileInfo ? (
                                            <motion.div
                                                key="ready"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={springBouncy}
                                                className="flex-1 flex flex-col"
                                            >
                                                <motion.div
                                                    className="bg-muted rounded-lg p-3 flex items-center gap-3"
                                                    initial={{ scale: 0.9 }}
                                                    animate={{ scale: 1 }}
                                                    transition={springBouncy}
                                                >
                                                    <File weight="duotone" className="w-8 h-8 text-primary flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate text-sm">{fileInfo.name}</p>
                                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <HardDrive weight="bold" className="w-3 h-3" />
                                                                {formatFileSize(fileInfo.size)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Timer weight="bold" className="w-3 h-3" />
                                                                {formatTimeRemaining(fileInfo.expiresAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* Password input if needed */}
                                                {fileInfo && (fileInfo as FileInfo & { requiresPassword?: boolean }).requiresPassword && (
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter password"
                                                        value={downloadPassword}
                                                        onChange={(e) => setDownloadPassword(e.target.value)}
                                                        className="mt-2 h-8 text-xs"
                                                    />
                                                )}

                                                <div className="flex-1" />
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-3">
                                                    <Button onClick={downloadFile} disabled={downloadState === "downloading"} size="sm" className="w-full gap-2">
                                                        <CloudArrowDown weight="bold" className="w-4 h-4" />
                                                        {downloadState === "downloading" ? "Downloading..." : "Download"}
                                                    </Button>
                                                </motion.div>
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2">
                                                    <Button variant="ghost" onClick={resetDownload} size="sm" className="w-full text-xs">
                                                        Different Code
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="input"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex-1 flex flex-col"
                                            >
                                                {/* OTP Input */}
                                                <motion.div
                                                    className="h-28 flex items-center justify-center"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={springBouncy}
                                                >
                                                    <InputOTP value={downloadCode} onChange={setDownloadCode} maxLength={6} disabled={downloadState === "loading"}>
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={0} className="w-9 h-11 text-lg" />
                                                            <InputOTPSlot index={1} className="w-9 h-11 text-lg" />
                                                            <InputOTPSlot index={2} className="w-9 h-11 text-lg" />
                                                            <InputOTPSlot index={3} className="w-9 h-11 text-lg" />
                                                            <InputOTPSlot index={4} className="w-9 h-11 text-lg" />
                                                            <InputOTPSlot index={5} className="w-9 h-11 text-lg" />
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </motion.div>

                                                {/* Error */}
                                                <AnimatePresence>
                                                    {downloadError && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                                            animate={{ opacity: 1, y: 0, height: "auto" }}
                                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                                            transition={springSnappy}
                                                            className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs mt-2"
                                                        >
                                                            <Warning weight="fill" className="w-4 h-4" />
                                                            {downloadError}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="flex-1" />

                                                {/* Button */}
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={springSnappy}
                                                    className="mt-3"
                                                >
                                                    <Button onClick={() => checkCode()} disabled={downloadCode.length !== 6 || downloadState === "loading"} size="sm" className="w-full gap-2">
                                                        <CloudArrowDown weight="bold" className="w-4 h-4" />
                                                        {downloadState === "loading" ? "Checking..." : "Find File"}
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column - Recent Transfers */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...springBouncy, delay: 0.3 }}
                    >
                        <Card className="border bg-background/80 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ClockCounterClockwise weight="duotone" className="w-5 h-5 text-primary" />
                                        Recent
                                    </CardTitle>
                                    {recentTransfers.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={clearRecentTransfers} className="h-6 px-2">
                                            <Trash weight="bold" className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {recentTransfers.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                        No recent transfers
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {recentTransfers.map((transfer, i) => (
                                            <motion.div
                                                key={transfer.code}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ ...springBouncy, delay: i * 0.05 }}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(transfer.code);
                                                }}
                                            >
                                                <File weight="duotone" className="w-4 h-4 text-primary flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{transfer.fileName}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{transfer.code}</p>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {Math.round((transfer.expiresAt - Date.now()) / 60000)}m
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <motion.p
                    className="text-center text-xs text-muted-foreground mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Files are encrypted and automatically deleted after expiry
                </motion.p>
            </div>
        </main>
    );
}
