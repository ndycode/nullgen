"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadSimple, UploadSimple, ShieldCheck, Shuffle, Crop } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { CANVAS_COLORS } from "@/lib/colors";

interface DeviceData {
    make: string;
    model: string;
    software: string;
    lens: string;
}

const DEVICE_DATA: DeviceData[] = [
    { make: 'Apple', model: 'iPhone 15 Pro Max', software: 'iOS 17.2', lens: 'iPhone 15 Pro Max back triple camera 6.765mm f/1.78' },
    { make: 'Apple', model: 'iPhone 14 Pro', software: 'iOS 16.6', lens: 'iPhone 14 Pro back triple camera 6.86mm f/1.78' },
    { make: 'Samsung', model: 'SM-S928B', software: 'S928BXXU1AWL1', lens: 'Samsung S928B' },
    { make: 'Google', model: 'Pixel 8 Pro', software: 'AP2A.240805.005', lens: 'Pixel 8 Pro back camera 6.9mm f/1.68' },
    { make: 'Xiaomi', model: '2312DRA50G', software: 'V14.0.8.0.TLGMIXM', lens: 'Xiaomi 13T Pro' },
    { make: 'OnePlus', model: 'CPH2449', software: 'CPH2449_13.1.0.582', lens: 'OnePlus 11 5G' }
];

const PIEXIF_SRC = "https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/piexif.min.js";
const PIEXIF_INTEGRITY = "sha384-gLhg+4HrK9u/j3lhoXMbfugBBxOP2bNlOeGEWvf5QIEDD1qXDMMCU6ruAB2rUN/a";

function loadPiexifScript(timeoutMs = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("window unavailable"));
            return;
        }

        const existing = document.querySelector(`script[src="${PIEXIF_SRC}"]`);
        if (existing) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = PIEXIF_SRC;
        script.integrity = PIEXIF_INTEGRITY;
        script.crossOrigin = "anonymous";

        const timer = window.setTimeout(() => {
            script.remove();
            reject(new Error("piexif load timeout"));
        }, timeoutMs);

        script.onload = () => {
            window.clearTimeout(timer);
            resolve();
        };
        script.onerror = () => {
            window.clearTimeout(timer);
            script.remove();
            reject(new Error("piexif load failed"));
        };

        document.head.appendChild(script);
    });
}

export function PrivacyStripper() {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [quality, setQuality] = useState(90);
    const [randomExif, setRandomExif] = useState(false);
    const [safetyCrop, setSafetyCrop] = useState(false);
    const [antiHash, setAntiHash] = useState(true);
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

    const stripExif = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

                // Safety crop (1-5%)
                if (safetyCrop) {
                    const cropPercent = (Math.floor(Math.random() * 4) + 1) / 100;
                    const cropW = Math.floor(img.width * cropPercent);
                    const cropH = Math.floor(img.height * cropPercent);
                    sx = Math.floor(Math.random() * cropW);
                    sy = Math.floor(Math.random() * cropH);
                    sWidth = img.width - cropW;
                    sHeight = img.height - cropH;
                }

                const canvas = document.createElement('canvas');
                canvas.width = sWidth;
                canvas.height = sHeight;
                const ctx = canvas.getContext('2d')!;

                ctx.fillStyle = CANVAS_COLORS.jpegBackground;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

                // Anti-hash pixel noise
                if (antiHash) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const pixelsToModify = Math.floor(data.length / 4 * 0.001);
                    for (let i = 0; i < pixelsToModify; i++) {
                        const px = Math.floor(Math.random() * (data.length / 4)) * 4;
                        const ch = Math.floor(Math.random() * 3);
                        data[px + ch] = Math.max(0, Math.min(255, data[px + ch] + (Math.random() > 0.5 ? 1 : -1)));
                    }
                    ctx.putImageData(imageData, 0, 0);
                }

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

    const injectRandomExif = async (blob: Blob): Promise<Blob> => {
        // @ts-ignore - piexifjs doesn't have types
        if (typeof window.piexif === 'undefined') return blob;

        try {
            const dataUrl = await blobToDataUrl(blob);
            const device = DEVICE_DATA[Math.floor(Math.random() * DEVICE_DATA.length)];

            const now = new Date();
            const randomDays = Math.floor(Math.random() * 60);
            const randomHours = Math.floor(Math.random() * 14) + 7;
            const photoDate = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
            photoDate.setHours(randomHours, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
            const dateStr = photoDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '').replace(/-/g, ':');
            const uniqueId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

            // @ts-ignore
            const piexif = window.piexif;
            const exifObj = {
                "0th": {
                    [piexif.ImageIFD.Make]: device.make,
                    [piexif.ImageIFD.Model]: device.model,
                    [piexif.ImageIFD.Software]: device.software,
                    [piexif.ImageIFD.DateTime]: dateStr,
                    [piexif.ImageIFD.Orientation]: 1
                },
                "Exif": {
                    [piexif.ExifIFD.DateTimeOriginal]: dateStr,
                    [piexif.ExifIFD.DateTimeDigitized]: dateStr,
                    [piexif.ExifIFD.ImageUniqueID]: uniqueId
                }
            };

            const exifBytes = piexif.dump(exifObj);
            const newDataUrl = piexif.insert(exifBytes, dataUrl);
            return dataUrlToBlob(newDataUrl);
        } catch (err) {
            console.error('EXIF injection failed:', err);
            return blob;
        }
    };

    const processImages = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setProgress(0);
        setStatus(null);

        // Dynamically load piexifjs if needed
        if (randomExif && typeof window !== "undefined" && !(window as any).piexif) {
            try {
                await loadPiexifScript();
            } catch (err) {
                setProcessing(false);
                setStatus("Failed to load EXIF tools");
                return;
            }
        }

        // Load JSZip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                let blob = await stripExif(file);
                if (randomExif) {
                    blob = await injectRandomExif(blob);
                }
                const name = file.name.replace(/\.[^/.]+$/, '') + '_clean.jpg';
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
        link.download = `privacy_stripped_${Date.now()}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        setProcessing(false);
        setStatus(`✓ ${files.length} images processed`);
        setFiles([]);
        setProgress(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
        >
            {/* Drop zone */}
            <motion.div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="border-2 border-dashed border-border rounded-xl p-4 min-h-zone-lg text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center"
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

            {/* Settings */}
            <div className="space-y-3">
                {/* Quality slider */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">quality</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="50"
                            max="100"
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="w-24 accent-primary"
                        />
                        <span className="text-xs w-10">{quality}%</span>
                    </div>
                </div>

                {/* Toggle options */}
                <div className="grid grid-cols-3 gap-2">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAntiHash(!antiHash)}
                        className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${antiHash
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        anti-hash
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRandomExif(!randomExif)}
                        className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${randomExif
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                    >
                        <Shuffle className="w-4 h-4" />
                        fake exif
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSafetyCrop(!safetyCrop)}
                        className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-colors ${safetyCrop
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                    >
                        <Crop className="w-4 h-4" />
                        rand crop
                    </motion.button>
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
                {processing ? `processing... ${Math.round(progress)}%` : 'strip & download zip'}
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

// Utilities
function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
}
