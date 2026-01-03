"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadSimple, X, CaretDown, UploadSimple } from "@phosphor-icons/react";
import { THEME_COLORS } from "@/lib/colors";
import { ColorPicker } from "@/components/ui/color-picker";

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
type FontStyle = "normal" | "bold" | "italic";

const POSITIONS: { id: Position; label: string; icon: string }[] = [
    { id: "top-left", label: "Top Left", icon: "↖" },
    { id: "top-right", label: "Top Right", icon: "↗" },
    { id: "center", label: "Center", icon: "⊙" },
    { id: "bottom-left", label: "Bottom Left", icon: "↙" },
    { id: "bottom-right", label: "Bottom Right", icon: "↘" },
];

const FONTS = [
    { id: "sans-serif", label: "Sans" },
    { id: "serif", label: "Serif" },
    { id: "monospace", label: "Mono" },
    { id: "cursive", label: "Script" },
];

export function ImageWatermarker() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [text, setText] = useState("vxid.cc");
    const [position, setPosition] = useState<Position>("bottom-right");
    const [opacity, setOpacity] = useState(50);
    const [fontSize, setFontSize] = useState(24);
    const [color, setColor] = useState<string>(THEME_COLORS.white);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [fontFamily, setFontFamily] = useState("sans-serif");
    const [fontStyle, setFontStyle] = useState<FontStyle>("normal");
    const [rotation, setRotation] = useState(0);
    const [padding, setPadding] = useState(20);
    const [shadow, setShadow] = useState(true);
    const [repeat, setRepeat] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith("image/")) return;
        setFile(selectedFile);
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

    const getPositionCoords = (canvas: HTMLCanvasElement, textWidth: number, textHeight: number) => {
        switch (position) {
            case "top-left": return { x: padding, y: padding + textHeight };
            case "top-right": return { x: canvas.width - textWidth - padding, y: padding + textHeight };
            case "bottom-left": return { x: padding, y: canvas.height - padding };
            case "bottom-right": return { x: canvas.width - textWidth - padding, y: canvas.height - padding };
            case "center": return { x: (canvas.width - textWidth) / 2, y: canvas.height / 2 + textHeight / 2 };
            default: return { x: padding, y: canvas.height - padding };
        }
    };

    const getFontString = (size: number) => `${fontStyle === "italic" ? "italic " : ""}${fontStyle === "bold" ? "bold " : ""}${size}px ${fontFamily}`;

    const drawWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scale: number = 1) => {
        if (!text) return;
        const scaledFontSize = fontSize * scale;
        const scaledPadding = padding * scale;
        ctx.font = getFontString(scaledFontSize);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity / 100;

        if (shadow) {
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 4 * scale;
            ctx.shadowOffsetX = 1 * scale;
            ctx.shadowOffsetY = 1 * scale;
        }

        if (repeat) {
            // Tile the watermark
            const metrics = ctx.measureText(text);
            const spacingX = metrics.width + scaledPadding * 2;
            const spacingY = scaledFontSize + scaledPadding * 2;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            for (let y = -canvas.height; y < canvas.height * 2; y += spacingY) {
                for (let x = -canvas.width; x < canvas.width * 2; x += spacingX) {
                    ctx.fillText(text, x, y);
                }
            }
            ctx.restore();
        } else {
            const metrics = ctx.measureText(text);
            const { x, y } = getPositionCoords(canvas, metrics.width, scaledFontSize);

            ctx.save();
            ctx.translate(x + metrics.width / 2, y - scaledFontSize / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-(x + metrics.width / 2), -(y - scaledFontSize / 2));
            ctx.fillText(text, x, y);
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.shadowColor = "transparent";
    };

    useEffect(() => {
        if (!previewCanvasRef.current || !imageRef.current) return;
        const img = imageRef.current;
        const canvas = previewCanvasRef.current;
        const maxSize = 400;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawWatermark(ctx, canvas, scale);
    }, [text, position, opacity, fontSize, color, preview, fontFamily, fontStyle, rotation, padding, shadow, repeat]);

    const download = () => {
        if (!canvasRef.current || !imageRef.current || !file) return;
        const img = imageRef.current;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        drawWatermark(ctx, canvas, 1);
        const link = document.createElement("a");
        link.download = `${file.name.replace(/\.[^/.]+$/, "")}-watermarked.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const reset = () => { setFile(null); setPreview(null); };
    const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

    return (
        <motion.div className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />

            {/* Dropzone / Preview */}
            {!file ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 min-h-zone-lg cursor-pointer transition-colors ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                    <UploadSimple className="w-5 h-5 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">drop image or click to browse</p>
                </div>
            ) : (
                <div className="relative">
                    <button onClick={reset} className="absolute top-2 right-2 z-20 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"><X className="w-4 h-4" /></button>
                    <div className="w-full flex items-center justify-center bg-muted/30 rounded-lg p-2 border">
                        <canvas ref={previewCanvasRef} className="max-w-full max-h-32 object-contain rounded" />
                    </div>
                </div>
            )}

            {/* Watermark text - always visible */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">watermark text</p>
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter watermark text..." className="text-sm h-9" />
            </div>

            {/* Position - always visible */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">position</p>
                <div className="flex gap-1">
                    {POSITIONS.map((pos) => (
                        <button key={pos.id} onClick={() => setPosition(pos.id)} title={pos.label}
                            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${position === pos.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{pos.icon}</button>
                    ))}
                </div>
            </div>

            {/* Quick settings - always visible */}
            <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                    <p className="text-2xs text-muted-foreground">opacity %</p>
                    <Input type="number" min={10} max={100} value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value) || 50)} className="text-xs h-8 text-center" />
                </div>
                <div className="space-y-1">
                    <p className="text-2xs text-muted-foreground">size px</p>
                    <Input type="number" min={8} max={200} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 24)} className="text-xs h-8 text-center" />
                </div>
                <div className="space-y-1">
                    <p className="text-2xs text-muted-foreground">color</p>
                    <div className="h-8 flex items-center">
                        <ColorPicker color={color} onChange={setColor} />
                    </div>
                </div>
            </div>

            {/* Advanced options toggle */}
            <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
                advanced options <motion.div animate={{ rotate: showOptions ? 180 : 0 }} transition={transition}><CaretDown className="w-4 h-4" /></motion.div>
            </button>
            <AnimatePresence>
                {showOptions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="overflow-hidden">
                        <div className="space-y-3 pt-1">
                            {/* Font */}
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">font family</p>
                                <div className="flex gap-1">
                                    {FONTS.map(f => (
                                        <button key={f.id} onClick={() => setFontFamily(f.id)} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${fontFamily === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{f.label}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Style */}
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">font style</p>
                                <div className="flex gap-1">
                                    {(["normal", "bold", "italic"] as const).map(s => (
                                        <button key={s} onClick={() => setFontStyle(s)} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${fontStyle === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Rotation & Padding */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <p className="text-2xs text-muted-foreground">rotation °</p>
                                    <Input type="number" min={-180} max={180} value={rotation} onChange={(e) => setRotation(parseInt(e.target.value) || 0)} className="text-xs h-8 text-center" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xs text-muted-foreground">padding px</p>
                                    <Input type="number" min={0} max={100} value={padding} onChange={(e) => setPadding(parseInt(e.target.value) || 20)} className="text-xs h-8 text-center" />
                                </div>
                            </div>
                            {/* Toggles */}
                            <div className="flex gap-2">
                                <button onClick={() => setShadow(!shadow)} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${shadow ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>shadow {shadow ? "✓" : ""}</button>
                                <button onClick={() => setRepeat(!repeat)} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${repeat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>tile/repeat {repeat ? "✓" : ""}</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button onClick={download} disabled={!file} className="w-full gap-2"><DownloadSimple className="w-4 h-4" />add watermark & download</Button>
        </motion.div>
    );
}
