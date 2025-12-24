"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadSimple, UploadSimple, Image as ImageIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "emoji" | "image";

export function FaviconGen() {
    const [mode, setMode] = useState<Mode>("emoji");
    const [text, setText] = useState("🎯");
    const [bgColor, setBgColor] = useState("#ec4899");
    const [textColor, setTextColor] = useState("#ffffff");
    const [borderRadius, setBorderRadius] = useState(12);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string>("");
    const [isReady, setIsReady] = useState(false);

    // Delay initial render to prevent lag when switching tools
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isReady) {
            generatePreview(64);
        }
    }, [text, bgColor, textColor, borderRadius, uploadedImage, mode, isReady]);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedImage(e.target?.result as string);
            setMode("image");
        };
        reader.readAsDataURL(file);
    };

    const generatePreview = (size: number = 64) => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Draw rounded rectangle background
        const radius = (borderRadius / 100) * (size / 2);
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, radius);
        ctx.fillStyle = bgColor;
        ctx.fill();

        if (mode === "image" && uploadedImage) {
            // Draw uploaded image
            const img = new Image();
            img.onload = () => {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(0, 0, size, size, radius);
                ctx.clip();

                // Cover fit
                const scale = Math.max(size / img.width, size / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (size - w) / 2;
                const y = (size - h) / 2;

                ctx.drawImage(img, x, y, w, h);
                ctx.restore();
                setPreview(canvas.toDataURL("image/png"));
            };
            img.src = uploadedImage;
        } else {
            // Draw text/emoji
            ctx.fillStyle = textColor;
            const fontSize = size * 0.6;
            ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text.slice(0, 2), size / 2, size / 2 + 2);
            setPreview(canvas.toDataURL("image/png"));
        }
    };

    const download = (downloadSize: number) => {
        const canvas = document.createElement("canvas");
        canvas.width = downloadSize;
        canvas.height = downloadSize;
        const ctx = canvas.getContext("2d")!;

        const radius = (borderRadius / 100) * (downloadSize / 2);
        ctx.beginPath();
        ctx.roundRect(0, 0, downloadSize, downloadSize, radius);
        ctx.fillStyle = bgColor;
        ctx.fill();

        if (mode === "image" && uploadedImage) {
            const img = new Image();
            img.onload = () => {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(0, 0, downloadSize, downloadSize, radius);
                ctx.clip();

                const scale = Math.max(downloadSize / img.width, downloadSize / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (downloadSize - w) / 2;
                const y = (downloadSize - h) / 2;

                ctx.drawImage(img, x, y, w, h);
                ctx.restore();

                const link = document.createElement("a");
                link.download = `favicon-${downloadSize}x${downloadSize}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            };
            img.src = uploadedImage;
        } else {
            ctx.fillStyle = textColor;
            const fontSize = downloadSize * 0.6;
            ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text.slice(0, 2), downloadSize / 2, downloadSize / 2 + 2);

            const link = document.createElement("a");
            link.download = `favicon-${downloadSize}x${downloadSize}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        }
    };

    const downloadAll = () => {
        [16, 32, 64, 128, 256].forEach((s, i) => {
            setTimeout(() => download(s), i * 200);
        });
    };

    return (
        <div className="bg-card border rounded-2xl p-4 space-y-4">
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={previewCanvasRef} className="hidden" />
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
            />

            {/* Mode toggle */}
            <div className="flex gap-1">
                <button
                    onClick={() => setMode("emoji")}
                    className={`flex-1 py-2 text-sm rounded-lg transition-colors ${mode === "emoji" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                >
                    Emoji / Text
                </button>
                <button
                    onClick={() => inputRef.current?.click()}
                    className={`flex-1 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${mode === "image" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Upload PNG
                </button>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center p-6 bg-muted/30 rounded-xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={preview}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        {preview && (
                            <img
                                src={preview}
                                alt="Favicon preview"
                                className="shadow-lg"
                                style={{ width: 64, height: 64 }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Emoji/Text input - only show in emoji mode */}
            {mode === "emoji" && (
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">emoji or letter</label>
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="🎯 or A"
                        maxLength={2}
                        className="text-center text-2xl h-12"
                    />
                </div>
            )}

            {/* Uploaded image preview */}
            {mode === "image" && uploadedImage && (
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                    <img src={uploadedImage} alt="Uploaded" className="w-10 h-10 object-cover rounded" />
                    <span className="text-sm text-muted-foreground flex-1">Image loaded</span>
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="text-xs text-primary hover:underline"
                    >
                        change
                    </button>
                </div>
            )}

            {/* Colors - only show background for image mode */}
            <div className={`grid gap-3 ${mode === "emoji" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">background</label>
                    <div className="flex gap-2">
                        <div
                            className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: bgColor }}
                            onClick={() => {
                                const colors = ["#ec4899", "#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#000000", "#ffffff"];
                                setBgColor(colors[Math.floor(Math.random() * colors.length)]);
                            }}
                            title="Click for random"
                        />
                        <Input
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="flex-1 font-mono text-xs"
                        />
                    </div>
                </div>
                {mode === "emoji" && (
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">text</label>
                        <div className="flex gap-2">
                            <div
                                className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                                style={{ backgroundColor: textColor }}
                                onClick={() => {
                                    setTextColor(textColor === "#ffffff" ? "#000000" : "#ffffff");
                                }}
                                title="Toggle black/white"
                            />
                            <Input
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="flex-1 font-mono text-xs"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Border radius */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">corner radius</span>
                    <span>{borderRadius}%</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={50}
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
            </div>

            {/* Download buttons */}
            <div className="grid grid-cols-3 gap-2">
                {[16, 32, 64].map((s) => (
                    <button
                        key={s}
                        onClick={() => download(s)}
                        className="py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                        {s}×{s}
                    </button>
                ))}
            </div>

            <Button onClick={downloadAll} className="w-full gap-2">
                <DownloadSimple className="w-4 h-4" />
                Download All Sizes
            </Button>
        </div>
    );
}
