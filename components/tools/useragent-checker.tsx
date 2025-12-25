"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, Browser, CaretDown } from "@phosphor-icons/react";

interface UserAgentData {
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    device: string;
    mobile: boolean;
    platform: string;
    language: string;
    languages: string[];
    cookiesEnabled: boolean;
    doNotTrack: boolean;
    online: boolean;
    userAgent: string;
}

function parseUserAgent(): UserAgentData {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let browserVersion = "";
    let os = "Unknown";
    let osVersion = "";
    let device = "Desktop";

    // Browser detection
    if (ua.includes("Firefox/")) {
        browser = "Firefox";
        browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || "";
    } else if (ua.includes("Edg/")) {
        browser = "Edge";
        browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || "";
    } else if (ua.includes("Chrome/")) {
        browser = "Chrome";
        browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || "";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
        browser = "Safari";
        browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || "";
    }

    // OS detection
    if (ua.includes("Windows NT 10")) {
        os = "Windows";
        osVersion = "10/11";
    } else if (ua.includes("Windows")) {
        os = "Windows";
    } else if (ua.includes("Mac OS X")) {
        os = "macOS";
        osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
    } else if (ua.includes("Linux")) {
        os = "Linux";
    } else if (ua.includes("Android")) {
        os = "Android";
        osVersion = ua.match(/Android ([\d.]+)/)?.[1] || "";
    } else if (ua.includes("iPhone") || ua.includes("iPad")) {
        os = "iOS";
        osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
    }

    // Device detection
    const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    if (mobile) {
        device = ua.includes("iPad") ? "Tablet" : "Mobile";
    }

    return {
        browser,
        browserVersion,
        os,
        osVersion,
        device,
        mobile,
        platform: navigator.platform || "Unknown",
        language: navigator.language,
        languages: [...navigator.languages],
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack === "1",
        online: navigator.onLine,
        userAgent: ua,
    };
}

export function UserAgentChecker() {
    const [data, setData] = useState<UserAgentData | null>(null);
    const [copied, setCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        setData(parseUserAgent());
    }, []);

    const copy = async () => {
        if (!data) return;
        await navigator.clipboard.writeText(data.userAgent);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    if (!data) return null;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Main Result */}
            <div className="bg-muted/50 p-3 rounded-lg text-center space-y-1">
                <p className="text-lg font-semibold">{data.browser} {data.browserVersion.split(".")[0]}</p>
                <p className="text-xs text-muted-foreground">
                    {data.os} {data.osVersion} · {data.device}
                </p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">platform</p>
                    <p className="font-medium truncate">{data.platform}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">language</p>
                    <p className="font-medium">{data.language}</p>
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
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">cookies</p>
                                <p className="font-medium">{data.cookiesEnabled ? "enabled" : "disabled"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">do not track</p>
                                <p className="font-medium">{data.doNotTrack ? "on" : "off"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">online</p>
                                <p className="font-medium">{data.online ? "yes" : "no"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">languages</p>
                                <p className="font-medium truncate">{data.languages.length}</p>
                            </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2 mt-2">
                            <p className="text-xs text-muted-foreground mb-1">raw user agent</p>
                            <p className="text-xs font-mono break-all">{data.userAgent}</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Copy Button */}
            <Button onClick={copy} variant="outline" className="w-full gap-1.5">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "copied!" : "copy user agent"}
            </Button>
        </motion.div>
    );
}
