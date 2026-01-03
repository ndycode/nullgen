"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UploadSimple, Download, Check, Trash, ArrowClockwise, ArrowsHorizontal, ArrowsVertical } from "@phosphor-icons/react";

export function ImageRotate() {
    const [image, setImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
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
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
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
                const rad = (rotation * Math.PI) / 180;
                const sin = Math.abs(Math.sin(rad));
                const cos = Math.abs(Math.cos(rad));

                canvas.width = img.width * cos + img.height * sin;
                canvas.height = img.width * sin + img.height * cos;

                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(rad);
                ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);

                resolve(canvas.toDataURL("image/png"));
            };
        });
    }, [image, rotation, flipH, flipV]);

    const download = async () => {
        const result = await processImage();
        if (!result) return;

        const link = document.createElement("a");
        link.download = `rotated-${fileName}`;
        link.href = result;
        link.click();
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2000);
    };

    const clear = () => {
        setImage(null);
        setFileName("");
        setDownloaded(false);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
    };

    const rotate90 = () => setRotation((r) => (r + 90) % 360);
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
                            className="w-full h-40 object-contain transition-transform"
                            style={{
                                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                            }}
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
                {/* Quick actions */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={rotate90}
                        disabled={!hasImage}
                        className="flex flex-col items-center gap-1 py-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors min-h-touch-lg"
                    >
                        <ArrowClockwise className="w-5 h-5" />
                        <span className="text-xs">Rotate 90°</span>
                    </button>
                    <button
                        onClick={() => setFlipH(!flipH)}
                        disabled={!hasImage}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition-colors min-h-touch-lg ${flipH ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                            }`}
                    >
                        <ArrowsHorizontal className="w-5 h-5" />
                        <span className="text-xs">Flip H</span>
                    </button>
                    <button
                        onClick={() => setFlipV(!flipV)}
                        disabled={!hasImage}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition-colors min-h-touch-lg ${flipV ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                            }`}
                    >
                        <ArrowsVertical className="w-5 h-5" />
                        <span className="text-xs">Flip V</span>
                    </button>
                </div>

                {/* Rotation slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">rotation</span>
                        <span className="font-medium">{rotation}°</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={360}
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
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
                output: PNG • canvas size adjusts to fit rotation
            </p>
        </motion.div>
    );
}
