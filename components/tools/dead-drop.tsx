"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { QRModal } from "@/components/qr-modal";
import { getFileIcon } from "@/lib/file-icons";
import confetti from "canvas-confetti";
import { CONFETTI_COLORS } from "@/lib/colors";
import { CODE_LENGTH } from "@/lib/constants";
import {
    UploadSimple,
    CheckCircle,
    CaretDown,
    CloudArrowDown,
    Copy,
    FileArchive,
    Warning,
    Eye,
    EyeSlash,
    Link as LinkIcon,
} from "@phosphor-icons/react";

const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

type Tab = "send" | "receive";
type UploadStatus = "idle" | "uploading" | "done";
type DownloadStatus = "idle" | "loading" | "ready" | "downloading";

const EXPIRY = ["10m", "1h", "24h", "7d"];
const EXPIRY_MINUTES = [10, 60, 1440, 10080];
const LIMITS = ["1", "5", "10", "∞"];
const LIMITS_VALUES = [1, 5, 10, -1];

export function DeadDrop() {
    const [tab, setTab] = useState<Tab>("send");
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [shareCode, setShareCode] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [expiry, setExpiry] = useState(1);
    const [limit, setLimit] = useState(0);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const [copyMessage, setCopyMessage] = useState("");
    const [showQRModal, setShowQRModal] = useState(false);

    const [code, setCode] = useState("");
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
    const [error, setError] = useState("");
    const [fileInfo, setFileInfo] = useState<{
        name: string;
        size: number;
        expiresAt: string;
        requiresPassword: boolean;
        downloadsRemaining: number | string;
    } | null>(null);
    const [downloadPassword, setDownloadPassword] = useState("");
    const [showDownloadPassword, setShowDownloadPassword] = useState(false);
    const [buttonGlow, setButtonGlow] = useState(false);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatExpiry = (expiresAt: string) => {
        const now = new Date();
        const exp = new Date(expiresAt);
        const diff = exp.getTime() - now.getTime();
        if (diff < 0) return "expired";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}d`;
        if (hours > 0) return `${hours}h`;
        return `${minutes}m`;
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyMessage(`${label} copied!`);
            setTimeout(() => setCopyMessage(""), 2000);
        } catch {
            setCopyMessage("Failed to copy");
            setTimeout(() => setCopyMessage(""), 2000);
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    };

    const upload = async () => {
        if (!file) return;
        setUploadStatus("uploading");
        setProgress(0);
        setUploadError("");

        const mimeType = file.type || "application/octet-stream";

        try {
            const initRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    size: file.size,
                    mimeType,
                    expiryMinutes: EXPIRY_MINUTES[expiry],
                    maxDownloads: LIMITS_VALUES[limit],
                    password: password || undefined,
                }),
            });

            const initData = await initRes.json().catch(() => ({}));
            if (!initRes.ok) {
                setUploadError(initData.error || "Upload failed");
                setUploadStatus("idle");
                return;
            }

            const uploadUrl = typeof initData.uploadUrl === "string" ? initData.uploadUrl : "";
            const code = typeof initData.code === "string" ? initData.code : "";
            if (!uploadUrl || !code) {
                setUploadError("Upload initialization failed");
                setUploadStatus("idle");
                return;
            }

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                });

                xhr.addEventListener("load", () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setProgress(100);
                        resolve();
                        return;
                    }
                    reject(new Error("Upload failed"));
                });

                xhr.addEventListener("error", () => reject(new Error("Upload failed")));

                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", mimeType);
                xhr.send(file);
            });

            const finalizeRes = await fetch("/api/upload/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const finalizeData = await finalizeRes.json().catch(() => ({}));
            if (!finalizeRes.ok) {
                setUploadError(finalizeData.error || "Upload failed");
                setUploadStatus("idle");
                return;
            }

            setShareCode(finalizeData.code || code);
            setUploadStatus("done");
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: CONFETTI_COLORS,
            });
        } catch {
            setUploadError("Upload failed");
            setUploadStatus("idle");
        }
    };

    const reset = () => {
        setFile(null);
        setUploadStatus("idle");
        setProgress(0);
        setShareCode("");
        setPassword("");
        setUploadError("");
        setCopyMessage("");
    };

    const checkCode = async () => {
        if (code.length !== CODE_LENGTH) return;
        setDownloadStatus("loading");
        setError("");
        setFileInfo(null);

        try {
            const res = await fetch(`/api/download/${code}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "File not found");
                setDownloadStatus("idle");
                return;
            }

            setFileInfo(data);
            setDownloadStatus("ready");
        } catch {
            setError("Network error");
            setDownloadStatus("idle");
        }
    };

    const downloadFile = async () => {
        if (!fileInfo) return;
        setDownloadStatus("downloading");

        try {
            const res = await fetch(`/api/download/${code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: fileInfo.requiresPassword ? downloadPassword : undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Download failed");
                setDownloadStatus("ready");
                return;
            }

            if (!data.downloadUrl) {
                setError("Download failed");
                setDownloadStatus("ready");
                return;
            }

            const link = document.createElement("a");
            link.href = data.downloadUrl as string;
            link.download = fileInfo.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            resetDownload();
        } catch {
            setError("Download failed");
            setDownloadStatus("ready");
        }
    };

    const resetDownload = () => {
        setCode("");
        setDownloadStatus("idle");
        setError("");
        setFileInfo(null);
        setDownloadPassword("");
    };

    return (
        <>
            {/* Tabs */}
            <div className="flex bg-muted/50 p-1 rounded-xl mb-4 gap-1">
                {(["send", "receive"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setShowOptions(false); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg relative z-10 outline-none"
                    >
                        {tab === t && (
                            <motion.div
                                layoutId="dd-tab-indicator"
                                className="absolute inset-0 bg-background rounded-lg shadow-sm"
                                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                            />
                        )}
                        <span className={`relative z-10 transition-colors ${tab === t ? "text-foreground" : "text-muted-foreground"}`}>
                            {t === "send" ? "Send" : "Receive"}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait" initial={false}>
                {tab === "send" ? (
                    <motion.div
                        key="send"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={transition}
                        className="bg-card border rounded-2xl p-3 sm:p-4"
                    >
                        {uploadStatus === "done" ? (
                            <div className="py-4 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <CheckCircle weight="fill" className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Done</p>
                                            <p className="text-muted-foreground text-xs">{copyMessage || "Share this code"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowQRModal(true)} className="text-foreground hover:scale-105 transition-transform">
                                        <QRCodeSVG
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/download?code=${shareCode}`}
                                            size={52}
                                            level="L"
                                            bgColor="transparent"
                                            fgColor="currentColor"
                                        />
                                    </button>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-xl text-center">
                                    <p className="text-2xl font-mono font-bold tracking-[0.15em]">{shareCode}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => copyToClipboard(shareCode, "Code")} className="flex-1 gap-1.5 h-9" size="sm">
                                        <Copy className="w-3.5 h-3.5" /> Code
                                    </Button>
                                    <Button variant="outline" onClick={() => copyToClipboard(`${window.location.origin}/download?code=${shareCode}`, "Link")} className="flex-1 gap-1.5 h-9" size="sm">
                                        <LinkIcon className="w-3.5 h-3.5" /> Link
                                    </Button>
                                    <Button onClick={reset} className="flex-1 h-9" size="sm">New</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Dropzone */}
                                <div
                                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`relative min-h-[140px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-colors ${file ? "border-primary bg-primary/5" : isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                                >
                                    <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    {file ? (() => {
                                        const { icon: Icon, color } = getFileIcon(file.name);
                                        return (
                                            <div className="text-center space-y-1">
                                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                                                    <Icon weight="duotone" className={`w-5 h-5 ${color}`} />
                                                </div>
                                                <p className="font-medium text-sm truncate max-w-[180px]">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                                            </div>
                                        );
                                    })() : (
                                        <div className="text-center space-y-1">
                                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto">
                                                <UploadSimple className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium">Drop file</p>
                                            <p className="text-xs text-muted-foreground">1 GB max</p>
                                        </div>
                                    )}
                                </div>

                                {/* Options */}
                                <div>
                                    <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground">
                                        Options
                                        <motion.div animate={{ rotate: showOptions ? 180 : 0 }} transition={transition}>
                                            <CaretDown className="w-4 h-4" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {showOptions && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="overflow-hidden">
                                                <div className="pt-2 pb-1 space-y-3">
                                                    <div className="space-y-1.5">
                                                        <p className="text-xs text-muted-foreground">Expires</p>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {EXPIRY.map((e, i) => (
                                                                <button key={e} onClick={() => setExpiry(i)} className={`text-xs py-1.5 rounded-md transition-all ${expiry === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                                                                    {e}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-xs text-muted-foreground">Downloads</p>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {LIMITS.map((l, i) => (
                                                                <button key={l} onClick={() => setLimit(i)} className={`text-xs py-1.5 rounded-md transition-all ${limit === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                                                                    {l}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-xs text-muted-foreground">Password (optional)</p>
                                                        <div className="relative">
                                                            <Input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 text-xs pr-8" />
                                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                                {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Upload */}
                                {uploadStatus === "uploading" ? (
                                    <div className="space-y-2 pt-2">
                                        <Progress value={progress} className="h-1.5" />
                                        <p className="text-xs text-center text-muted-foreground">Uploading...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {uploadError && (
                                            <p className="text-sm text-destructive flex items-center justify-center gap-1">
                                                <Warning weight="bold" className="w-4 h-4" /> {uploadError}
                                            </p>
                                        )}
                                        <Button onClick={upload} disabled={!file} className="w-full" size="lg">Upload</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="receive"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={transition}
                        className="bg-card border rounded-2xl p-3 sm:p-4"
                    >
                        {downloadStatus === "ready" || downloadStatus === "downloading" ? (
                            <div className="py-6 text-center space-y-4">
                                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                                    <FileArchive weight="duotone" className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold truncate max-w-[250px] mx-auto">{fileInfo?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {fileInfo ? formatSize(fileInfo.size) : ''} • expires in {fileInfo ? formatExpiry(fileInfo.expiresAt) : ''}
                                    </p>
                                </div>
                                {fileInfo?.requiresPassword && (
                                    <div className="space-y-1.5 text-left">
                                        <p className="text-xs text-muted-foreground">Password required</p>
                                        <div className="relative">
                                            <Input type={showDownloadPassword ? "text" : "password"} placeholder="Enter password" value={downloadPassword} onChange={(e) => setDownloadPassword(e.target.value)} className="h-9 text-sm pr-8" />
                                            <button type="button" onClick={() => setShowDownloadPassword(!showDownloadPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                {showDownloadPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {error && <p className="text-sm text-destructive flex items-center justify-center gap-1"><Warning weight="bold" className="w-4 h-4" /> {error}</p>}
                                <div className="space-y-2">
                                    <Button onClick={downloadFile} disabled={downloadStatus === "downloading" || (fileInfo?.requiresPassword && !downloadPassword)} className="w-full gap-1.5" size="lg">
                                        <CloudArrowDown className="w-5 h-5" />
                                        {downloadStatus === "downloading" ? "Downloading..." : "Download"}
                                    </Button>
                                    <Button variant="ghost" onClick={resetDownload} className="w-full text-muted-foreground">Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center space-y-5">
                                <div>
                                    <p className="font-semibold text-lg">Get file</p>
                                    <p className="text-sm text-muted-foreground">Enter {CODE_LENGTH}-digit code</p>
                                </div>
                                <div className="flex justify-center">
                                    <InputOTP maxLength={CODE_LENGTH} value={code} onChange={(v) => { setCode(v); setError(""); if (v.length === CODE_LENGTH) { setButtonGlow(true); setTimeout(() => setButtonGlow(false), 1000); setTimeout(checkCode, 50); } }}>
                                        <InputOTPGroup className="gap-1.5">
                                            {Array.from({ length: CODE_LENGTH }, (_, i) => (
                                                <InputOTPSlot key={i} index={i} className="w-9 h-11 rounded-lg border-2 text-base" />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                {error && <p className="text-sm text-destructive flex items-center justify-center gap-1"><Warning weight="bold" className="w-4 h-4" /> {error}</p>}
                                <Button onClick={checkCode} disabled={code.length !== CODE_LENGTH || downloadStatus === "loading"} className={`w-full transition-all duration-300 ${buttonGlow ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_20px_hsl(var(--primary)/0.5)]" : ""}`} size="lg">
                                    {downloadStatus === "loading" ? "Checking..." : "Get File"}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <QRModal code={shareCode} isOpen={showQRModal} onClose={() => setShowQRModal(false)} onCopy={copyToClipboard} />
        </>
    );
}
