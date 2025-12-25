"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WifiHigh, WifiSlash, CaretDown, ArrowClockwise } from "@phosphor-icons/react";

interface PingResult {
    url: string;
    latency: number;
    status: "online" | "offline" | "slow";
    attempts: number[];
}

export function PingChecker() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PingResult | null>(null);
    const [error, setError] = useState("");
    const [showOptions, setShowOptions] = useState(false);

    const ping = async () => {
        if (!url) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            let target = url;
            if (!target.startsWith("http")) {
                target = `https://${target}`;
            }

            const attempts: number[] = [];

            // Perform 3 ping attempts
            for (let i = 0; i < 3; i++) {
                const start = performance.now();
                try {
                    await fetch(target, {
                        method: "HEAD",
                        mode: "no-cors",
                        cache: "no-store",
                    });
                    const end = performance.now();
                    attempts.push(Math.round(end - start));
                } catch {
                    attempts.push(-1);
                }
            }

            const validAttempts = attempts.filter(a => a >= 0);

            if (validAttempts.length === 0) {
                setResult({
                    url: new URL(target).hostname,
                    latency: -1,
                    status: "offline",
                    attempts,
                });
            } else {
                const avgLatency = Math.round(validAttempts.reduce((a, b) => a + b, 0) / validAttempts.length);
                setResult({
                    url: new URL(target).hostname,
                    latency: avgLatency,
                    status: avgLatency > 1000 ? "slow" : "online",
                    attempts,
                });
            }
        } catch (err: any) {
            setError("invalid url");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* URL Input */}
            <div className="flex gap-2">
                <Input
                    placeholder="example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && ping()}
                    className="flex-1 text-sm"
                />
                <Button onClick={ping} disabled={loading || !url} size="sm">
                    {loading ? <ArrowClockwise className="w-4 h-4 animate-spin" /> : "ping"}
                </Button>
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Result */}
            {result && (
                <>
                    <div className={`bg-muted/50 p-3 rounded-lg text-center space-y-2 ${result.status === "offline" ? "border border-destructive/50" : ""
                        }`}>
                        <div className="flex items-center justify-center gap-2">
                            {result.status === "online" ? (
                                <WifiHigh className="w-6 h-6 text-primary" />
                            ) : result.status === "slow" ? (
                                <WifiHigh className="w-6 h-6 text-yellow-500" />
                            ) : (
                                <WifiSlash className="w-6 h-6 text-destructive" />
                            )}
                            <p className="text-lg font-semibold">
                                {result.status === "online" ? "online" :
                                    result.status === "slow" ? "slow" : "offline"}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">{result.url}</p>
                    </div>

                    {result.status !== "offline" && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">latency</p>
                                <p className="font-medium">{result.latency}ms</p>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">status</p>
                                <p className={`font-medium ${result.status === "online" ? "text-primary" : "text-yellow-500"
                                    }`}>
                                    {result.status}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                        >
                            attempts
                            <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                                <CaretDown className="w-4 h-4" />
                            </motion.div>
                        </button>
                        {showOptions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="flex gap-2 overflow-hidden"
                            >
                                {result.attempts.map((attempt, i) => (
                                    <div key={i} className="flex-1 bg-muted/30 rounded-lg p-2 text-center">
                                        <p className="text-xs text-muted-foreground">#{i + 1}</p>
                                        <p className={`text-sm font-medium ${attempt < 0 ? "text-destructive" : ""}`}>
                                            {attempt < 0 ? "fail" : `${attempt}ms`}
                                        </p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    enter a url to check latency
                </p>
            )}
        </motion.div>
    );
}
