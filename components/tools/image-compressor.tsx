"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { CANVAS_COLORS } from "@/lib/colors";

export function ImageCompressor() {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [quality, setQuality] = useState(75);
    const [maxWidth, setMaxWidth] = useState<number | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('image/')
        );
        setFiles(prev => [...prev, ...droppedFiles]);
        setStatus(null);
        setStats(null);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(f =>
                f.type.startsWith('image/')
            );
            setFiles(prev => [...prev, ...selectedFiles]);
            setStatus(null);
            setStats(null);
        }
    };

    const clearFiles = () => {
        setFiles([]);
        setStatus(null);
        setStats(null);
        setProgress(0);
    };

    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;

                if (maxWidth && w > maxWidth) {
                    h = Math.round(h * (maxWidth / w));
                    w = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = CANVAS_COLORS.jpegBackground;
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);

                canvas.toBlob(
                    blob => blob ? resolve(blob) : reject(new Error('Failed')),
                    'image/jpeg',
                    quality / 100
                );
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(file);
        });
    };

    const processImages = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setProgress(0);
        setStatus(null);
        setStats(null);

        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        let totalOriginal = 0;
        let totalCompressed = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            totalOriginal += file.size;
            try {
                const blob = await compressImage(file);
                totalCompressed += blob.size;
                const name = file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg';
                zip.file(name, blob);
            } catch (err) {
                console.error(`Error processing ${file.name}:`, err);
            }
            setProgress(((i + 1) / files.length) * 100);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${Date.now()}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        setProcessing(false);
        setStatus(`✓ ${files.length} images compressed`);
        setStats({ original: totalOriginal, compressed: totalCompressed });
        setFiles([]);
        setProgress(0);
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' b';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' kb';
        return (bytes / (1024 * 1024)).toFixed(2) + ' mb';
    };

    const presets = [
        { label: 'web', value: 85 },
        { label: 'email', value: 70 },
        { label: 'max', value: 50 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
        >
            {/* Drop zone */}
            <motion.div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="border-2 border-dashed border-border rounded-xl p-4 min-h-[100px] text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center"
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <UploadSimple className="w-5 h-5 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">
                    {files.length > 0
                        ? `${files.length} image${files.length > 1 ? 's' : ''} selected`
                        : 'drop images or click to browse'
                    }
                </p>
            </motion.div>

            {/* File list */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2"
                    >
                        {files.slice(0, 5).map((file, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                                {file.name.slice(0, 15)}...
                            </span>
                        ))}
                        {files.length > 5 && (
                            <span className="text-xs text-muted-foreground">
                                +{files.length - 5} more
                            </span>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); clearFiles(); }}
                            className="text-xs text-destructive hover:underline"
                        >
                            clear
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Presets */}
            <div className="flex gap-2">
                {presets.map((preset) => (
                    <motion.button
                        key={preset.label}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setQuality(preset.value)}
                        className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${quality === preset.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                    >
                        {preset.label} ({preset.value}%)
                    </motion.button>
                ))}
            </div>

            {/* Settings */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">quality</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="w-24 accent-primary"
                        />
                        <span className="text-xs w-10">{quality}%</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">max width (px)</span>
                    <Input
                        type="number"
                        placeholder="no limit"
                        value={maxWidth || ''}
                        onChange={(e) => setMaxWidth(e.target.value ? Number(e.target.value) : null)}
                        className="w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </div>

            {/* Progress bar */}
            <AnimatePresence>
                {processing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-2 bg-muted rounded-full overflow-hidden"
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-primary"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <AnimatePresence>
                {stats && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-3 gap-2 text-center"
                    >
                        <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">original</p>
                            <p className="text-sm font-medium">{formatSize(stats.original)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">compressed</p>
                            <p className="text-sm font-medium">{formatSize(stats.compressed)}</p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">saved</p>
                            <p className="text-sm font-medium text-primary">
                                {Math.round((1 - stats.compressed / stats.original) * 100)}%
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Process button */}
            <Button
                onClick={processImages}
                disabled={files.length === 0 || processing}
                className="w-full"
            >
                <DownloadSimple className="w-4 h-4 mr-2" />
                {processing ? `compressing... ${Math.round(progress)}%` : 'compress & download zip'}
            </Button>

            {/* Status */}
            <AnimatePresence>
                {status && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-center text-primary"
                    >
                        {status}
                    </motion.p>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
