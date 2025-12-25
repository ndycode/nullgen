"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadSimple, UploadSimple, Link as LinkIcon, LinkBreak } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { CANVAS_COLORS } from "@/lib/colors";

interface Preset {
    label: string;
    width: number;
    height: number;
}

const PRESETS: Preset[] = [
    { label: 'fhd', width: 1920, height: 1080 },
    { label: 'hd', width: 1280, height: 720 },
    { label: 'ig square', width: 1080, height: 1080 },
    { label: 'fb post', width: 1200, height: 630 },
    { label: 'twitter', width: 1500, height: 500 },
    { label: 'thumb', width: 400, height: 400 },
];

export function BulkResizer() {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);
    const [lockRatio, setLockRatio] = useState(true);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('image/')
        );
        setFiles(prev => [...prev, ...droppedFiles]);
        setStatus(null);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(f =>
                f.type.startsWith('image/')
            );
            setFiles(prev => [...prev, ...selectedFiles]);
            setStatus(null);
        }
    };

    const clearFiles = () => {
        setFiles([]);
        setStatus(null);
        setProgress(0);
    };

    const selectPreset = (preset: Preset) => {
        setSelectedPreset(preset.label);
        setWidth(preset.width);
        setHeight(preset.height);
    };

    const resizeImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let w = width || img.width;
                let h = height || img.height;

                if (lockRatio) {
                    if (width && !height) {
                        h = Math.round(img.height * (width / img.width));
                    } else if (height && !width) {
                        w = Math.round(img.width * (height / img.height));
                    } else if (width && height) {
                        const ratio = Math.min(width / img.width, height / img.height);
                        w = Math.round(img.width * ratio);
                        h = Math.round(img.height * ratio);
                    }
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
                    0.9
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

        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const blob = await resizeImage(file);
                const name = file.name.replace(/\.[^/.]+$/, '') + '_resized.jpg';
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
        link.download = `resized_${Date.now()}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        setProcessing(false);
        setStatus(`✓ ${files.length} images resized`);
        setFiles([]);
        setProgress(0);
    };

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
                        {files.slice(0, 4).map((file, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                                {file.name.slice(0, 12)}...
                            </span>
                        ))}
                        {files.length > 4 && (
                            <span className="text-xs text-muted-foreground">
                                +{files.length - 4} more
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
            <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                    <motion.button
                        key={preset.label}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectPreset(preset)}
                        className={`py-2 rounded-lg border text-xs transition-colors ${selectedPreset === preset.label
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                    >
                        {preset.label}
                    </motion.button>
                ))}
            </div>

            {/* Custom dimensions */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">width (px)</label>
                    <Input
                        type="number"
                        placeholder="auto"
                        value={width || ''}
                        onChange={(e) => {
                            setWidth(e.target.value ? Number(e.target.value) : null);
                            setSelectedPreset(null);
                        }}
                        className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setLockRatio(!lockRatio)}
                    className={`mt-4 p-2 rounded-lg border transition-colors ${lockRatio
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                        }`}
                >
                    {lockRatio ? <LinkIcon className="w-4 h-4" /> : <LinkBreak className="w-4 h-4" />}
                </motion.button>

                <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">height (px)</label>
                    <Input
                        type="number"
                        placeholder="auto"
                        value={height || ''}
                        onChange={(e) => {
                            setHeight(e.target.value ? Number(e.target.value) : null);
                            setSelectedPreset(null);
                        }}
                        className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

            {/* Process button */}
            <Button
                onClick={processImages}
                disabled={files.length === 0 || processing}
                className="w-full"
            >
                <DownloadSimple className="w-4 h-4 mr-2" />
                {processing ? `resizing... ${Math.round(progress)}%` : 'resize & download zip'}
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
