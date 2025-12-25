"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, Fire, CaretDown, Lock } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

export function SecretNote() {
    const [content, setContent] = useState("");
    const [password, setPassword] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ code: string; url: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const create = async () => {
        if (!content) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "note",
                    content,
                    expiryMinutes: 10080, // 7 days max
                    password: password || undefined,
                    burnAfterReading: true,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(data);
            setContent("");
            setPassword("");
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
                        <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                            <Fire weight="duotone" className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold">Secret note created!</p>
                            <p className="text-xs text-muted-foreground">Destroys after reading</p>
                        </div>
                    </div>
                    <div className="bg-destructive/10 p-3 rounded-lg text-center">
                        <p className="text-lg font-mono font-bold text-destructive">{result.code}</p>
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
                    <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-lg flex items-center gap-2">
                        <Fire weight="fill" className="w-3.5 h-3.5" />
                        Note will self-destruct after being read once
                    </div>

                    <div className="space-y-1">
                        <textarea
                            placeholder="Your secret message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-28 px-3 py-2 text-sm bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {content && (
                            <p className="text-xs text-muted-foreground">
                                {content.length.toLocaleString()} chars · expires in 7 days
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
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> password (optional)
                                    </p>
                                    <Input
                                        type="password"
                                        placeholder="Add extra protection"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button onClick={create} disabled={!content || loading} className="w-full gap-2">
                        <Fire className="w-4 h-4" />
                        {loading ? "Creating..." : "Create secret note"}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
