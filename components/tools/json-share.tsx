"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, Rows, CaretDown, Lock, Warning } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { EXPIRY_OPTIONS } from "@/lib/share-types";

export function JsonShare() {
    const [content, setContent] = useState("");
    const [expiry, setExpiry] = useState(2);
    const [password, setPassword] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ code: string; url: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [validationError, setValidationError] = useState("");

    const validateJson = (text: string) => {
        if (!text) {
            setValidationError("");
            return;
        }
        try {
            JSON.parse(text);
            setValidationError("");
        } catch (e: any) {
            setValidationError(e.message || "Invalid JSON");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        validateJson(e.target.value);
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(content);
            setContent(JSON.stringify(parsed, null, 2));
            setValidationError("");
        } catch { }
    };

    const create = async () => {
        if (!content || validationError) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "json",
                    content,
                    expiryMinutes: EXPIRY_OPTIONS[expiry].value,
                    password: password || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(data);
            setContent("");
        } catch (err: any) {
            setError(err.message || "Failed to create");
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
                            <Rows weight="duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold">JSON shared!</p>
                            <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                        </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <p className="text-lg font-mono font-bold">{result.code}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={copy} variant="outline" className="flex-1 gap-1.5">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Copy link"}
                        </Button>
                        <Button onClick={reset} className="flex-1">New</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">paste JSON</p>
                        <button
                            onClick={formatJson}
                            className="text-xs text-primary hover:underline"
                            disabled={!content || !!validationError}
                        >
                            format
                        </button>
                    </div>

                    <textarea
                        placeholder='{"key": "value"}'
                        value={content}
                        onChange={handleChange}
                        className={`w-full h-32 px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 ${validationError ? "border-destructive focus:ring-destructive/50" : "focus:ring-primary/50"
                            }`}
                    />

                    {validationError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                            <Warning className="w-3 h-3" /> {validationError}
                        </p>
                    )}

                    {content && !validationError && (
                        <p className="text-xs text-muted-foreground">
                            {content.length.toLocaleString()} chars · valid JSON
                        </p>
                    )}

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
                                    <div className="flex gap-1 flex-wrap">
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
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> password
                                    </p>
                                    <Input
                                        type="password"
                                        placeholder="Optional"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button onClick={create} disabled={!content || !!validationError || loading} className="w-full gap-2">
                        <Rows className="w-4 h-4" />
                        {loading ? "Creating..." : "Share JSON"}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
