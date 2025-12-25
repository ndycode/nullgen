"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "@phosphor-icons/react";

type Mode = "lines" | "words";

export function DuplicateRemover() {
    const [input, setInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [mode, setMode] = useState<Mode>("lines");
    const [caseSensitive, setCaseSensitive] = useState(true);
    const [trimLines, setTrimLines] = useState(true);

    const { output, stats } = useMemo(() => {
        if (!input.trim()) return { output: "", stats: { original: 0, unique: 0, removed: 0 } };

        if (mode === "lines") {
            let lines = input.split("\n");
            const originalCount = lines.length;

            if (trimLines) {
                lines = lines.map(l => l.trim());
            }

            const seen = new Set<string>();
            const result: string[] = [];

            for (const line of lines) {
                const key = caseSensitive ? line : line.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(line);
                }
            }

            return {
                output: result.join("\n"),
                stats: {
                    original: originalCount,
                    unique: result.length,
                    removed: originalCount - result.length
                }
            };
        } else {
            // Word mode
            const words = input.split(/\s+/).filter(w => w.length > 0);
            const originalCount = words.length;
            const seen = new Set<string>();
            const result: string[] = [];

            for (const word of words) {
                const key = caseSensitive ? word : word.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(word);
                }
            }

            return {
                output: result.join(" "),
                stats: {
                    original: originalCount,
                    unique: result.length,
                    removed: originalCount - result.length
                }
            };
        }
    }, [input, mode, caseSensitive, trimLines]);

    const copy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const paste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInput(text);
        } catch { }
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">paste text to deduplicate</p>
                <button onClick={paste} className="text-xs text-primary hover:underline">
                    paste
                </button>
            </div>

            {/* Input */}
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === "lines" ? "Line 1\nLine 2\nLine 1..." : "word word hello word..."}
                className="w-full h-24 px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Mode toggle */}
            <div className="flex gap-1.5">
                <button
                    onClick={() => setMode("lines")}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${mode === "lines"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    lines
                </button>
                <button
                    onClick={() => setMode("words")}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${mode === "words"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    words
                </button>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-1.5">
                <button
                    onClick={() => setCaseSensitive(!caseSensitive)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${caseSensitive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    case sensitive
                </button>
                {mode === "lines" && (
                    <button
                        onClick={() => setTrimLines(!trimLines)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${trimLines
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        trim lines
                    </button>
                )}
            </div>

            {/* Stats */}
            {input && (
                <motion.div
                    className="flex justify-between text-xs text-muted-foreground px-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <span>{stats.original} {mode} → {stats.unique} unique</span>
                    <span className="text-primary">−{stats.removed} removed</span>
                </motion.div>
            )}

            {/* Output */}
            {input && (
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">result</p>
                        <button
                            onClick={copy}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? "copied!" : "copy"}
                        </button>
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        className="w-full h-24 px-3 py-2 text-sm font-mono bg-muted/30 border rounded-lg resize-none"
                    />
                </motion.div>
            )}
        </motion.div>
    );
}
