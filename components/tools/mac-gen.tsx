"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

type MacFormat = "colon" | "dash" | "dot" | "none";

const FORMATS: { id: MacFormat; label: string; example: string }[] = [
    { id: "colon", label: "AA:BB:CC", example: "AA:BB:CC:DD:EE:FF" },
    { id: "dash", label: "AA-BB-CC", example: "AA-BB-CC-DD-EE-FF" },
    { id: "dot", label: "AABB.CCDD", example: "AABB.CCDD.EEFF" },
    { id: "none", label: "AABBCC", example: "AABBCCDDEEFF" },
];

function generateMAC(format: MacFormat, lowercase: boolean): string {
    const bytes: string[] = [];
    for (let i = 0; i < 6; i++) {
        const byte = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
        bytes.push(lowercase ? byte.toLowerCase() : byte.toUpperCase());
    }

    switch (format) {
        case "colon":
            return bytes.join(":");
        case "dash":
            return bytes.join("-");
        case "dot":
            return `${bytes[0]}${bytes[1]}.${bytes[2]}${bytes[3]}.${bytes[4]}${bytes[5]}`;
        case "none":
            return bytes.join("");
        default:
            return bytes.join(":");
    }
}

export function MacGen() {
    const [format, setFormat] = useState<MacFormat>("colon");
    const [lowercase, setLowercase] = useState(false);
    const [count, setCount] = useState(5);
    const [macs, setMacs] = useState<string[]>(() =>
        Array.from({ length: 5 }, () => generateMAC("colon", false))
    );
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        setMacs(Array.from({ length: count }, () => generateMAC(format, lowercase)));
    }, [format, lowercase, count]);

    const copyItem = async (mac: string) => {
        await navigator.clipboard.writeText(mac);
        setCopied(mac);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(macs.join("\n"));
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Format selector */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {FORMATS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors min-h-touch-sm ${format === f.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Generated MACs */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-hide">
                {macs.map((mac, i) => (
                    <motion.div
                        key={`${mac}-${i}`}
                        className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg group min-h-touch-md"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <span className="flex-1 font-mono text-sm break-all min-w-0">{mac}</span>
                        <button
                            onClick={() => copyItem(mac)}
                            className="p-2 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-muted rounded transition-all shrink-0"
                        >
                            {copied === mac ? (
                                <Check className="w-4 h-4 text-primary" />
                            ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
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
                generate mac addresses
            </motion.button>

            {/* Options */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                    onClick={() => setLowercase(!lowercase)}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors min-h-touch-xs ${lowercase
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    lowercase
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">count</span>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="flex-1 sm:w-24 accent-primary h-6"
                    />
                    <span className="text-xs w-6 text-center font-medium">{count}</span>
                </div>
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
