"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, Eyedropper, Trash, CaretDown, UploadSimple, DownloadSimple } from "@phosphor-icons/react";

interface ExtractedColor {
    hex: string;
    rgb: string;
    hsl: string;
}

type ColorFormat = "hex" | "rgb" | "hsl";

export function ColorFromImage() {
    const [preview, setPreview] = useState<string | null>(null);
    const [colors, setColors] = useState<ExtractedColor[]>([]);
    const [hoveredColor, setHoveredColor] = useState<ExtractedColor | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
    const [maxColors, setMaxColors] = useState(12);
    const [showPalette, setShowPalette] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setColors([]);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPreview(dataUrl);
            const img = new Image();
            img.onload = () => {
                imageRef.current = img;
                if (canvasRef.current) {
                    canvasRef.current.width = img.width;
                    canvasRef.current.height = img.height;
                    canvasRef.current.getContext("2d")!.drawImage(img, 0, 0);
                }
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const pickColor = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!canvasRef.current || !imageRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const scaleX = imageRef.current.width / rect.width;
        const scaleY = imageRef.current.height / rect.height;
        const imgX = Math.floor((e.clientX - rect.left) * scaleX);
        const imgY = Math.floor((e.clientY - rect.top) * scaleY);
        const pixel = canvasRef.current.getContext("2d")!.getImageData(imgX, imgY, 1, 1).data;
        const hex = `#${[pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, "0")).join("")}`;
        const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        const hsl = rgbToHsl(pixel[0], pixel[1], pixel[2]);
        setHoveredColor({ hex, rgb, hsl });
    }, []);

    const addColor = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (hoveredColor && !colors.some(c => c.hex === hoveredColor.hex) && colors.length < maxColors) {
            setColors(prev => [...prev, hoveredColor]);
        }
    };

    const removeColor = (hex: string) => setColors(prev => prev.filter(c => c.hex !== hex));
    const getColorValue = (color: ExtractedColor) => colorFormat === "rgb" ? color.rgb : colorFormat === "hsl" ? color.hsl : color.hex;

    const copyColor = async (color: ExtractedColor) => {
        await navigator.clipboard.writeText(getColorValue(color));
        setCopied(color.hex);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAllColors = async () => {
        const allColors = colors.map(c => getColorValue(c)).join("\n");
        await navigator.clipboard.writeText(allColors);
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    const exportPalette = () => {
        const css = `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${getColorValue(c)};`).join("\n")}\n}`;
        const blob = new Blob([css], { type: "text/css" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "palette.css";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => { setPreview(null); setColors([]); setHoveredColor(null); };
    const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

    return (
        <motion.div className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />

            {/* Dropzone - separate from image display */}
            {!preview ? (
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
                        className="w-full h-32 bg-muted/30 rounded-lg overflow-hidden cursor-crosshair border"
                        onClick={addColor}
                        onMouseMove={pickColor}
                        onMouseLeave={() => setHoveredColor(null)}
                    >
                        <img src={preview} alt="Preview" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                    </div>
                    {/* Color indicator tooltip */}
                    {hoveredColor && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-lg border">
                            <div className="w-5 h-5 rounded border shadow-inner" style={{ backgroundColor: hoveredColor.hex }} />
                            <span className="text-xs font-mono font-medium">{getColorValue(hoveredColor)}</span>
                            <span className="text-[10px] text-muted-foreground">click to add</span>
                        </div>
                    )}
                </div>
            )}

            {/* Format selector - always visible */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">output format</p>
                <div className="flex gap-1">
                    {(["hex", "rgb", "hsl"] as const).map(f => (
                        <button key={f} onClick={() => setColorFormat(f)} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${colorFormat === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{f.toUpperCase()}</button>
                    ))}
                </div>
            </div>

            {/* Options toggle */}
            <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
                settings <motion.div animate={{ rotate: showOptions ? 180 : 0 }} transition={transition}><CaretDown className="w-4 h-4" /></motion.div>
            </button>
            <AnimatePresence>
                {showOptions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="overflow-hidden">
                        <div className="space-y-3 pt-1">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground"><span>max colors</span><span>{maxColors}</span></div>
                                <input type="range" min={4} max={24} value={maxColors} onChange={(e) => setMaxColors(parseInt(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" />
                            </div>
                            <button onClick={() => setShowPalette(!showPalette)} className={`w-full py-1.5 text-xs rounded-lg transition-colors ${showPalette ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                show palette: {showPalette ? "on" : "off"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Picked colors palette */}
            {showPalette && colors.length > 0 && (
                <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{colors.length}/{maxColors} colors</span>
                        <div className="flex gap-2">
                            <button onClick={copyAllColors} className="hover:text-foreground flex items-center gap-1 transition-colors">
                                {copied === "all" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                                {copied === "all" ? "copied!" : "copy all"}
                            </button>
                            <button onClick={() => setColors([])} className="hover:text-foreground flex items-center gap-1 transition-colors"><Trash className="w-3 h-3" />clear</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {colors.map((color) => (
                            <motion.div key={color.hex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 p-1.5 bg-muted/30 border rounded-lg group">
                                <div className="w-6 h-6 rounded border shrink-0 shadow-inner" style={{ backgroundColor: color.hex }} />
                                <div className="flex-1 min-w-0"><p className="text-xs font-mono truncate">{getColorValue(color)}</p></div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => copyColor(color)} className="p-1 hover:bg-muted rounded transition-colors">
                                        {copied === color.hex ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                    </button>
                                    <button onClick={() => removeColor(color.hex)} className="p-1 hover:bg-muted rounded transition-colors"><X className="w-3 h-3 text-muted-foreground" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {colors.length >= 2 && (
                        <Button onClick={exportPalette} variant="outline" size="sm" className="w-full gap-2">
                            <DownloadSimple className="w-4 h-4" />export as CSS
                        </Button>
                    )}
                </motion.div>
            )}

            {preview && colors.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">hover over image and click to pick colors</p>
            )}
        </motion.div>
    );
}
