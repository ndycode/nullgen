"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UploadSimple, Download, Check, Trash, ArrowClockwise } from "@phosphor-icons/react";

const FILTERS = [
    { id: "none", name: "None", filter: "" },
    { id: "grayscale", name: "Grayscale", filter: "grayscale(100%)" },
    { id: "sepia", name: "Sepia", filter: "sepia(100%)" },
    { id: "invert", name: "Invert", filter: "invert(100%)" },
    { id: "saturate", name: "Saturate", filter: "saturate(200%)" },
    { id: "desaturate", name: "Desaturate", filter: "saturate(50%)" },
    { id: "contrast", name: "High Contrast", filter: "contrast(150%)" },
    { id: "brightness", name: "Brighten", filter: "brightness(130%)" },
    { id: "darken", name: "Darken", filter: "brightness(70%)" },
    { id: "vintage", name: "Vintage", filter: "sepia(50%) contrast(90%) brightness(90%)" },
    { id: "cold", name: "Cold", filter: "hue-rotate(180deg) saturate(80%)" },
    { id: "warm", name: "Warm", filter: "sepia(30%) saturate(120%)" },
];

export function ImageFilter() {
    const [image, setImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("none");
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
        setSelectedFilter("none");
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

        const filter = FILTERS.find(f => f.id === selectedFilter)?.filter || "";

        return new Promise<string>((resolve) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.filter = filter || "none";
                ctx.drawImage(img, 0, 0);
                ctx.filter = "none";
                resolve(canvas.toDataURL("image/png"));
            };
        });
    }, [image, selectedFilter]);

    const download = async () => {
        const result = await processImage();
        if (!result) return;

        const link = document.createElement("a");
        link.download = `filtered-${fileName}`;
        link.href = result;
        link.click();
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2000);
    };

    const clear = () => {
        setImage(null);
        setFileName("");
        setDownloaded(false);
        setSelectedFilter("none");
    };

    const currentFilter = FILTERS.find(f => f.id === selectedFilter)?.filter || "";
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
                            className="w-full h-40 object-contain transition-all"
                            style={{ filter: currentFilter }}
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

            {/* Filter Grid - Always visible */}
            <div className={`space-y-2 ${!hasImage ? "opacity-50 pointer-events-none" : ""}`}>
                <p className="text-xs text-muted-foreground">filters</p>
                <div className="grid grid-cols-4 gap-1.5">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => hasImage && setSelectedFilter(filter.id)}
                            disabled={!hasImage}
                            className={`p-1.5 text-xs rounded-lg transition-colors min-h-touch-xs ${selectedFilter === filter.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            {filter.name}
                        </button>
                    ))}
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
                    <ArrowClockwise className="w-4 h-4" />
                    reset
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
                output: PNG • filters applied via CSS
            </p>
        </motion.div>
    );
}
