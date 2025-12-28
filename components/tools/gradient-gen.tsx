"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowClockwise, Plus, X } from "@phosphor-icons/react";

type Direction = "to right" | "to left" | "to bottom" | "to top" | "to bottom right" | "to bottom left" | "to top right" | "to top left";

interface ColorStop {
    color: string;
    position: number;
}

export function GradientGen() {
    const [type, setType] = useState<"linear" | "radial">("linear");
    const [direction, setDirection] = useState<Direction>("to right");
    const [stops, setStops] = useState<ColorStop[]>([
        { color: "#ec4899", position: 0 },
        { color: "#8b5cf6", position: 100 },
    ]);
    const [copied, setCopied] = useState(false);

    const DIRECTIONS: Direction[] = [
        "to right", "to left", "to bottom", "to top",
        "to bottom right", "to bottom left", "to top right", "to top left"
    ];

    const generateCSS = () => {
        const stopsStr = stops
            .sort((a, b) => a.position - b.position)
            .map(s => `${s.color} ${s.position}%`)
            .join(", ");

        if (type === "linear") {
            return `linear-gradient(${direction}, ${stopsStr})`;
        } else {
            return `radial-gradient(circle, ${stopsStr})`;
        }
    };

    const addStop = () => {
        if (stops.length >= 5) return;
        const newPosition = Math.round((stops[stops.length - 1].position + stops[0].position) / 2);
        setStops([...stops, { color: "#ffffff", position: newPosition }]);
    };

    const removeStop = (index: number) => {
        if (stops.length <= 2) return;
        setStops(stops.filter((_, i) => i !== index));
    };

    const updateStop = (index: number, updates: Partial<ColorStop>) => {
        setStops(stops.map((stop, i) => i === index ? { ...stop, ...updates } : stop));
    };

    const randomize = () => {
        const randomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
        setStops([
            { color: randomColor(), position: 0 },
            { color: randomColor(), position: 100 },
        ]);
        setDirection(DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]);
    };

    const copy = async () => {
        await navigator.clipboard.writeText(`background: ${generateCSS()};`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const css = generateCSS();

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Preview */}
            <div
                className="h-32 rounded-xl border"
                style={{ background: css }}
            />

            {/* Type toggle */}
            <div className="flex gap-1">
                <button
                    onClick={() => setType("linear")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${type === "linear"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Linear
                </button>
                <button
                    onClick={() => setType("radial")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${type === "radial"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Radial
                </button>
                <button
                    onClick={randomize}
                    className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    title="Randomize"
                >
                    <ArrowClockwise className="w-4 h-4" />
                </button>
            </div>

            {/* Direction (only for linear) */}
            {type === "linear" && (
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">direction</label>
                    <div className="grid grid-cols-4 gap-1">
                        {DIRECTIONS.map((dir) => (
                            <button
                                key={dir}
                                onClick={() => setDirection(dir)}
                                className={`py-1.5 text-[10px] rounded-lg transition-colors ${direction === dir
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {dir.replace("to ", "")}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Color stops */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">color stops</label>
                    {stops.length < 5 && (
                        <button
                            onClick={addStop}
                            className="text-xs text-primary hover:underline flex items-center gap-0.5"
                        >
                            <Plus className="w-3 h-3" /> add
                        </button>
                    )}
                </div>
                {stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input
                            type="color"
                            value={stop.color}
                            onChange={(e) => updateStop(i, { color: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <input
                            type="text"
                            value={stop.color}
                            onChange={(e) => updateStop(i, { color: e.target.value })}
                            className="flex-1 px-2 py-1 text-xs font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={stop.position}
                            onChange={(e) => updateStop(i, { position: parseInt(e.target.value) || 0 })}
                            className="w-14 px-2 py-1 text-xs bg-muted/50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                        {stops.length > 2 && (
                            <button
                                onClick={() => removeStop(i)}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* CSS output */}
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">css</label>
                <div className="bg-muted/50 p-2 rounded-lg">
                    <code className="text-xs font-mono break-all">
                        background: {css};
                    </code>
                </div>
            </div>

            <Button onClick={copy} variant="outline" className="w-full gap-1">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy CSS"}
            </Button>
        </motion.div>
    );
}
