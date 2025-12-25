"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ClipboardText } from "@phosphor-icons/react";

interface CleanOptions {
    trimLines: boolean;
    removeEmpty: boolean;
    removeMultipleSpaces: boolean;
    removeMultipleNewlines: boolean;
}

export function TextCleaner() {
    const [input, setInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [options, setOptions] = useState<CleanOptions>({
        trimLines: true,
        removeEmpty: true,
        removeMultipleSpaces: true,
        removeMultipleNewlines: false,
    });

    // Real-time cleaning
    const output = useMemo(() => {
        if (!input) return "";

        let result = input;

        if (options.removeMultipleSpaces) {
            result = result.replace(/  +/g, " ");
        }

        if (options.removeMultipleNewlines) {
            result = result.replace(/\n{3,}/g, "\n\n");
        }

        let lines = result.split("\n");

        if (options.trimLines) {
            lines = lines.map(line => line.trim());
        }

        if (options.removeEmpty) {
            lines = lines.filter(line => line.length > 0);
        }

        return lines.join("\n");
    }, [input, options]);

    // Stats
    const stats = useMemo(() => ({
        charsRemoved: input.length - output.length,
        linesRemoved: input.split("\n").length - output.split("\n").length,
    }), [input, output]);

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

    const toggleOption = (key: keyof CleanOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const optionLabels: { key: keyof CleanOptions; label: string }[] = [
        { key: "trimLines", label: "trim" },
        { key: "removeEmpty", label: "empty lines" },
        { key: "removeMultipleSpaces", label: "multi spaces" },
        { key: "removeMultipleNewlines", label: "multi newlines" },
    ];

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">paste or type text</p>
                <button
                    onClick={paste}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    <ClipboardText className="w-3 h-3" />
                    paste
                </button>
            </div>

            {/* Input */}
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste text with extra spaces, tabs, or empty lines..."
                className="w-full h-24 px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Options */}
            <div className="flex flex-wrap gap-1.5">
                {optionLabels.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => toggleOption(key)}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${options[key]
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Output */}
            {input && (
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                            {stats.charsRemoved > 0 || stats.linesRemoved > 0
                                ? `−${stats.charsRemoved} chars, ${stats.linesRemoved} lines`
                                : "no changes"
                            }
                        </span>
                        <button
                            onClick={copy}
                            className="text-primary hover:underline flex items-center gap-1"
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
