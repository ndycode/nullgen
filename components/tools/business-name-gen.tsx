"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

type BusinessStyle = "tech" | "creative" | "corporate" | "random";

const TECH_PREFIXES = ["Tech", "Cyber", "Digi", "Neo", "Quantum", "Cloud", "Data", "Net", "Code", "Pixel", "Byte", "Logic", "Sync", "Meta", "Hyper"];
const TECH_SUFFIXES = ["Labs", "Systems", "Solutions", "Works", "Hub", "Space", "Base", "Core", "Flow", "Wave", "Link", "Point", "Stack", "Forge", "Spark"];

const CREATIVE_PREFIXES = ["Bright", "Bold", "Fresh", "Pure", "Prime", "Vivid", "Spark", "Glow", "Dream", "Inspire", "Imagine", "Create", "Design", "Craft", "Art"];
const CREATIVE_SUFFIXES = ["Studio", "Collective", "Agency", "House", "Co", "Group", "Team", "Works", "Lab", "Designs", "Media", "Creative", "Digital", "Vision", "Ideas"];

const CORP_PREFIXES = ["Global", "United", "Premier", "Elite", "First", "Prime", "Alpha", "Apex", "Summit", "Peak", "Crown", "Royal", "Grand", "Sterling", "Capital"];
const CORP_SUFFIXES = ["Industries", "Enterprises", "Corporation", "Holdings", "Partners", "Associates", "Consulting", "Ventures", "Group", "International", "Solutions", "Services", "Investments", "Management", "Capital"];

function random<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateBusinessName(style: BusinessStyle): string {
    switch (style) {
        case "tech":
            return `${random(TECH_PREFIXES)}${random(TECH_SUFFIXES)}`;
        case "creative":
            return `${random(CREATIVE_PREFIXES)} ${random(CREATIVE_SUFFIXES)}`;
        case "corporate":
            return `${random(CORP_PREFIXES)} ${random(CORP_SUFFIXES)}`;
        case "random":
        default:
            const styles: BusinessStyle[] = ["tech", "creative", "corporate"];
            return generateBusinessName(random(styles));
    }
}

const STYLES: { id: BusinessStyle; label: string }[] = [
    { id: "random", label: "random" },
    { id: "tech", label: "tech" },
    { id: "creative", label: "creative" },
    { id: "corporate", label: "corporate" },
];

export function BusinessNameGen() {
    const [style, setStyle] = useState<BusinessStyle>("random");
    const [count, setCount] = useState(5);
    const [names, setNames] = useState<string[]>(() =>
        Array.from({ length: 5 }, () => generateBusinessName("random"))
    );
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        setNames(Array.from({ length: count }, () => generateBusinessName(style)));
    }, [style, count]);

    const copyItem = async (item: string) => {
        await navigator.clipboard.writeText(item);
        setCopied(item);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(names.join("\n"));
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Style selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {STYLES.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${style === s.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Generated names */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {names.map((name, i) => (
                    <motion.div
                        key={`${name}-${i}`}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <span className="flex-1 text-sm font-medium">{name}</span>
                        <button
                            onClick={() => copyItem(name)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                            {copied === name ? (
                                <Check className="w-3 h-3 text-primary" />
                            ) : (
                                <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Generate button */}
            <motion.button
                onClick={generate}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <ArrowClockwise className="w-4 h-4" />
                generate names
            </motion.button>

            {/* Count slider */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">count</span>
                <input
                    type="range"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                />
                <span className="text-xs w-6 text-center">{count}</span>
            </div>

            {/* Copy all */}
            <button
                onClick={copyAll}
                className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
                {copied === "all" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                {copied === "all" ? "copied all!" : "copy all"}
            </button>
        </motion.div>
    );
}
