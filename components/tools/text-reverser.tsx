"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowsLeftRight } from "@phosphor-icons/react";

type ReverseMode = "chars" | "words" | "lines";

export function TextReverser() {
    const [input, setInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [mode, setMode] = useState<ReverseMode>("chars");

    const output = useMemo(() => {
        if (!input) return "";

        switch (mode) {
            case "chars":
                return input.split("").reverse().join("");
            case "words":
                return input.split(/(\s+)/).reverse().join("");
            case "lines":
                return input.split("\n").reverse().join("\n");
            default:
                return input;
        }
    }, [input, mode]);

    const isPalindrome = useMemo(() => {
        if (!input.trim()) return false;
        const clean = input.toLowerCase().replace(/[^a-z0-9]/g, "");
        return clean === clean.split("").reverse().join("");
    }, [input]);

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

    const modes: { id: ReverseMode; label: string }[] = [
        { id: "chars", label: "characters" },
        { id: "words", label: "words" },
        { id: "lines", label: "lines" },
    ];

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                    {mode === "chars" ? "abc → cba" : mode === "words" ? "hello world → world hello" : "line1↵line2 → line2↵line1"}
                </p>
                <button onClick={paste} className="text-xs text-primary hover:underline">
                    paste
                </button>
            </div>

            {/* Input */}
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === "chars" ? "Hello World → dlroW olleH" : mode === "words" ? "The Quick Brown → Brown Quick The" : "First\nSecond\nThird"}
                className="w-full h-20 px-3 py-2 text-sm bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Mode selector */}
            <div className="flex gap-1.5">
                {modes.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${mode === m.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Palindrome check */}
            {input.trim() && (
                <motion.div
                    className={`text-xs text-center py-2 rounded-lg ${isPalindrome
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/30 text-muted-foreground"
                        }`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {isPalindrome ? "✓ palindrome!" : "not a palindrome"}
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
                        <p className="text-xs text-muted-foreground">reversed</p>
                        <button
                            onClick={copy}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? "copied!" : "copy"}
                        </button>
                    </div>
                    <div className="p-3 bg-muted/30 border rounded-lg min-h-zone-sm text-sm break-all font-mono">
                        {output}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
