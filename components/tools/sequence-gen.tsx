"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise, Shuffle } from "@phosphor-icons/react";

export function SequenceGen() {
    const [start, setStart] = useState(1);
    const [end, setEnd] = useState(10);
    const [sequence, setSequence] = useState<number[]>([]);
    const [copied, setCopied] = useState(false);

    const generate = useCallback(() => {
        if (start >= end) return;

        // Create array and shuffle using Fisher-Yates
        const arr = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        setSequence(arr);
    }, [start, end]);

    const copySequence = async () => {
        await navigator.clipboard.writeText(sequence.join(", "));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
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
                    <p className="text-xs text-muted-foreground">from</p>
                    <input
                        type="number"
                        value={start}
                        onChange={(e) => setStart(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">to</p>
                    <input
                        type="number"
                        value={end}
                        onChange={(e) => setEnd(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            {/* Shuffled sequence */}
            <div className="p-3 bg-muted/30 rounded-lg max-h-24 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                    {sequence.map((num, i) => (
                        <motion.span
                            key={`${num}-${i}`}
                            className="px-2 py-0.5 text-xs font-mono bg-muted rounded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                        >
                            {num}
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
                {sequence.length} numbers shuffled
            </p>

            {/* Shuffle button */}
            <motion.button
                onClick={generate}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Shuffle className="w-4 h-4" />
                shuffle sequence
            </motion.button>

            {/* Copy */}
            <button
                onClick={copySequence}
                className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
                {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                {copied ? "copied!" : "copy sequence"}
            </button>
        </motion.div>
    );
}
