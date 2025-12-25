"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, CaretDown, DownloadSimple, UploadSimple, FileCode } from "@phosphor-icons/react";

interface OptimizeOptions {
    removeComments: boolean;
    removeMetadata: boolean;
    removeEmptyAttrs: boolean;
    minifyIds: boolean;
    removeDimensions: boolean;
    removeUselessDefs: boolean;
    removeXMLNS: boolean;
    prettify: boolean;
}

export function SvgOptimizer() {
    const [file, setFile] = useState<File | null>(null);
    const [originalSvg, setOriginalSvg] = useState("");
    const [optimizedSvg, setOptimizedSvg] = useState("");
    const [copied, setCopied] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [options, setOptions] = useState<OptimizeOptions>({
        removeComments: true,
        removeMetadata: true,
        removeEmptyAttrs: true,
        minifyIds: false,
        removeDimensions: false,
        removeUselessDefs: true,
        removeXMLNS: false,
        prettify: false,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (selectedFile: File) => {
        if (!selectedFile.name.endsWith(".svg")) return;
        setFile(selectedFile);
        const text = await selectedFile.text();
        setOriginalSvg(text);
        optimizeSvg(text, options);
    };

    const optimizeSvg = (svg: string, opts: OptimizeOptions) => {
        let result = svg;
        // Remove XML declaration
        result = result.replace(/<\?xml[^?]*\?>/gi, "");
        // Remove comments
        if (opts.removeComments) result = result.replace(/<!--[\s\S]*?-->/g, "");
        // Remove metadata
        if (opts.removeMetadata) {
            result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
            result = result.replace(/<title[\s\S]*?<\/title>/gi, "");
            result = result.replace(/<desc[\s\S]*?<\/desc>/gi, "");
        }
        // Remove empty attributes
        if (opts.removeEmptyAttrs) result = result.replace(/\s+[a-zA-Z-]+=""/g, "");
        // Remove dimensions
        if (opts.removeDimensions) {
            result = result.replace(/\s+width="[^"]*"/gi, "");
            result = result.replace(/\s+height="[^"]*"/gi, "");
        }
        // Remove useless defs
        if (opts.removeUselessDefs) result = result.replace(/<defs>\s*<\/defs>/gi, "");
        // Remove xlink xmlns
        if (opts.removeXMLNS) result = result.replace(/\s+xmlns:xlink="[^"]*"/gi, "");
        // Minify IDs
        if (opts.minifyIds) {
            let idCounter = 0;
            const idMap = new Map<string, string>();
            const idMatches = result.matchAll(/id="([^"]+)"/g);
            for (const match of idMatches) {
                if (!idMap.has(match[1])) idMap.set(match[1], `a${idCounter++}`);
            }
            idMap.forEach((newId, oldId) => {
                result = result.replace(new RegExp(`id="${oldId}"`, "g"), `id="${newId}"`);
                result = result.replace(new RegExp(`#${oldId}`, "g"), `#${newId}`);
                result = result.replace(new RegExp(`url\\(#${oldId}\\)`, "g"), `url(#${newId})`);
            });
        }
        // Minify whitespace
        if (!opts.prettify) {
            result = result.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
        } else {
            // Basic prettify
            result = result.replace(/></g, ">\n<").trim();
        }
        setOptimizedSvg(result);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const toggleOption = (key: keyof OptimizeOptions) => {
        const newOptions = { ...options, [key]: !options[key] };
        setOptions(newOptions);
        if (originalSvg) optimizeSvg(originalSvg, newOptions);
    };

    const copy = async () => {
        if (!optimizedSvg) return;
        await navigator.clipboard.writeText(optimizedSvg);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const download = () => {
        if (!optimizedSvg || !file) return;
        const blob = new Blob([optimizedSvg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${file.name.replace(/\.svg$/i, "")}-optimized.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => { setFile(null); setOriginalSvg(""); setOptimizedSvg(""); };

    const formatSize = (str: string) => {
        const bytes = new Blob([str]).size;
        return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
    };

    const savings = originalSvg && optimizedSvg ? Math.round((1 - new Blob([optimizedSvg]).size / new Blob([originalSvg]).size) * 100) : 0;
    const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

    const basicOptions: { key: keyof OptimizeOptions; label: string }[] = [
        { key: "removeComments", label: "comments" },
        { key: "removeMetadata", label: "metadata" },
        { key: "removeEmptyAttrs", label: "empty attrs" },
    ];

    const advancedOptions: { key: keyof OptimizeOptions; label: string }[] = [
        { key: "minifyIds", label: "minify IDs" },
        { key: "removeDimensions", label: "dimensions" },
        { key: "removeUselessDefs", label: "empty defs" },
        { key: "removeXMLNS", label: "xlink xmlns" },
        { key: "prettify", label: "prettify output" },
    ];

    return (
        <motion.div className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <input ref={fileInputRef} type="file" accept=".svg" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />

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
                    <p className="text-xs text-muted-foreground">drop SVG file or click to browse</p>
                </div>
            ) : (
                <div className="relative flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                    <button onClick={reset} className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors"><X className="w-3 h-3" /></button>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0"><FileCode className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatSize(originalSvg)} → {formatSize(optimizedSvg)}
                            {savings > 0 && <span className="text-primary font-medium ml-1">(-{savings}%)</span>}
                        </p>
                    </div>
                </div>
            )}

            {/* Basic options - always visible */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">remove</p>
                <div className="flex flex-wrap gap-1">
                    {basicOptions.map(({ key, label }) => (
                        <button key={key} onClick={() => toggleOption(key)} className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${options[key] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{label}</button>
                    ))}
                </div>
            </div>

            {/* Advanced options toggle */}
            <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
                advanced options <motion.div animate={{ rotate: showOptions ? 180 : 0 }} transition={transition}><CaretDown className="w-4 h-4" /></motion.div>
            </button>
            <AnimatePresence>
                {showOptions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="overflow-hidden">
                        <div className="flex flex-wrap gap-1 pt-1">
                            {advancedOptions.map(({ key, label }) => (
                                <button key={key} onClick={() => toggleOption(key)} className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${options[key] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{label}</button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview - only when file loaded */}
            {file && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>preview</span>
                        <button onClick={copy} className="text-primary hover:underline flex items-center gap-1 transition-colors">
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? "copied!" : "copy"}
                        </button>
                    </div>
                    <div className="p-2 bg-muted/30 border rounded-lg max-h-20 overflow-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">{optimizedSvg.slice(0, 400)}{optimizedSvg.length > 400 ? "..." : ""}</pre>
                    </div>
                </div>
            )}

            <Button onClick={download} disabled={!file} className="w-full gap-2"><DownloadSimple className="w-4 h-4" />optimize & download</Button>
        </motion.div>
    );
}
