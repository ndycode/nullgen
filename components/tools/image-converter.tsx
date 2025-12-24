"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UploadSimple, DownloadSimple, Image as ImageIcon, ArrowRight, X } from "@phosphor-icons/react";

type ImageFormat = "png" | "jpeg" | "webp";

const FORMATS: { id: ImageFormat; name: string; mime: string }[] = [
    { id: "png", name: "PNG", mime: "image/png" },
    { id: "jpeg", name: "JPG", mime: "image/jpeg" },
    { id: "webp", name: "WEBP", mime: "image/webp" },
];

export function ImageConverter() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [outputFormat, setOutputFormat] = useState<ImageFormat>("png");
    const [quality, setQuality] = useState(90);
    const [converting, setConverting] = useState(false);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith("image/")) return;
        setFile(selectedFile);
        setConvertedUrl(null);

        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const convert = async () => {
        if (!preview || !canvasRef.current) return;
        setConverting(true);

        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current!;
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d")!;

            // For JPEG, fill white background (no transparency)
            if (outputFormat === "jpeg") {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            const mime = FORMATS.find(f => f.id === outputFormat)!.mime;
            const dataUrl = canvas.toDataURL(mime, quality / 100);
            setConvertedUrl(dataUrl);
            setConverting(false);
        };
        img.src = preview;
    };

    const download = () => {
        if (!convertedUrl || !file) return;
        const link = document.createElement("a");
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        link.download = `${baseName}.${outputFormat}`;
        link.href = convertedUrl;
        link.click();
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setConvertedUrl(null);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <canvas ref={canvasRef} className="hidden" />

            {!file ? (
                /* Dropzone */
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative min-h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-colors ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Drop image here</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF</p>
                </div>
            ) : (
                <>
                    {/* Preview */}
                    <div className="relative">
                        <button
                            onClick={reset}
                            className="absolute top-2 right-2 z-10 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {preview && (
                            <motion.img
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={preview}
                                alt="Preview"
                                className="w-full h-32 object-contain rounded-lg bg-muted/30"
                            />
                        )}
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            {file.name} • {formatSize(file.size)}
                        </p>
                    </div>

                    {/* Format selector */}
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Convert to</p>
                        <div className="flex gap-1">
                            {FORMATS.map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => { setOutputFormat(fmt.id); setConvertedUrl(null); }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${outputFormat === fmt.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {fmt.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quality slider (for JPEG/WEBP) */}
                    {(outputFormat === "jpeg" || outputFormat === "webp") && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Quality</span>
                                <span>{quality}%</span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={100}
                                value={quality}
                                onChange={(e) => { setQuality(parseInt(e.target.value)); setConvertedUrl(null); }}
                                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    )}

                    {/* Convert button */}
                    {!convertedUrl ? (
                        <Button onClick={convert} disabled={converting} className="w-full gap-2">
                            <ArrowRight className="w-4 h-4" />
                            {converting ? "Converting..." : `Convert to ${outputFormat.toUpperCase()}`}
                        </Button>
                    ) : (
                        <Button onClick={download} className="w-full gap-2">
                            <DownloadSimple className="w-4 h-4" />
                            Download {outputFormat.toUpperCase()}
                        </Button>
                    )}
                </>
            )}
        </motion.div>
    );
}
