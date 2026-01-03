"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, Image as ImageIcon, CaretDown, UploadSimple, DownloadSimple } from "@phosphor-icons/react";
import { EXPIRY_OPTIONS } from "@/lib/share-types";

export function ImageHost() {
    const [image, setImage] = useState<string | null>(null);
    const [imageName, setImageName] = useState("");
    const [expiry, setExpiry] = useState(2);
    const [showOptions, setShowOptions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ code: string; url: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be under 5MB");
            return;
        }

        setImageName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result as string);
            setError("");
        };
        reader.readAsDataURL(file);
    };

    const create = async () => {
        if (!image) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "image",
                    content: image, // base64 data URL
                    originalName: imageName,
                    mimeType: "image/png",
                    expiryMinutes: EXPIRY_OPTIONS[expiry].value,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(data);
            setImage(null);
            setImageName("");
        } catch (err: any) {
            setError(err.message || "Failed to upload");
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const reset = () => {
        setResult(null);
        setError("");
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {result ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <ImageIcon weight="duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold">Image uploaded!</p>
                            <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                        </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <p className="text-lg font-mono font-bold">{result.code}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={copy} variant="outline" className="flex-1 gap-1.5">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Copy link"}
                        </Button>
                        <Button onClick={reset} className="flex-1">New</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Dropzone */}
                    <div
                        onClick={() => fileRef.current?.click()}
                        className={`relative min-h-zone-xl border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-colors ${image ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                            }`}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFile}
                            className="hidden"
                        />
                        {image ? (
                            <div className="text-center space-y-2">
                                <img src={image} alt="Preview" className="max-h-20 mx-auto rounded" />
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{imageName}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const link = document.createElement("a");
                                        link.href = image;
                                        link.download = imageName || "image.png";
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                >
                                    <DownloadSimple className="w-3 h-3" />
                                    Download
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-1">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto">
                                    <UploadSimple className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">Drop image</p>
                                <p className="text-xs text-muted-foreground">5 MB max</p>
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                        >
                            options
                            <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                                <CaretDown className="w-4 h-4" />
                            </motion.div>
                        </button>
                        {showOptions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">expires in</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {EXPIRY_OPTIONS.map((opt, i) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setExpiry(i)}
                                                className={`px-2 py-1 text-xs rounded-lg ${expiry === i
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button onClick={create} disabled={!image || loading} className="w-full gap-2">
                        <ImageIcon className="w-4 h-4" />
                        {loading ? "Uploading..." : "Upload image"}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
