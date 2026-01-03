"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, ArrowsClockwise, Check } from "@phosphor-icons/react";
import { triggerSparkle } from "@/lib/confetti";

interface Options {
    length: number;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
}

const CHARS = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export function PassGen() {
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);
    const [options, setOptions] = useState<Options>({
        length: 16,
        uppercase: true,
        numbers: true,
        symbols: true,
    });

    const generatePassword = useCallback(() => {
        let charset = CHARS.lowercase;
        if (options.uppercase) charset += CHARS.uppercase;
        if (options.numbers) charset += CHARS.numbers;
        if (options.symbols) charset += CHARS.symbols;

        let result = "";
        const array = new Uint32Array(options.length);
        crypto.getRandomValues(array);

        for (let i = 0; i < options.length; i++) {
            result += charset[array[i] % charset.length];
        }

        setPassword(result);
        setCopied(false);
    }, [options]);

    const handleCopy = async () => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            triggerSparkle();
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Silent fail
        }
    };

    const toggleOption = (key: keyof Omit<Options, "length">) => {
        // Ensure at least one option stays enabled
        const enabledCount = [options.uppercase, options.numbers, options.symbols].filter(Boolean).length;
        if (options[key] && enabledCount <= 1) return;

        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 flex flex-col space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Password display */}
            <div
                onClick={handleCopy}
                className="relative bg-muted/50 rounded-xl p-4 min-h-zone-md flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors"
            >
                {password ? (
                    <motion.p
                        key={password}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-mono text-sm break-all text-center leading-relaxed select-all"
                    >
                        {password}
                    </motion.p>
                ) : (
                    <p className="text-muted-foreground text-sm">
                        click generate to create password
                    </p>
                )}
                {password && (
                    <div className="absolute top-2 right-2 text-muted-foreground">
                        {copied ? (
                            <Check className="w-4 h-4 text-primary" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </div>
                )}
            </div>

            {/* Length slider */}
            <div
                className="space-y-2"
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">length</span>
                    <span className="font-medium">{options.length}</span>
                </div>
                <input
                    type="range"
                    min={8}
                    max={64}
                    value={options.length}
                    onChange={(e) => setOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary touch-none"
                />
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-2">
                {(["uppercase", "numbers", "symbols"] as const).map((opt) => (
                    <button
                        key={opt}
                        onClick={() => toggleOption(opt)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${options[opt]
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    onClick={generatePassword}
                    className="flex-1 gap-1.5"
                >
                    <ArrowsClockwise className="w-4 h-4" />
                    Generate
                </Button>
                <Button
                    variant="outline"
                    onClick={handleCopy}
                    disabled={!password}
                    className="gap-1.5"
                >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy"}
                </Button>
            </div>
        </motion.div>
    );
}
