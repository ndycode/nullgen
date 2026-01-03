"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UploadSimple, Download, Check, Trash } from "@phosphor-icons/react";

export function ImageBlur() {
    const [image, setImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [blurAmount, setBlurAmount] = useState(10);
    const [pixelate, setPixelate] = useState(false);
    const [pixelSize, setPixelSize] = useState(10);
    const [downloaded, setDownloaded] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => setImage(e.target?.result as string);
        reader.readAsDataURL(file);
        setDownloaded(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const processImage = useCallback(() => {
        if (!image || !canvasRef.current) return null;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const img = new Image();
        img.src = image;

        return new Promise<string>((resolve) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                if (pixelate) {
                    // Pixelate effect
                    const size = pixelSize;
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, img.width / size, img.height / size);
                    ctx.drawImage(canvas, 0, 0, img.width / size, img.height / size, 0, 0, img.width, img.height);
                } else {
                    // Blur effect using CSS filter
                    ctx.filter = `blur(${blurAmount}px)`;
                    ctx.drawImage(img, 0, 0);
                    ctx.filter = "none";
                }

                resolve(canvas.toDataURL("image/png"));
            };
        });
    }, [image, blurAmount, pixelate, pixelSize]);

    const download = async () => {
        const result = await processImage();
        if (!result) return;

        const link = document.createElement("a");
        link.download = `blurred-${fileName}`;
        link.href = result;
        link.click();
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2000);
    };

    const clear = () => {
        setImage(null);
        setFileName("");
        setDownloaded(false);
    };

    const hasImage = !!image;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <canvas ref={canvasRef} className="hidden" />
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
            />

            {/* Upload area / Preview */}
            <div
                onClick={() => !hasImage && inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`relative rounded-xl overflow-hidden transition-colors ${hasImage
                        ? "bg-muted/50"
                        : "border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer"
                    }`}
            >
                {hasImage ? (
                    <>
                        <img
                            src={image}
                            alt="Preview"
                            className="w-full h-40 object-contain"
                            style={{ filter: pixelate ? "none" : `blur(${blurAmount / 3}px)` }}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); clear(); }}
                            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-lg hover:bg-background transition-colors"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="p-6 text-center">
                        <UploadSimple className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">drop image or click to upload</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">png, jpg, webp</p>
                    </div>
                )}
            </div>

            {/* Controls - Always visible */}
            <div className={`space-y-4 ${!hasImage ? "opacity-50 pointer-events-none" : ""}`}>
                {/* Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setPixelate(false)}
                        disabled={!hasImage}
                        className={`flex-1 py-2.5 text-sm rounded-lg transition-colors min-h-touch-md ${!pixelate ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        Blur
                    </button>
                    <button
                        onClick={() => setPixelate(true)}
                        disabled={!hasImage}
                        className={`flex-1 py-2.5 text-sm rounded-lg transition-colors min-h-touch-md ${pixelate ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        Pixelate
                    </button>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{pixelate ? "pixel size" : "blur amount"}</span>
                        <span className="font-medium">{pixelate ? pixelSize : blurAmount}px</span>
                    </div>
                    <input
                        type="range"
                        min={pixelate ? 2 : 1}
                        max={pixelate ? 50 : 50}
                        value={pixelate ? pixelSize : blurAmount}
                        onChange={(e) => pixelate ? setPixelSize(Number(e.target.value)) : setBlurAmount(Number(e.target.value))}
                        disabled={!hasImage}
                        className="w-full accent-primary h-6"
                    />
                </div>
            </div>

            {/* Action buttons - Always visible */}
            <div className={`flex gap-2 ${!hasImage ? "opacity-50 pointer-events-none" : ""}`}>
                <Button
                    variant="outline"
                    onClick={clear}
                    disabled={!hasImage}
                    className="flex-1 gap-1.5 min-h-touch-md"
                >
                    <Trash className="w-4 h-4" />
                    clear
                </Button>
                <Button
                    onClick={download}
                    disabled={!hasImage}
                    className="flex-1 gap-1.5 min-h-touch-md"
                >
                    {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {downloaded ? "done!" : "download"}
                </Button>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground/60 text-center">
                output: PNG • blur uses CSS filter, pixelate uses canvas
            </p>
        </motion.div>
    );
}
