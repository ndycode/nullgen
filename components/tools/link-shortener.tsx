"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link as LinkIcon, CaretDown } from "@phosphor-icons/react";
import { EXPIRY_OPTIONS } from "@/lib/share-types";

export function LinkShortener() {
    const [url, setUrl] = useState("");
    const [expiry, setExpiry] = useState(2); // 24h default
    const [showOptions, setShowOptions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ code: string; url: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const shorten = async () => {
        if (!url) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "link",
                    content: url,
                    expiryMinutes: EXPIRY_OPTIONS[expiry].value,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(data);
            setUrl("");
        } catch (err: any) {
            setError(err.message || "Failed to shorten");
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const reset = () => {
        setResult(null);
        setError("");
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {result ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <LinkIcon weight="duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold">Shortened!</p>
                            <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                        </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <p className="text-lg font-mono font-bold">{result.url}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={copy} variant="outline" className="flex-1 gap-1.5">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                        <Button onClick={reset} className="flex-1">New</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Input
                            type="url"
                            placeholder="https://example.com/long-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="text-sm"
                        />
                        {url && (
                            <p className="text-xs text-muted-foreground">
                                {url.length} chars → ~6 chars
                            </p>
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                        >
                            options
                            <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                                <CaretDown className="w-4 h-4" />
                            </motion.div>
                        </button>
                        {showOptions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">expires in</p>
                                    <div className="flex gap-1">
                                        {EXPIRY_OPTIONS.map((opt, i) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setExpiry(i)}
                                                className={`px-2 py-1 text-xs rounded-lg ${expiry === i
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button onClick={shorten} disabled={!url || loading} className="w-full gap-2">
                        <LinkIcon className="w-4 h-4" />
                        {loading ? "Shortening..." : "Shorten"}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
