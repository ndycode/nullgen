"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, Monitor, CaretDown } from "@phosphor-icons/react";

interface ScreenData {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelRatio: number;
    orientation: string;
    viewportWidth: number;
    viewportHeight: number;
    touchPoints: number;
}

export function ScreenChecker() {
    const [data, setData] = useState<ScreenData | null>(null);
    const [copied, setCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const updateData = () => {
            setData({
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight,
                colorDepth: window.screen.colorDepth,
                pixelRatio: window.devicePixelRatio,
                orientation: window.screen.orientation?.type.split("-")[0] || "unknown",
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                touchPoints: navigator.maxTouchPoints || 0,
            });
        };
        updateData();
        window.addEventListener("resize", updateData);
        return () => window.removeEventListener("resize", updateData);
    }, []);

    const copy = async () => {
        if (!data) return;
        await navigator.clipboard.writeText(`${data.width}x${data.height}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    if (!data) return null;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Main Result */}
            <div className="bg-muted/50 p-3 rounded-lg text-center space-y-1">
                <p className="text-xl font-mono font-bold">{data.width} × {data.height}</p>
                <p className="text-xs text-muted-foreground">
                    {data.orientation} · {data.pixelRatio}x DPI
                </p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">viewport</p>
                    <p className="font-medium">{data.viewportWidth} × {data.viewportHeight}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">color depth</p>
                    <p className="font-medium">{data.colorDepth}-bit</p>
                </div>
            </div>

            {/* Options (Details) */}
            <div>
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                >
                    details
                    <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                        <CaretDown className="w-4 h-4" />
                    </motion.div>
                </button>
                {showOptions && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="space-y-2 overflow-hidden text-sm"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">available</p>
                                <p className="font-medium">{data.availWidth} × {data.availHeight}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">pixel ratio</p>
                                <p className="font-medium">{data.pixelRatio}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">touch</p>
                                <p className="font-medium">{data.touchPoints > 0 ? `${data.touchPoints} points` : "no"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">orientation</p>
                                <p className="font-medium">{data.orientation}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Copy Button */}
            <Button onClick={copy} variant="outline" className="w-full gap-1.5">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "copied!" : "copy resolution"}
            </Button>
        </motion.div>
    );
}
