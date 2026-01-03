"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise, LockSimple } from "@phosphor-icons/react";

type Harmony = "complementary" | "analogous" | "triadic" | "tetradic" | "monochromatic";

const HARMONIES: { id: Harmony; label: string; count: number }[] = [
    { id: "complementary", label: "complementary", count: 2 },
    { id: "analogous", label: "analogous", count: 5 },
    { id: "triadic", label: "triadic", count: 3 },
    { id: "tetradic", label: "tetradic", count: 4 },
    { id: "monochromatic", label: "monochromatic", count: 5 },
];

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(baseHue: number, harmony: Harmony): string[] {
    const s = 65 + Math.random() * 20;
    const l = 45 + Math.random() * 20;

    switch (harmony) {
        case "complementary":
            return [
                hslToHex(baseHue, s, l),
                hslToHex((baseHue + 180) % 360, s, l),
            ];
        case "analogous":
            return [
                hslToHex((baseHue - 30 + 360) % 360, s, l),
                hslToHex((baseHue - 15 + 360) % 360, s, l),
                hslToHex(baseHue, s, l),
                hslToHex((baseHue + 15) % 360, s, l),
                hslToHex((baseHue + 30) % 360, s, l),
            ];
        case "triadic":
            return [
                hslToHex(baseHue, s, l),
                hslToHex((baseHue + 120) % 360, s, l),
                hslToHex((baseHue + 240) % 360, s, l),
            ];
        case "tetradic":
            return [
                hslToHex(baseHue, s, l),
                hslToHex((baseHue + 90) % 360, s, l),
                hslToHex((baseHue + 180) % 360, s, l),
                hslToHex((baseHue + 270) % 360, s, l),
            ];
        case "monochromatic":
            return [
                hslToHex(baseHue, s, l - 20),
                hslToHex(baseHue, s, l - 10),
                hslToHex(baseHue, s, l),
                hslToHex(baseHue, s, l + 10),
                hslToHex(baseHue, s, l + 15),
            ];
        default:
            return [hslToHex(baseHue, s, l)];
    }
}

export function ColorPaletteGen() {
    const [harmony, setHarmony] = useState<Harmony>("analogous");
    const [baseHue, setBaseHue] = useState(180);
    const [palette, setPalette] = useState<string[]>([]);
    const [locked, setLocked] = useState<Set<number>>(new Set());
    const [copied, setCopied] = useState<string | null>(null);
    const [cssExported, setCssExported] = useState(false);

    const generate = useCallback(() => {
        const newHue = Math.floor(Math.random() * 360);
        setBaseHue(newHue);
        const newPalette = generatePalette(newHue, harmony);

        // Keep locked colors
        setPalette(prev =>
            newPalette.map((color, i) => locked.has(i) ? prev[i] : color)
        );
    }, [harmony, locked]);

    const toggleLock = (index: number) => {
        setLocked(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const copyColor = async (color: string) => {
        await navigator.clipboard.writeText(color);
        setCopied(color);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(palette.join(", "));
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    // Generate palette on mount
    useEffect(() => { generate(); }, []);
    const exportCss = async () => {
        const css = palette.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n");
        await navigator.clipboard.writeText(`:root {\n${css}\n}`);
        setCssExported(true);
        setTimeout(() => setCssExported(false), 1500);
    };

    // Update palette when harmony changes
    const handleHarmonyChange = (h: Harmony) => {
        setHarmony(h);
        setLocked(new Set());
        setPalette(generatePalette(baseHue, h));
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Harmony selector */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {HARMONIES.map((h) => (
                    <button
                        key={h.id}
                        onClick={() => handleHarmonyChange(h.id)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors min-h-touch-sm ${harmony === h.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {h.label}
                    </button>
                ))}
            </div>

            {/* Color palette display */}
            <div className="flex gap-1 h-20 sm:h-24 rounded-lg overflow-hidden">
                {palette.map((color, i) => (
                    <motion.div
                        key={`${color}-${i}`}
                        className="flex-1 relative group cursor-pointer min-w-0"
                        style={{ backgroundColor: color }}
                        onClick={() => copyColor(color)}
                        whileHover={{ flex: 1.5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <span className="text-2xs sm:text-xs font-mono text-white break-all px-1 text-center">{color}</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleLock(i); }}
                            className={`absolute top-1 right-1 p-1 rounded transition-opacity ${locked.has(i) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        >
                            <LockSimple className={`w-3 h-3 ${locked.has(i) ? "text-white" : "text-white/70"}`} weight={locked.has(i) ? "fill" : "regular"} />
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Generate button */}
            <motion.button
                onClick={generate}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 text-sm font-medium min-h-touch-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <ArrowClockwise className="w-4 h-4" />
                generate palette
            </motion.button>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={copyAll}
                    className="flex-1 py-1.5 text-xs bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    {copied === "all" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied === "all" ? "copied!" : "copy all"}
                </button>
                <button
                    onClick={exportCss}
                    className="flex-1 py-1.5 text-xs bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    {cssExported ? <Check className="w-3 h-3" /> : null}
                    {cssExported ? "exported!" : "export css"}
                </button>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
                tap color to copy • lock to keep when regenerating
            </p>
        </motion.div>
    );
}
