"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cookie, Check, X, CaretDown } from "@phosphor-icons/react";

interface CookieData {
    enabled: boolean;
    thirdParty: boolean | null;
    sessionStorage: boolean;
    localStorage: boolean;
    indexedDB: boolean;
}

export function CookiesChecker() {
    const [data, setData] = useState<CookieData | null>(null);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        // Check third-party cookies (approximate)
        let thirdParty: boolean | null = null;
        try {
            // Can't reliably detect third-party cookies from JS
            thirdParty = null;
        } catch {
            thirdParty = null;
        }

        setData({
            enabled: navigator.cookieEnabled,
            thirdParty,
            sessionStorage: (() => { try { return !!window.sessionStorage; } catch { return false; } })(),
            localStorage: (() => { try { return !!window.localStorage; } catch { return false; } })(),
            indexedDB: (() => { try { return !!window.indexedDB; } catch { return false; } })(),
        });
    }, []);

    if (!data) return null;

    const StatusIcon = ({ enabled }: { enabled: boolean | null }) => {
        if (enabled === null) return <span className="text-muted-foreground text-xs">unknown</span>;
        return enabled ?
            <Check className="w-4 h-4 text-primary" /> :
            <X className="w-4 h-4 text-destructive" />;
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Main Result */}
            <div className={`bg-muted/50 p-3 rounded-lg text-center space-y-1 ${data.enabled ? "" : "border border-destructive/50"}`}>
                <p className="text-lg font-semibold">{data.enabled ? "cookies enabled" : "cookies disabled"}</p>
                <p className="text-xs text-muted-foreground">
                    {data.enabled ? "your browser accepts cookies" : "cookies are blocked"}
                </p>
            </div>

            {/* Quick Storage Status */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/30 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-muted-foreground">localStorage</span>
                    <StatusIcon enabled={data.localStorage} />
                </div>
                <div className="bg-muted/30 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-muted-foreground">sessionStorage</span>
                    <StatusIcon enabled={data.sessionStorage} />
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
                        <div className="flex items-center justify-between py-1">
                            <span>cookies</span>
                            <StatusIcon enabled={data.enabled} />
                        </div>
                        <div className="flex items-center justify-between py-1">
                            <span>localStorage</span>
                            <StatusIcon enabled={data.localStorage} />
                        </div>
                        <div className="flex items-center justify-between py-1">
                            <span>sessionStorage</span>
                            <StatusIcon enabled={data.sessionStorage} />
                        </div>
                        <div className="flex items-center justify-between py-1">
                            <span>indexedDB</span>
                            <StatusIcon enabled={data.indexedDB} />
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
