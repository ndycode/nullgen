"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, CaretDown, ArrowClockwise } from "@phosphor-icons/react";

interface WhoisData {
    domain: string;
    registrar: string;
    created: string;
    expires: string;
    updated: string;
    nameservers: string[];
    status: string[];
}

export function WhoisChecker() {
    const [domain, setDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<WhoisData | null>(null);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const lookup = async () => {
        if (!domain) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            // Use RDAP (Registration Data Access Protocol) - the modern replacement for WHOIS
            const tld = domain.split(".").pop() || "";

            // Try to get RDAP bootstrap for the TLD
            const bootstrapRes = await fetch("https://data.iana.org/rdap/dns.json");
            const bootstrap = await bootstrapRes.json();

            let rdapUrl = "";
            for (const service of bootstrap.services) {
                if (service[0].includes(tld)) {
                    rdapUrl = service[1][0];
                    break;
                }
            }

            if (!rdapUrl) {
                throw new Error("TLD not supported");
            }

            const res = await fetch(`${rdapUrl}domain/${domain}`);
            if (!res.ok) throw new Error("domain not found");

            const data = await res.json();

            // Parse RDAP response
            const events = data.events || [];
            const created = events.find((e: any) => e.eventAction === "registration")?.eventDate || "";
            const expires = events.find((e: any) => e.eventAction === "expiration")?.eventDate || "";
            const updated = events.find((e: any) => e.eventAction === "last changed")?.eventDate || "";

            const registrarEntity = data.entities?.find((e: any) => e.roles?.includes("registrar"));
            const registrar = registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3] ||
                registrarEntity?.publicIds?.[0]?.identifier || "unknown";

            const nameservers = data.nameservers?.map((ns: any) => ns.ldhName) || [];
            const status = data.status || [];

            setResult({
                domain: data.ldhName,
                registrar,
                created: created ? new Date(created).toLocaleDateString() : "unknown",
                expires: expires ? new Date(expires).toLocaleDateString() : "unknown",
                updated: updated ? new Date(updated).toLocaleDateString() : "unknown",
                nameservers,
                status,
            });
        } catch (err: any) {
            setError(err.message || "lookup failed");
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        if (!result) return;
        const text = `Domain: ${result.domain}\nRegistrar: ${result.registrar}\nCreated: ${result.created}\nExpires: ${result.expires}`;
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
                    <div className="bg-muted/50 p-3 rounded-lg text-center space-y-1">
                        <p className="text-lg font-mono font-bold">{result.domain}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.registrar}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">created</p>
                            <p className="font-medium">{result.created}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">expires</p>
                            <p className="font-medium">{result.expires}</p>
                        </div>
                    </div>

                    {/* Options (Details) */}
                    <div>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                        >
                            details
                            <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                                <CaretDown className="w-4 h-4" />
                            </motion.div>
                        </button>
                        {showOptions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="space-y-2 overflow-hidden text-sm"
                            >
                                <div>
                                    <p className="text-xs text-muted-foreground">updated</p>
                                    <p className="font-medium">{result.updated}</p>
                                </div>
                                {result.nameservers.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">nameservers</p>
                                        {result.nameservers.slice(0, 4).map((ns, i) => (
                                            <p key={i} className="font-mono text-xs">{ns}</p>
                                        ))}
                                    </div>
                                )}
                                {result.status.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">status</p>
                                        <p className="text-xs">{result.status.slice(0, 3).join(", ")}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    <Button onClick={copy} variant="outline" className="w-full gap-1.5">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "copied!" : "copy info"}
                    </Button>
                </>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    enter a domain to lookup whois info
                </p>
            )}
        </motion.div>
    );
}
