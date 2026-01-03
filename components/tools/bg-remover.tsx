"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DownloadSimple, UploadSimple, Spinner, Trash } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { CANVAS_COLORS } from "@/lib/colors";

export function BackgroundRemover() {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setImage(e.target?.result as string);
        reader.readAsDataURL(file);

        setError(null);
        setResult(null);
        setLoading(true);
        setProgress(0);
        setStatus("Loading AI model...");

        try {
            // Dynamic import to avoid SSR issues
            const { removeBackground } = await import("@imgly/background-removal");

            setStatus("Processing image...");

            const blob = await removeBackground(file, {
                progress: (key: string, current: number, total: number) => {
                    if (key === "compute:inference") {
                        setStatus("Removing background...");
                        if (total > 0) {
                            setProgress(Math.round((current / total) * 100));
                        }
                    } else if (key === "fetch:inference") {
                        setStatus("Downloading AI model (first time only)...");
                        if (total > 0) {
                            setProgress(Math.round((current / total) * 50));
                        }
                    }
                }
            });

            setProgress(100);
            setStatus("Done!");
            const url = URL.createObjectURL(blob);
            setResult(url);
        } catch (err) {
            console.error(err);
            setError("Failed. Try a smaller image or different browser.");
        } finally {
            setLoading(false);
        }
    };

    const download = () => {
        if (!result) return;
        const link = document.createElement("a");
        link.download = "no-bg.png";
        link.href = result;
        link.click();
    };

    const reset = () => {
        setImage(null);
        setResult(null);
        setError(null);
        setProgress(0);
        setStatus("");
        if (inputRef.current) inputRef.current.value = "";
    };

    const hasImage = !!image;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
            />

            {/* Before/After comparison - Always visible */}
            <div className="grid grid-cols-2 gap-2">
                {/* Before */}
                <div className="relative">
                    <p className="text-xs text-muted-foreground mb-1">before</p>
                    <div
                        onClick={() => !hasImage && inputRef.current?.click()}
                        className={`w-full aspect-square rounded-lg overflow-hidden ${hasImage
                                ? "bg-muted/30"
                                : "border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer flex items-center justify-center"
                            }`}
                    >
                        {hasImage ? (
                            <motion.img
                                src={image}
                                alt="Original"
                                className="w-full h-full object-contain"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            />
                        ) : (
                            <div className="text-center p-2">
                                <UploadSimple className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">upload</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* After */}
                <div className="relative">
                    <p className="text-xs text-muted-foreground mb-1">after</p>
                    <div
                        className={`w-full aspect-square rounded-lg flex items-center justify-center overflow-hidden ${hasImage ? "" : "bg-muted/30"
                            }`}
                        style={{
                            background: result
                                ? `repeating-conic-gradient(${CANVAS_COLORS.transparencyChecker} 0% 25%, transparent 0% 50%) 50% / 16px 16px`
                                : hasImage ? undefined : undefined
                        }}
                    >
                        {loading ? (
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Spinner className="w-6 h-6 mx-auto animate-spin text-primary" />
                                <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
                            </motion.div>
                        ) : result ? (
                            <motion.img
                                src={result}
                                alt="Result"
                                className="w-full h-full object-contain"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center ${hasImage ? "bg-muted/50" : ""}`}>
                                <p className="text-xs text-muted-foreground/60">
                                    {hasImage ? "processing..." : "result"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress bar with status */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        className="space-y-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground/70 text-center">{status}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        className="text-sm text-destructive text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Actions - Always visible */}
            <div className={`flex gap-2 ${!hasImage ? "opacity-50 pointer-events-none" : ""}`}>
                <Button
                    variant="outline"
                    onClick={reset}
                    disabled={!hasImage}
                    className="flex-1 gap-2 min-h-touch-md"
                >
                    <Trash className="w-4 h-4" />
                    Reset
                </Button>
                <Button
                    onClick={download}
                    disabled={!result}
                    className="flex-1 gap-2 min-h-touch-md"
                >
                    <DownloadSimple className="w-4 h-4" />
                    Download
                </Button>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground/60 text-center">
                AI runs in your browser • first use downloads ~5MB model
            </p>
        </motion.div>
    );
}
