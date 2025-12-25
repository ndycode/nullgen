"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadSimple, X, CaretDown, UploadSimple, GridFour } from "@phosphor-icons/react";
import JSZip from "jszip";

type GridSize = "2x2" | "3x3" | "2x3" | "3x2" | "1x3" | "3x1";
type OutputFormat = "png" | "jpeg" | "webp";

const GRIDS: { id: GridSize; label: string; cols: number; rows: number }[] = [
    { id: "2x2", label: "2×2", cols: 2, rows: 2 },
    { id: "3x3", label: "3×3", cols: 3, rows: 3 },
    { id: "2x3", label: "2×3", cols: 2, rows: 3 },
    { id: "3x2", label: "3×2", cols: 3, rows: 2 },
    { id: "1x3", label: "1×3", cols: 1, rows: 3 },
    { id: "3x1", label: "3×1", cols: 3, rows: 1 },
];

export function ImageSplitter() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [grid, setGrid] = useState<GridSize>("3x3");
    const [isDragOver, setIsDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
    const [quality, setQuality] = useState(90);
    const [customCols, setCustomCols] = useState("");
    const [customRows, setCustomRows] = useState("");
    const [filePrefix, setFilePrefix] = useState("");
    const [startIndex, setStartIndex] = useState(1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith("image/")) return;
        setFile(selectedFile);
        setFilePrefix(selectedFile.name.replace(/\.[^/.]+$/, ""));
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

    const getGridDimensions = () => {
        if (customCols && customRows) {
            return { cols: Math.max(1, Math.min(10, parseInt(customCols) || 3)), rows: Math.max(1, Math.min(10, parseInt(customRows) || 3)) };
        }
        return GRIDS.find(g => g.id === grid)!;
    };

    const selectedGrid = getGridDimensions();

    const download = async () => {
        if (!canvasRef.current || !imageRef.current || !file) return;
        setProcessing(true);

        try {
            const img = imageRef.current;
            const canvas = canvasRef.current;
            const { cols, rows } = selectedGrid;
            const tileW = Math.floor(img.width / cols);
            const tileH = Math.floor(img.height / rows);
            canvas.width = tileW;
            canvas.height = tileH;
            const ctx = canvas.getContext("2d")!;
            const zip = new JSZip();
            const baseName = filePrefix || "tile";
            const mime = outputFormat === "jpeg" ? "image/jpeg" : outputFormat === "webp" ? "image/webp" : "image/png";

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    ctx.clearRect(0, 0, tileW, tileH);
                    ctx.drawImage(img, col * tileW, row * tileH, tileW, tileH, 0, 0, tileW, tileH);
                    const dataUrl = canvas.toDataURL(mime, quality / 100);
                    const data = dataUrl.split(",")[1];
                    const index = row * cols + col + startIndex;
                    zip.file(`${baseName}-${index.toString().padStart(2, "0")}.${outputFormat}`, data, { base64: true });
                }
            }

            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `${baseName}-split-${cols}x${rows}.zip`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            setProcessing(false);
        }
    };

    const reset = () => { setFile(null); setPreview(null); setFilePrefix(""); };
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
                <div className="relative h-32 bg-muted/30 rounded-lg overflow-hidden border">
                    <button onClick={reset} className="absolute top-2 right-2 z-20 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"><X className="w-4 h-4" /></button>
                    {preview && <img src={preview} alt="Preview" className="w-full h-full object-contain" />}
                    {/* Grid overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-[75%] h-[75%]" style={{ display: "grid", gridTemplateColumns: `repeat(${selectedGrid.cols}, 1fr)`, gridTemplateRows: `repeat(${selectedGrid.rows}, 1fr)` }}>
                            {Array.from({ length: selectedGrid.cols * selectedGrid.rows }).map((_, i) => (
                                <div key={i} className="border border-primary/70 flex items-center justify-center bg-black/20">
                                    <span className="text-[10px] text-white font-bold drop-shadow-lg">{i + startIndex}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Grid size presets - always visible */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">grid size</p>
                <div className="grid grid-cols-3 gap-1">
                    {GRIDS.map((g) => (
                        <button key={g.id} onClick={() => { setGrid(g.id); setCustomCols(""); setCustomRows(""); }}
                            className={`py-1.5 text-xs rounded-lg transition-colors ${grid === g.id && !customCols ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{g.label}</button>
                    ))}
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
                advanced options <motion.div animate={{ rotate: showOptions ? 180 : 0 }} transition={transition}><CaretDown className="w-4 h-4" /></motion.div>
            </button>
            <AnimatePresence>
                {showOptions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="overflow-hidden">
                        <div className="space-y-3 pt-1">
                            {/* Custom grid */}
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">custom grid (1-10)</p>
                                <div className="flex gap-2">
                                    <Input type="number" placeholder="columns" min={1} max={10} value={customCols} onChange={(e) => setCustomCols(e.target.value)} className="text-xs h-8 text-center" />
                                    <Input type="number" placeholder="rows" min={1} max={10} value={customRows} onChange={(e) => setCustomRows(e.target.value)} className="text-xs h-8 text-center" />
                                </div>
                            </div>
                            {/* File naming */}
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">file prefix</p>
                                <Input type="text" placeholder="tile" value={filePrefix} onChange={(e) => setFilePrefix(e.target.value)} className="text-xs h-8" />
                            </div>
                            {/* Start index */}
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">start numbering from</p>
                                <div className="flex gap-1">
                                    {[0, 1].map(n => (
                                        <button key={n} onClick={() => setStartIndex(n)} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${startIndex === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{n}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info */}
            <div className="text-xs text-muted-foreground text-center py-1">
                {selectedGrid.cols * selectedGrid.rows} tiles{imageRef.current ? ` • ${Math.floor(imageRef.current.width / selectedGrid.cols)}×${Math.floor(imageRef.current.height / selectedGrid.rows)}px each` : ""}
            </div>

            <Button onClick={download} disabled={!file || processing} className="w-full gap-2">
                <DownloadSimple className="w-4 h-4" />{processing ? "processing..." : "split & download zip"}
            </Button>
        </motion.div>
    );
}
