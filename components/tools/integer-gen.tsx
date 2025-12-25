"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

export function IntegerGen() {
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(100);
    const [count, setCount] = useState(5);
    const [unique, setUnique] = useState(false);
    const [numbers, setNumbers] = useState<number[]>([]);
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        if (min >= max) return;

        const results: number[] = [];
        const range = max - min + 1;

        if (unique && count > range) {
            // Can't generate more unique numbers than the range
            return;
        }

        if (unique) {
            const available = Array.from({ length: range }, (_, i) => min + i);
            for (let i = 0; i < count && available.length > 0; i++) {
                const idx = Math.floor(Math.random() * available.length);
                results.push(available.splice(idx, 1)[0]);
            }
        } else {
            for (let i = 0; i < count; i++) {
                results.push(Math.floor(Math.random() * range) + min);
            }
        }

        setNumbers(results);
    }, [min, max, count, unique]);

    const copyItem = async (num: number) => {
        await navigator.clipboard.writeText(String(num));
        setCopied(String(num));
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(numbers.join(", "));
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    // Generate on mount
    useState(() => { generate(); });

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Range inputs */}
            <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">min</p>
                    <input
                        type="number"
                        value={min}
                        onChange={(e) => setMin(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">max</p>
                    <input
                        type="number"
                        value={max}
                        onChange={(e) => setMax(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            {/* Generated numbers */}
            <div className="flex flex-wrap gap-1.5">
                {numbers.map((num, i) => (
                    <motion.button
                        key={`${num}-${i}`}
                        onClick={() => copyItem(num)}
                        className={`px-3 py-1.5 font-mono text-sm rounded-lg transition-all ${copied === String(num)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {num}
                    </motion.button>
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
                generate integers
            </motion.button>

            {/* Options */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setUnique(!unique)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${unique
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    unique only
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">count</span>
                    <input
                        type="range"
                        min={1}
                        max={20}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="w-20 accent-primary"
                    />
                    <span className="text-xs w-6 text-center">{count}</span>
                </div>
            </div>

            {/* Copy all */}
            {numbers.length > 1 && (
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
