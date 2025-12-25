"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, CaretDown, ArrowClockwise } from "@phosphor-icons/react";

interface DnsRecord {
    name: string;
    type: number;
    TTL: number;
    data: string;
}

interface DnsResult {
    records: DnsRecord[];
    status: number;
}

const RECORD_TYPES: Record<number, string> = {
    1: "A",
    28: "AAAA",
    5: "CNAME",
    15: "MX",
    16: "TXT",
    2: "NS",
};

export function DnsChecker() {
    const [domain, setDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DnsResult | null>(null);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const lookup = async () => {
        if (!domain) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            // Query multiple record types
            const types = [1, 28, 15, 16, 2]; // A, AAAA, MX, TXT, NS
            const records: DnsRecord[] = [];

            for (const type of types) {
                try {
                    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`);
                    const data = await res.json();
                    if (data.Answer) {
                        records.push(...data.Answer);
                    }
                } catch {
                    // Skip failed record types
                }
            }

            if (records.length === 0) {
                setError("no records found");
            } else {
                setResult({ records, status: 0 });
            }
        } catch (err: any) {
            setError(err.message || "lookup failed");
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        if (!result) return;
        const text = result.records.map(r => `${RECORD_TYPES[r.type] || r.type}: ${r.data}`).join("\n");
        await navigator.clipboard.writeText(text);
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
            {/* Domain Input */}
            <div className="flex gap-2">
                <Input
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && lookup()}
                    className="flex-1 text-sm"
                />
                <Button onClick={lookup} disabled={loading || !domain} size="sm">
                    {loading ? <ArrowClockwise className="w-4 h-4 animate-spin" /> : "lookup"}
                </Button>
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Results */}
            {result && (
                <>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                        {result.records.slice(0, showOptions ? undefined : 5).map((record, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                                    {RECORD_TYPES[record.type] || record.type}
                                </span>
                                <span className="font-mono text-xs break-all flex-1">{record.data}</span>
                            </div>
                        ))}
                    </div>

                    {result.records.length > 5 && (
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                        >
                            {showOptions ? "show less" : `+${result.records.length - 5} more`}
                            <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                                <CaretDown className="w-4 h-4" />
                            </motion.div>
                        </button>
                    )}

                    <Button onClick={copy} variant="outline" className="w-full gap-1.5">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "copied!" : "copy records"}
                    </Button>
                </>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    enter a domain to lookup dns records
                </p>
            )}
        </motion.div>
    );
}
