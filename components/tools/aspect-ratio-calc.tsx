"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowsLeftRight, Lock, LockOpen, CaretDown } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

type PresetRatio = "16:9" | "4:3" | "1:1" | "3:2" | "21:9" | "9:16" | "3:4" | "2:3";

const PRESETS: { id: PresetRatio; label: string; w: number; h: number }[] = [
    { id: "16:9", label: "16:9", w: 16, h: 9 },
    { id: "4:3", label: "4:3", w: 4, h: 3 },
    { id: "1:1", label: "1:1", w: 1, h: 1 },
    { id: "3:2", label: "3:2", w: 3, h: 2 },
    { id: "21:9", label: "21:9", w: 21, h: 9 },
    { id: "9:16", label: "9:16", w: 9, h: 16 },
    { id: "3:4", label: "3:4", w: 3, h: 4 },
    { id: "2:3", label: "2:3", w: 2, h: 3 },
];

const COMMON_RESOLUTIONS = [
    { label: "HD", w: 1280, h: 720 },
    { label: "FHD", w: 1920, h: 1080 },
    { label: "2K", w: 2560, h: 1440 },
    { label: "4K", w: 3840, h: 2160 },
    { label: "IG Post", w: 1080, h: 1080 },
    { label: "IG Story", w: 1080, h: 1920 },
];

export function AspectRatioCalc() {
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [ratioW, setRatioW] = useState("16");
    const [ratioH, setRatioH] = useState("9");
    const [locked, setLocked] = useState<"width" | "height" | null>("height");
    const [copied, setCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const calculated = useMemo(() => {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const rW = parseFloat(ratioW) || 1;
        const rH = parseFloat(ratioH) || 1;
        const ratio = rW / rH;
        if (locked === "height" && !isNaN(w) && w > 0) return { width: w, height: Math.round(w / ratio) };
        if (locked === "width" && !isNaN(h) && h > 0) return { width: Math.round(h * ratio), height: h };
        return null;
    }, [width, height, ratioW, ratioH, locked]);

    const selectPreset = (preset: typeof PRESETS[0]) => { setRatioW(preset.w.toString()); setRatioH(preset.h.toString()); };
    const selectResolution = (res: typeof COMMON_RESOLUTIONS[0]) => { setWidth(res.w.toString()); setHeight(res.h.toString()); };

    const copy = async () => {
        if (!calculated) return;
        await navigator.clipboard.writeText(`${calculated.width} × ${calculated.height}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const swap = () => { setRatioW(ratioH); setRatioH(ratioW); };

    const getSimplifiedRatio = () => {
        const rW = parseFloat(ratioW) || 1;
        const rH = parseFloat(ratioH) || 1;
        const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
        const divisor = gcd(Math.round(rW), Math.round(rH));
        return `${Math.round(rW / divisor)}:${Math.round(rH / divisor)}`;
    };

    const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

    return (
        <motion.div className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Ratio presets */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ratio</p>
                <div className="grid grid-cols-4 gap-1">
                    {PRESETS.map((preset) => (
                        <button key={preset.id} onClick={() => selectPreset(preset)}
                            className={`py-1 text-xs rounded-lg transition-colors ${ratioW === preset.w.toString() && ratioH === preset.h.toString() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{preset.label}</button>
                    ))}
                </div>
            </div>

            {/* Custom ratio */}
            <div className="flex items-center gap-2">
                <Input type="number" value={ratioW} onChange={(e) => setRatioW(e.target.value)} className="text-center text-xs h-8" placeholder="W" />
                <button onClick={swap} className="p-1.5 bg-muted rounded-lg hover:bg-muted/80"><ArrowsLeftRight className="w-4 h-4 text-muted-foreground" /></button>
                <Input type="number" value={ratioH} onChange={(e) => setRatioH(e.target.value)} className="text-center text-xs h-8" placeholder="H" />
            </div>

            {/* Dimensions input */}
            <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">width</span>
                        <button onClick={() => setLocked(locked === "width" ? null : "width")} className={`p-0.5 rounded ${locked === "width" ? "text-primary" : "text-muted-foreground"}`}>
                            {locked === "width" ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                        </button>
                    </div>
                    <Input type="number" value={locked === "width" && calculated ? calculated.width.toString() : width} onChange={(e) => setWidth(e.target.value)} disabled={locked === "width"} className="text-xs h-8" placeholder="1920" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">height</span>
                        <button onClick={() => setLocked(locked === "height" ? null : "height")} className={`p-0.5 rounded ${locked === "height" ? "text-primary" : "text-muted-foreground"}`}>
                            {locked === "height" ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                        </button>
                    </div>
                    <Input type="number" value={locked === "height" && calculated ? calculated.height.toString() : height} onChange={(e) => setHeight(e.target.value)} disabled={locked === "height"} className="text-xs h-8" placeholder="1080" />
                </div>
            </div>

            {/* Options toggle */}
            <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-xs text-muted-foreground py-1 hover:text-foreground">
                presets <motion.div animate={{ rotate: showOptions ? 180 : 0 }} transition={transition}><CaretDown className="w-4 h-4" /></motion.div>
            </button>
            <AnimatePresence>
                {showOptions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="overflow-hidden">
                        <div className="space-y-1 pt-1">
                            <p className="text-xs text-muted-foreground">common resolutions</p>
                            <div className="grid grid-cols-3 gap-1">
                                {COMMON_RESOLUTIONS.map((res) => (
                                    <button key={res.label} onClick={() => selectResolution(res)} className="py-1.5 text-xs bg-muted rounded-lg hover:bg-muted/80 text-muted-foreground">{res.label}</button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result */}
            {calculated && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>result ({getSimplifiedRatio()})</span>
                        <button onClick={copy} className="text-primary hover:underline flex items-center gap-1">
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? "copied!" : "copy"}
                        </button>
                    </div>
                    <div onClick={copy} className="p-2 bg-muted/30 border rounded-lg text-center cursor-pointer hover:bg-muted/50">
                        <p className="text-base font-mono font-semibold">{calculated.width} × {calculated.height}</p>
                        <p className="text-xs text-muted-foreground">{(calculated.width * calculated.height / 1000000).toFixed(2)} MP</p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
