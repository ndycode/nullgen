"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowsLeftRight } from "@phosphor-icons/react";

type Mode = "encode" | "decode";

export function Base64Tool() {
    const [mode, setMode] = useState<Mode>("encode");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const convert = () => {
        setError("");
        try {
            if (mode === "encode") {
                setOutput(btoa(unescape(encodeURIComponent(input))));
            } else {
                setOutput(decodeURIComponent(escape(atob(input))));
            }
        } catch (e) {
            setError(mode === "decode" ? "Invalid base64 string" : "Encoding failed");
            setOutput("");
        }
    };

    const swap = () => {
        setMode(mode === "encode" ? "decode" : "encode");
        setInput(output);
        setOutput("");
        setError("");
    };

    const copy = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Mode toggle */}
            <div className="flex gap-1">
                <button
                    onClick={() => setMode("encode")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${mode === "encode"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Encode
                </button>
                <button
                    onClick={swap}
                    className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    title="Swap input and output"
                >
                    <ArrowsLeftRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setMode("decode")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${mode === "decode"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Decode
                </button>
            </div>

            {/* Input */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                    {mode === "encode" ? "text to encode" : "base64 to decode"}
                </label>
                <textarea
                    placeholder={mode === "encode" ? "Enter text..." : "Enter base64..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-24 px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            <Button onClick={convert} disabled={!input} className="w-full">
                {mode === "encode" ? "Encode to Base64" : "Decode from Base64"}
            </Button>

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Output */}
            {output && (
                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">result</label>
                    <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-mono break-all">{output}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            {output.length} chars
                        </p>
                        <Button onClick={copy} variant="outline" size="sm" className="gap-1">
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
