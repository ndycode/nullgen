"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DownloadSimple,
    ArrowClockwise,
    ArrowCounterClockwise,
    FlipHorizontal,
    FlipVertical,
    X,
    CaretDown,
    UploadSimple,
} from "@phosphor-icons/react";

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "9:16";
type OutputFormat = "png" | "jpeg" | "webp";

const ASPECT_RATIOS: { id: AspectRatio; label: string; value: number | null }[] = [
    { id: "free", label: "free", value: null },
    { id: "1:1", label: "1:1", value: 1 },
    { id: "4:3", label: "4:3", value: 4 / 3 },
    { id: "16:9", label: "16:9", value: 16 / 9 },
    { id: "3:2", label: "3:2", value: 3 / 2 },
    { id: "9:16", label: "9:16", value: 9 / 16 },
];

export function ImageCropper() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showOptions, setShowOptions] = useState(false);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
    const [quality, setQuality] = useState(90);
    const [customWidth, setCustomWidth] = useState("");
    const [customHeight, setCustomHeight] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith("image/")) return;
        setFile(selectedFile);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setCropArea({ x: 10, y: 10, width: 80, height: 80 });
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
            const img = new Image();
            img.onload = () => { imageRef.current = img; };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const rotate = (degrees: number) => setRotation((prev) => (prev + degrees + 360) % 360);

    const handleCropMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        e.stopPropagation();
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        if (x >= cropArea.x && x <= cropArea.x + cropArea.width && y >= cropArea.y && y <= cropArea.y + cropArea.height) {
            setIsDragging(true);
            setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
        }
    };

    const handleCropMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        let newX = Math.max(0, Math.min(100 - cropArea.width, x - dragStart.x));
        let newY = Math.max(0, Math.min(100 - cropArea.height, y - dragStart.y));
        setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    }, [isDragging, dragStart, cropArea.width, cropArea.height]);

    const handleCropMouseUp = () => setIsDragging(false);

    const download = () => {
        if (!preview || !canvasRef.current || !imageRef.current) return;
        const img = imageRef.current;
        const canvas = canvasRef.current;
        const cropX = (cropArea.x / 100) * img.width;
        const cropY = (cropArea.y / 100) * img.height;
        const cropW = (cropArea.width / 100) * img.width;
        const cropH = (cropArea.height / 100) * img.height;
        const outW = customWidth ? parseInt(customWidth) : cropW;
        const outH = customHeight ? parseInt(customHeight) : cropH;
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d")!;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
        ctx.restore();
        const link = document.createElement("a");
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "cropped";
        const mime = outputFormat === "jpeg" ? "image/jpeg" : outputFormat === "webp" ? "image/webp" : "image/png";
        link.download = `${baseName}-cropped.${outputFormat}`;
        link.href = canvas.toDataURL(mime, quality / 100);
        link.click();
    };

    const reset = () => { setFile(null); setPreview(null); setRotation(0); setFlipH(false); setFlipV(false); };
    const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

    return (
        <motion.div className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />

            {/* Dropzone / Preview */}
            {!file ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 min-h-[100px] cursor-pointer transition-colors ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                    <UploadSimple className="w-5 h-5 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">drop image or click to browse</p>
                </div>
            ) : (
                <div className="relative">
                    <button onClick={reset} className="absolute top-2 right-2 z-20 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"><X className="w-4 h-4" /></button>
                    <div
                        ref={containerRef}
                        className="relative w-full h-36 bg-muted/30 rounded-lg overflow-hidden cursor-move border"
                        onMouseDown={handleCropMouseDown}
                        onMouseMove={handleCropMouseMove}
                        onMouseUp={handleCropMouseUp}
                        onMouseLeave={handleCropMouseUp}
                    >
                        {preview && <img src={preview} alt="Preview" className="w-full h-full object-contain pointer-events-none" style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` }} draggable={false} />}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 bg-black/50" />
                            <div className="absolute border-2 border-primary" style={{ left: `${cropArea.x}%`, top: `${cropArea.y}%`, width: `${cropArea.width}%`, height: `${cropArea.height}%`, boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}>
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">{[...Array(9)].map((_, i) => <div key={i} className="border border-primary/30" />)}</div>
                                {/* Corner handles */}
                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-sm" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-sm" />
                                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-sm" />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Aspect ratio - always visible */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">aspect ratio</p>
                <div className="flex gap-1 flex-wrap">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button key={ratio.id} onClick={() => { setAspectRatio(ratio.id); if (ratio.value) setCropArea(prev => ({ ...prev, height: Math.min(prev.width / ratio.value!, 90) })); }}
                            className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${aspectRatio === ratio.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{ratio.label}</button>
                    ))}
                </div>
            </div>

            {/* Transform controls - always visible */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">transform</p>
                <div className="flex gap-1">
                    <button onClick={() => rotate(-90)} className="flex-1 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-1 text-xs"><ArrowCounterClockwise className="w-4 h-4" />-90°</button>
                    <button onClick={() => rotate(90)} className="flex-1 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-1 text-xs"><ArrowClockwise className="w-4 h-4" />+90°</button>
                    <button onClick={() => setFlipH(!flipH)} className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs ${flipH ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}><FlipHorizontal className="w-4 h-4" />H</button>
                    <button onClick={() => setFlipV(!flipV)} className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs ${flipV ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}><FlipVertical className="w-4 h-4" />V</button>
                </div>
            </div>

            {/* Output format - always visible */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>output format</span>
                    {outputFormat !== "png" && <span>quality: {quality}%</span>}
                </div>
                <div className="flex gap-1">
                    {(["png", "jpeg", "webp"] as const).map(f => (
                        <button key={f} onClick={() => setOutputFormat(f)} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${outputFormat === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{f.toUpperCase()}</button>
                    ))}
                </div>
            </div>

            {outputFormat !== "png" && (
                <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" />
            )}

            {/* Advanced options toggle */}
            <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
                resize output <motion.div animate={{ rotate: showOptions ? 180 : 0 }} transition={transition}><CaretDown className="w-4 h-4" /></motion.div>
            </button>
            <AnimatePresence>
                {showOptions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="overflow-hidden">
                        <div className="space-y-2 pt-1">
                            <p className="text-xs text-muted-foreground">custom dimensions (optional)</p>
                            <div className="flex gap-2">
                                <Input type="number" placeholder="width px" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} className="text-xs h-8" />
                                <Input type="number" placeholder="height px" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} className="text-xs h-8" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button onClick={download} disabled={!file} className="w-full gap-2"><DownloadSimple className="w-4 h-4" />crop & download</Button>
        </motion.div>
    );
}
