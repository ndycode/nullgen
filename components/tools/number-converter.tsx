"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowsClockwise } from "@phosphor-icons/react";

type NumberBase = "decimal" | "binary" | "octal" | "hex";

const BASES: { id: NumberBase; label: string; prefix: string; radix: number }[] = [
    { id: "decimal", label: "decimal", prefix: "", radix: 10 },
    { id: "binary", label: "binary", prefix: "0b", radix: 2 },
    { id: "octal", label: "octal", prefix: "0o", radix: 8 },
    { id: "hex", label: "hex", prefix: "0x", radix: 16 },
];

export function NumberConverter() {
    const [input, setInput] = useState("");
    const [inputBase, setInputBase] = useState<NumberBase>("decimal");
    const [copied, setCopied] = useState<string | null>(null);

    const conversions = useMemo(() => {
        if (!input.trim()) return null;

        const base = BASES.find(b => b.id === inputBase)!;
        let cleanInput = input.trim().toLowerCase();

        // Remove common prefixes
        if (cleanInput.startsWith("0x")) cleanInput = cleanInput.slice(2);
        if (cleanInput.startsWith("0b")) cleanInput = cleanInput.slice(2);
        if (cleanInput.startsWith("0o")) cleanInput = cleanInput.slice(2);

        const decimal = parseInt(cleanInput, base.radix);
        if (isNaN(decimal)) return null;

        return BASES.map(b => ({
            ...b,
            value: decimal.toString(b.radix).toUpperCase()
        }));
    }, [input, inputBase]);

    const copyValue = async (value: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(value);
        setTimeout(() => setCopied(null), 1500);
    };

    const clear = () => {
        setInput("");
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Input */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">enter number</p>
                    {input && (
                        <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground">
                            clear
                        </button>
                    )}
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={inputBase === "decimal" ? "255" : inputBase === "binary" ? "11111111" : inputBase === "octal" ? "377" : "FF"}
                    className="w-full px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Input base selector */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">input base</p>
                <div className="grid grid-cols-4 gap-1">
                    {BASES.map((base) => (
                        <button
                            key={base.id}
                            onClick={() => setInputBase(base.id)}
                            className={`py-1.5 text-xs rounded-lg transition-colors ${inputBase === base.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {base.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {conversions && (
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-xs text-muted-foreground">conversions</p>
                    <div className="space-y-1.5">
                        {conversions.map((conv) => (
                            <motion.div
                                key={conv.id}
                                className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                                whileHover={{ scale: 1.01 }}
                            >
                                <span className="text-xs text-muted-foreground w-16">{conv.label}</span>
                                <span className="flex-1 font-mono text-sm">
                                    <span className="text-muted-foreground">{conv.prefix}</span>
                                    {conv.value}
                                </span>
                                <button
                                    onClick={() => copyValue(conv.prefix + conv.value)}
                                    className="p-1 hover:bg-muted rounded transition-colors"
                                >
                                    {copied === conv.prefix + conv.value ? (
                                        <Check className="w-3 h-3 text-primary" />
                                    ) : (
                                        <Copy className="w-3 h-3 text-muted-foreground" />
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Error state */}
            {input && !conversions && (
                <motion.p
                    className="text-xs text-destructive text-center py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    invalid number for selected base
                </motion.p>
            )}
        </motion.div>
    );
}
