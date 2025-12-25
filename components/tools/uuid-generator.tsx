"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

type UuidVersion = "v4" | "v1-like";

function generateUUIDv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function generateUUIDv1Like(): string {
    const now = Date.now();
    const hex = now.toString(16).padStart(12, "0");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-1xxx-yxxx-xxxxxxxxxxxx`.replace(
        /[xy]/g,
        (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

export function UuidGenerator() {
    const [uuids, setUuids] = useState<string[]>([generateUUIDv4()]);
    const [version, setVersion] = useState<UuidVersion>("v4");
    const [count, setCount] = useState(1);
    const [uppercase, setUppercase] = useState(false);
    const [noDashes, setNoDashes] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        const newUuids: string[] = [];
        for (let i = 0; i < count; i++) {
            let uuid = version === "v4" ? generateUUIDv4() : generateUUIDv1Like();
            if (uppercase) uuid = uuid.toUpperCase();
            if (noDashes) uuid = uuid.replace(/-/g, "");
            newUuids.push(uuid);
        }
        setUuids(newUuids);
    }, [count, version, uppercase, noDashes]);

    const copyUuid = async (uuid: string) => {
        await navigator.clipboard.writeText(uuid);
        setCopied(uuid);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(uuids.join("\n"));
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Generated UUIDs */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {uuids.map((uuid, i) => (
                    <motion.div
                        key={`${uuid}-${i}`}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <span className="flex-1 font-mono text-xs break-all">{uuid}</span>
                        <button
                            onClick={() => copyUuid(uuid)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                            {copied === uuid ? (
                                <Check className="w-3 h-3 text-primary" />
                            ) : (
                                <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Generate button */}
            <motion.button
                onClick={generate}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <ArrowClockwise className="w-4 h-4" />
                generate {count > 1 ? `${count} UUIDs` : "UUID"}
            </motion.button>

            {/* Options */}
            <div className="flex flex-wrap gap-1.5">
                <button
                    onClick={() => setVersion(version === "v4" ? "v1-like" : "v4")}
                    className="px-2.5 py-1.5 text-xs bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors"
                >
                    {version}
                </button>
                <button
                    onClick={() => setUppercase(!uppercase)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${uppercase
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    UPPERCASE
                </button>
                <button
                    onClick={() => setNoDashes(!noDashes)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${noDashes
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    no dashes
                </button>
            </div>

            {/* Count selector */}
            <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    advanced options
                </summary>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">count</span>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                        <span className="text-xs w-6 text-center">{count}</span>
                    </div>
                </div>
            </details>

            {/* Copy all */}
            {uuids.length > 1 && (
                <button
                    onClick={copyAll}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                    {copied === "all" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    {copied === "all" ? "copied all!" : "copy all"}
                </button>
            )}
        </motion.div>
    );
}
