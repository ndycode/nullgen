"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

type CharSet = "alpha" | "numeric" | "alphanumeric" | "hex" | "custom";

const CHARSETS: Record<Exclude<CharSet, "custom">, string> = {
    alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    numeric: "0123456789",
    alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    hex: "0123456789ABCDEF",
};

export function StringGen() {
    const [length, setLength] = useState(16);
    const [count, setCount] = useState(5);
    const [charSet, setCharSet] = useState<CharSet>("alphanumeric");
    const [customChars, setCustomChars] = useState("ABC123!@#");
    const [strings, setStrings] = useState<string[]>([]);
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        const chars = charSet === "custom" ? customChars : CHARSETS[charSet];
        if (chars.length === 0) return;

        const results: string[] = [];
        for (let i = 0; i < count; i++) {
            let str = "";
            for (let j = 0; j < length; j++) {
                str += chars[Math.floor(Math.random() * chars.length)];
            }
            results.push(str);
        }
        setStrings(results);
    }, [length, count, charSet, customChars]);

    const copyItem = async (item: string) => {
        await navigator.clipboard.writeText(item);
        setCopied(item);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(strings.join("\n"));
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    // Generate on mount
    useState(() => { generate(); });

    const charSetOptions: { id: CharSet; label: string }[] = [
        { id: "alphanumeric", label: "a-z 0-9" },
        { id: "alpha", label: "a-z" },
        { id: "numeric", label: "0-9" },
        { id: "hex", label: "hex" },
        { id: "custom", label: "custom" },
    ];

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Charset selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {charSetOptions.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setCharSet(opt.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${charSet === opt.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Custom chars input */}
            {charSet === "custom" && (
                <input
                    type="text"
                    value={customChars}
                    onChange={(e) => setCustomChars(e.target.value)}
                    placeholder="Enter custom characters..."
                    className="w-full px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            )}

            {/* Generated strings */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {strings.map((str, i) => (
                    <motion.div
                        key={`${str}-${i}`}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <span className="flex-1 font-mono text-xs truncate">{str}</span>
                        <button
                            onClick={() => copyItem(str)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                            {copied === str ? (
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
                generate strings
            </motion.button>

            {/* Advanced options */}
            <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    advanced options
                </summary>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">length</span>
                        <input
                            type="range"
                            min={4}
                            max={64}
                            value={length}
                            onChange={(e) => setLength(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                        <span className="text-xs w-6 text-center">{length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">count</span>
                        <input
                            type="range"
                            min={1}
                            max={20}
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                        <span className="text-xs w-6 text-center">{count}</span>
                    </div>
                </div>
            </details>

            {/* Copy all */}
            {strings.length > 1 && (
                <button
                    onClick={copyAll}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                    {copied === "all" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    {copied === "all" ? "copied all!" : "copy all"}
                </button>
            )}
        </motion.div>
    );
}
