"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "@phosphor-icons/react";
import { COLOR_PRESETS, THEME_COLORS } from "@/lib/colors";

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

// Conversion functions
function hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): RGB {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

const PRESETS = COLOR_PRESETS;

export function ColorPicker() {
    const [hex, setHex] = useState<string>(THEME_COLORS.primary);
    const [rgb, setRgb] = useState<RGB>({ r: 236, g: 72, b: 153 });
    const [hsl, setHsl] = useState<HSL>({ h: 330, s: 81, l: 60 });
    const [copied, setCopied] = useState<string | null>(null);

    const updateFromHex = (newHex: string) => {
        setHex(newHex);
        const rgbVal = hexToRgb(newHex);
        if (rgbVal) {
            setRgb(rgbVal);
            setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
        }
    };

    const updateFromRgb = (newRgb: RGB) => {
        setRgb(newRgb);
        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    };

    const updateFromHsl = (newHsl: HSL) => {
        setHsl(newHsl);
        const rgbVal = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        setRgb(rgbVal);
        setHex(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b));
    };

    const copy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 1500);
        } catch { }
    };

    const randomColor = () => {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 40) + 60; // 60-100%
        const l = Math.floor(Math.random() * 40) + 30; // 30-70%
        updateFromHsl({ h, s, l });
    };

    const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Color preview */}
            <motion.div
                className="h-20 rounded-xl border-2 border-border cursor-pointer"
                style={{ backgroundColor: hex }}
                animate={{ backgroundColor: hex }}
                transition={{ duration: 0.2 }}
                onClick={randomColor}
                title="Click for random color"
            />

            {/* Presets */}
            <div className="grid grid-cols-6 gap-1.5">
                {PRESETS.map((color) => (
                    <button
                        key={color}
                        onClick={() => updateFromHex(color)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${hex.toLowerCase() === color.toLowerCase()
                            ? "border-primary scale-110"
                            : "border-transparent hover:scale-105"
                            }`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            {/* Hex input */}
            <div className="flex gap-2">
                <div
                    className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: hex }}
                    onClick={randomColor}
                    title="Click for random"
                />
                <Input
                    value={hex}
                    onChange={(e) => updateFromHex(e.target.value)}
                    placeholder={THEME_COLORS.primary}
                    className="flex-1 font-mono text-sm"
                />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(hex, "hex")}
                    className="shrink-0"
                >
                    {copied === "hex" ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>

            {/* RGB */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>rgb</span>
                    <button onClick={() => copy(rgbString, "rgb")} className="hover:text-foreground">
                        {copied === "rgb" ? "copied!" : "copy"}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {(["r", "g", "b"] as const).map((ch) => (
                        <div key={ch} className="relative">
                            <Input
                                type="number"
                                min={0}
                                max={255}
                                value={rgb[ch]}
                                onChange={(e) => updateFromRgb({ ...rgb, [ch]: parseInt(e.target.value) || 0 })}
                                className="h-9 text-sm pr-6 font-mono"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground uppercase">{ch}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* HSL */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>hsl</span>
                    <button onClick={() => copy(hslString, "hsl")} className="hover:text-foreground">
                        {copied === "hsl" ? "copied!" : "copy"}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                        <Input
                            type="number"
                            min={0}
                            max={360}
                            value={hsl.h}
                            onChange={(e) => updateFromHsl({ ...hsl, h: parseInt(e.target.value) || 0 })}
                            className="h-9 text-sm pr-5 font-mono"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">°</span>
                    </div>
                    <div className="relative">
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={hsl.s}
                            onChange={(e) => updateFromHsl({ ...hsl, s: parseInt(e.target.value) || 0 })}
                            className="h-9 text-sm pr-5 font-mono"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="relative">
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={hsl.l}
                            onChange={(e) => updateFromHsl({ ...hsl, l: parseInt(e.target.value) || 0 })}
                            className="h-9 text-sm pr-5 font-mono"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
