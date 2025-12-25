"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UploadSimple, Download, Check, CaretDown, Trash } from "@phosphor-icons/react";

export function ImageBlur() {
    const [image, setImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [blurAmount, setBlurAmount] = useState(10);
    const [pixelate, setPixelate] = useState(false);
    const [pixelSize, setPixelSize] = useState(10);
    const [downloaded, setDownloaded] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
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

            {!image ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                    <UploadSimple className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drop image or click to upload</p>
                </div>
            ) : (
                <>
                    {/* Preview */}
                    <div className="relative rounded-lg overflow-hidden bg-muted/50">
                        <img
                            src={image}
                            alt="Preview"
                            className="w-full h-40 object-contain"
                            style={{ filter: pixelate ? "none" : `blur(${blurAmount / 3}px)` }}
                        />
                        <button
                            onClick={clear}
                            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-lg hover:bg-background"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPixelate(false)}
                            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${!pixelate ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                                }`}
                        >
                            Blur
                        </button>
                        <button
                            onClick={() => setPixelate(true)}
                            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${pixelate ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                                }`}
                        >
                            Pixelate
                        </button>
                    </div>

                    {/* Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{pixelate ? "Pixel size" : "Blur amount"}</span>
                            <span className="font-medium">{pixelate ? pixelSize : blurAmount}px</span>
                        </div>
                        <input
                            type="range"
                            min={pixelate ? 2 : 1}
                            max={pixelate ? 50 : 50}
                            value={pixelate ? pixelSize : blurAmount}
                            onChange={(e) => pixelate ? setPixelSize(Number(e.target.value)) : setBlurAmount(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    {/* Options */}
                    <div>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                        >
                            Options
                            <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                                <CaretDown className="w-4 h-4" />
                            </motion.div>
                        </button>
                        {showOptions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="text-xs text-muted-foreground overflow-hidden"
                            >
                                <p>Output: PNG format</p>
                                <p>Blur uses CSS filter, pixelate uses canvas</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Download */}
                    <Button onClick={download} className="w-full gap-1.5">
                        {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        {downloaded ? "Downloaded!" : "Download"}
                    </Button>
                </>
            )}
        </motion.div>
    );
}
