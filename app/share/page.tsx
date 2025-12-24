"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";


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

// Smooth transitions
const transitionSmooth = { type: "tween" as const, ease: "easeInOut", duration: 0.3 } as const;
const transitionSubtle = { type: "tween" as const, ease: "easeOut", duration: 0.2 } as const;

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
        const stored = localStorage.getItem("vxid_recent");
        if (stored) {
            const transfers: RecentTransfer[] = JSON.parse(stored);
            // Filter out expired transfers
            const valid = transfers.filter((t) => t.expiresAt > Date.now());
            setRecentTransfers(valid);
            localStorage.setItem("vxid_recent", JSON.stringify(valid));
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
        localStorage.setItem("vxid_recent", JSON.stringify(updated));
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
        localStorage.removeItem("vxid_recent");
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
            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="grid grid-cols-[40px_1fr_40px] items-center mb-4"
                >
                    <Link href="/" className="justify-self-start">
                        <Button variant="ghost" size="icon" className="w-auto h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors gap-2">
                            <ArrowLeft weight="bold" className="w-4 h-4" />
                            <span className="text-sm font-medium">Back</span>
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-center justify-self-center">vxid.cc</h1>
                    <div /> {/* Empty col for balance */}
                </motion.div>

                {/* Main Card - Animated Resize */}
                <motion.div
                    layout
                    transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
                    className="border shadow-lg overflow-hidden rounded-xl bg-card w-full"
                >

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-4 pt-4 pb-0">
                            <TabsList className="w-full grid grid-cols-2 relative h-9 bg-muted/50 p-1 rounded-lg">
                                <TabsTrigger value="send" className="z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200 text-xs font-medium">Send</TabsTrigger>
                                <TabsTrigger value="receive" className="z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200 text-xs font-medium">Receive</TabsTrigger>
                                <motion.div
                                    className="absolute top-1 bottom-1 bg-background rounded-md shadow-sm z-0"
                                    initial={false}
                                    animate={{
                                        x: activeTab === "send" ? 0 : "100%",
                                        left: "4px",
                                        width: "calc(50% - 8px)"
                                    }}
                                    transition={transitionSmooth}
                                />
                            </TabsList>
                        </div>

                        <div className="relative overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {activeTab === "send" ? (
                                    <motion.div
                                        key="send"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={transitionSmooth}
                                        className="p-4"
                                    >
                                        <TabsContent value="send" className="mt-0 space-y-4 focus-visible:outline-none">
                                            <AnimatePresence mode="wait">
                                                {uploadState === "success" ? (
                                                    <motion.div
                                                        key="success"
                                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        transition={transitionSmooth}
                                                        className="text-center space-y-6 py-6"
                                                    >
                                                        <motion.div
                                                            initial={{ scale: 0.5, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ ...transitionSmooth, delay: 0.1 }}
                                                            className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                                                        >
                                                            <CheckCircle weight="fill" className="w-8 h-8 text-primary" />
                                                        </motion.div>

                                                        <div className="bg-muted/50 p-4 rounded-xl relative overflow-hidden">
                                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Transfer Code</p>
                                                            <div className="text-3xl font-bold tracking-tight">
                                                                {code}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Button onClick={copyCode} variant="outline" className="gap-2 h-9 text-sm">
                                                                {copied ? <Check weight="bold" /> : <Copy weight="bold" />}
                                                                {copied ? "Copied" : "Copy Code"}
                                                            </Button>
                                                            <Button onClick={copyLink} variant="outline" className="gap-2 h-9 text-sm">
                                                                {copiedLink ? <Check weight="bold" /> : <LinkIcon weight="bold" />}
                                                                {copiedLink ? "Copied" : "Copy Link"}
                                                            </Button>
                                                        </div>

                                                        <Button onClick={resetUpload} variant="ghost" className="w-full text-muted-foreground hover:text-foreground text-sm h-8">
                                                            Send Another
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="upload-form"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="space-y-4"
                                                    >
                                                        <motion.div
                                                            onDrop={handleDrop}
                                                            animate={{
                                                                scale: dragActive ? 1.005 : 1,
                                                                borderColor: dragActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                                                                backgroundColor: dragActive ? "hsl(var(--primary) / 0.05)" : "transparent"
                                                            }}
                                                            whileHover={{ scale: 1.002, borderColor: "hsl(var(--primary) / 0.5)", backgroundColor: "hsl(var(--muted) / 0.5)" }}
                                                            whileTap={{ scale: 0.998 }}
                                                            transition={transitionSubtle}
                                                            className={`
                                                    relative border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                                    ${files.length > 0 ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20"}
                                                `}
                                                        >
                                                            <input
                                                                type="file"
                                                                onChange={handleFileInput}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                                disabled={uploadState === "uploading"}
                                                                multiple
                                                            />
                                                            {files.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {previewUrl ? (
                                                                        <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md mx-auto shadow-sm" />
                                                                    ) : (
                                                                        <FileArchive className="w-10 h-10 text-primary mx-auto" />
                                                                    )}
                                                                    <div className="px-4">
                                                                        <p className="font-medium text-sm truncate max-w-[200px] mx-auto">
                                                                            {files.length === 1 ? files[0].name : `${files.length} files detected`}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {formatFileSize(files.reduce((a, f) => a + f.size, 0))}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                                                                        <CloudArrowUp className="w-6 h-6 text-muted-foreground" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-sm">Drop files here</p>
                                                                        <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {files.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFiles([]); }}
                                                                    className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-background hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-border hover:border-primary shadow-sm transition-colors cursor-pointer"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </motion.div>

                                                        <div className="pt-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setOptionsOpen(!optionsOpen)}
                                                                className="w-full flex justify-between text-muted-foreground hover:text-foreground h-9 font-medium"
                                                            >
                                                                <span>Options</span>
                                                                <GearSix className={`w-4 h-4 transition-transform ${optionsOpen ? "rotate-90" : ""}`} />
                                                            </Button>

                                                            <AnimatePresence initial={false}>
                                                                {optionsOpen && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                                                        style={{ overflow: "hidden" }}
                                                                    >
                                                                        <div className="pt-2 space-y-4">
                                                                            <LayoutGroup>
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-xs font-medium text-muted-foreground">Expires In</label>
                                                                                        <div className="flex bg-muted p-1 rounded-lg">
                                                                                            {expiryOptions.map((opt) => {
                                                                                                const isActive = uploadOptions.expiryMinutes === opt.value;
                                                                                                return (
                                                                                                    <button
                                                                                                        key={opt.value}
                                                                                                        onClick={() => setUploadOptions(prev => ({ ...prev, expiryMinutes: opt.value }))}
                                                                                                        className={`relative flex-1 text-xs py-1.5 px-2 rounded-md transition-colors font-medium ${isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                                                                                    >
                                                                                                        {isActive && (
                                                                                                            <motion.div
                                                                                                                layoutId="expiry-pill"
                                                                                                                className="absolute inset-0 bg-primary rounded-md z-0 pointer-events-none"
                                                                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                                                            />
                                                                                                        )}
                                                                                                        <span className="relative z-10">{opt.label}</span>
                                                                                                    </button>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-xs font-medium text-muted-foreground">Max Downloads</label>
                                                                                        <div className="flex bg-muted p-1 rounded-lg">
                                                                                            {downloadOptions.map((opt) => {
                                                                                                const isActive = uploadOptions.maxDownloads === opt.value;
                                                                                                return (
                                                                                                    <button
                                                                                                        key={opt.value}
                                                                                                        onClick={() => setUploadOptions(prev => ({ ...prev, maxDownloads: opt.value }))}
                                                                                                        className={`relative flex-1 text-xs py-1.5 px-2 rounded-md transition-colors font-medium ${isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                                                                                    >
                                                                                                        {isActive && (
                                                                                                            <motion.div
                                                                                                                layoutId="download-pill"
                                                                                                                className="absolute inset-0 bg-primary rounded-md z-0 pointer-events-none"
                                                                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                                                            />
                                                                                                        )}
                                                                                                        <span className="relative z-10">{opt.label}</span>
                                                                                                    </button>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </LayoutGroup>

                                                                            <div className="space-y-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <label className="text-xs font-medium text-muted-foreground">Password Protection</label>
                                                                                    <Switch
                                                                                        checked={uploadOptions.usePassword}
                                                                                        onCheckedChange={(c) => setUploadOptions(prev => ({ ...prev, usePassword: c }))}
                                                                                        className="scale-90"
                                                                                    />
                                                                                </div>
                                                                                <AnimatePresence initial={false}>
                                                                                    {uploadOptions.usePassword && (
                                                                                        <motion.div
                                                                                            initial={{ height: 0, opacity: 0 }}
                                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                                            exit={{ height: 0, opacity: 0 }}
                                                                                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                                                                            style={{ overflow: "hidden" }}
                                                                                        >
                                                                                            <div className="mt-2">
                                                                                                <div className="relative">
                                                                                                    <Input
                                                                                                        type={showPassword ? "text" : "password"}
                                                                                                        placeholder="Enter password"
                                                                                                        value={uploadOptions.password}
                                                                                                        onChange={(e) => setUploadOptions(prev => ({ ...prev, password: e.target.value }))}
                                                                                                        className="h-9 text-sm pr-9"
                                                                                                    />
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                                                                    >
                                                                                                        {showPassword ? (
                                                                                                            <EyeSlash weight="bold" className="w-4 h-4" />
                                                                                                        ) : (
                                                                                                            <Eye weight="bold" className="w-4 h-4" />
                                                                                                        )}
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {uploadError && (
                                                            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center gap-2">
                                                                <Warning weight="fill" /> {uploadError}
                                                            </div>
                                                        )}

                                                        {uploadState === "uploading" && (
                                                            <div className="space-y-2">
                                                                <Progress value={progress} className="h-2" />
                                                                <p className="text-xs text-muted-foreground text-center">Uploading... {progress}%</p>
                                                            </div>
                                                        )}

                                                        <Button
                                                            onClick={uploadFile}
                                                            disabled={files.length === 0 || uploadState === "uploading"}
                                                            className="w-full gap-2 font-medium"
                                                            size="lg"
                                                            color="primary"
                                                        >
                                                            {uploadState === "uploading" ? "Creating Link..." : "Create Link"}
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </TabsContent>
                                    </motion.div >
                                ) : (
                                    <motion.div
                                        key="receive"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={transitionSmooth}
                                        className="p-4"
                                    >
                                        <TabsContent value="receive" className="mt-0 space-y-6 focus-visible:outline-none">
                                            <AnimatePresence mode="wait">
                                                {(downloadState === "ready" || downloadState === "downloading" || downloadState === "success") && fileInfo ? (
                                                    <motion.div
                                                        key="ready"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
                                                            <div className="flex items-start gap-4">
                                                                <div className="bg-background border p-2 rounded-lg shadow-sm">
                                                                    <File weight="duotone" className="w-8 h-8 text-primary" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h3 className="font-semibold text-sm truncate">{fileInfo.name}</h3>
                                                                    <div className="flex gap-3 mt-1 text-muted-foreground">
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <HardDrive weight="bold" /> {formatFileSize(fileInfo.size)}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <Timer weight="bold" /> {formatTimeRemaining(fileInfo.expiresAt)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Password Input for Download */}
                                                        {(fileInfo as any).requiresPassword && (
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-medium text-muted-foreground">Password Required</label>
                                                                <Input
                                                                    type="password"
                                                                    placeholder="Enter file password"
                                                                    value={downloadPassword}
                                                                    onChange={(e) => setDownloadPassword(e.target.value)}
                                                                    className="h-10"
                                                                />
                                                            </div>
                                                        )}

                                                        <Button onClick={downloadFile} disabled={downloadState === "downloading"} className="w-full gap-2" size="lg">
                                                            <CloudArrowDown weight="bold" className="w-4 h-4" />
                                                            {downloadState === "downloading" ? "Downloading..." : "Download File"}
                                                        </Button>

                                                        <Button onClick={resetDownload} variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
                                                            Find Another File
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
                                                            <p className="text-sm text-muted-foreground">Enter the 6-digit code to receive files</p>
                                                        </div>

                                                        <div className="flex justify-center">
                                                            <InputOTP value={downloadCode} onChange={(val) => {
                                                                setDownloadCode(val);
                                                                if (val.length === 6) checkCode(val);
                                                            }} maxLength={6}>
                                                                <InputOTPGroup className="gap-2">
                                                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                                                        <InputOTPSlot key={i} index={i} className="w-10 h-12 text-xl shadow-sm" />
                                                                    ))}
                                                                </InputOTPGroup>
                                                            </InputOTP>
                                                        </div>

                                                        {downloadError && (
                                                            <div className="text-center text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                                                                {downloadError}
                                                            </div>
                                                        )}

                                                        <Button
                                                            onClick={() => checkCode()}
                                                            disabled={downloadCode.length !== 6 || downloadState === "loading"}
                                                            className="w-full gap-2"
                                                            size="lg"
                                                        >
                                                            {downloadState === "loading" ? "Searching..." : "Find File"}
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </TabsContent>

                                    </motion.div>
                                )
                                }
                            </AnimatePresence >
                        </div >
                    </Tabs >
                </motion.div >

                {/* Compact Recent Files */}
                <AnimatePresence>
                    {
                        recentTransfers.length > 0 && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                                className="mt-6"
                            >
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Recent Transfers</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={clearRecentTransfers}
                                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                                    >
                                        <Trash className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <LayoutGroup>
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {recentTransfers.map((t) => (
                                                <motion.div
                                                    layout
                                                    key={t.code}
                                                    variants={{
                                                        hidden: { opacity: 0, x: -10 },
                                                        visible: { opacity: 1, x: 0 }
                                                    }}
                                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(t.code);
                                                    }}
                                                    whileHover={{ x: 5, backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="bg-card border p-3 flex items-center gap-3 transition-colors cursor-pointer group origin-center hover:shadow-sm rounded-lg"
                                                >
                                                    <div className="bg-muted text-muted-foreground p-1.5 rounded-md">
                                                        <File className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline">
                                                            <p className="text-sm font-medium truncate max-w-[150px]">{t.fileName}</p>
                                                            <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded-md group-hover:bg-muted group-hover:text-foreground transition-colors">
                                                                {t.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </LayoutGroup>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >
            </div >
        </main >
    );
}
