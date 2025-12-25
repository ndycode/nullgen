"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UploadSimple, Download, Check, CaretDown, Trash, ArrowClockwise, ArrowsHorizontal, ArrowsVertical } from "@phosphor-icons/react";

export function ImageRotate() {
    const [image, setImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
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
                            className="w-full h-40 object-contain transition-transform"
                            style={{
                                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                            }}
                        />
                        <button
                            onClick={clear}
                            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-lg hover:bg-background"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={rotate90}
                            className="flex flex-col items-center gap-1 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                            <ArrowClockwise className="w-5 h-5" />
                            <span className="text-xs">Rotate 90°</span>
                        </button>
                        <button
                            onClick={() => setFlipH(!flipH)}
                            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${flipH ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                                }`}
                        >
                            <ArrowsHorizontal className="w-5 h-5" />
                            <span className="text-xs">Flip H</span>
                        </button>
                        <button
                            onClick={() => setFlipV(!flipV)}
                            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${flipV ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                                }`}
                        >
                            <ArrowsVertical className="w-5 h-5" />
                            <span className="text-xs">Flip V</span>
                        </button>
                    </div>

                    {/* Rotation slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Rotation</span>
                            <span className="font-medium">{rotation}°</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
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
                                <p>Canvas size adjusts to fit rotated image</p>
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
