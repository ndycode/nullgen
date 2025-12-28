"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, Globe, CaretDown, ArrowClockwise } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";

interface IpData {
    ip: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    mobile: boolean;
    proxy: boolean;
    hosting: boolean;
}

export function IpChecker() {
    const [data, setData] = useState<IpData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const fetchIp = async () => {
        setLoading(true);
        setError("");

        try {
            // Use ipapi.co which supports HTTPS
            const res = await fetch("https://ipapi.co/json/");
            const json = await res.json();

            if (json.error) {
                throw new Error(json.reason || "Failed to get IP info");
            }

            setData({
                ip: json.ip,
                country: json.country_name,
                countryCode: json.country_code,
                region: json.region_code,
                regionName: json.region,
                city: json.city,
                zip: json.postal,
                lat: json.latitude,
                lon: json.longitude,
                timezone: json.timezone,
                isp: json.org,
                org: json.org,
                as: json.asn,
                mobile: false,
                proxy: false,
                hosting: json.org?.toLowerCase().includes("cloud") || json.org?.toLowerCase().includes("hosting") || false,
            });
        } catch (err: any) {
            setError(err.message || "Failed to fetch IP data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIp();
    }, []);

    const copy = async () => {
        if (!data) return;
        await navigator.clipboard.writeText(data.ip);
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
            {loading ? (
                <div className="space-y-3 py-2">
                    <Skeleton className="h-10 w-2/3 mx-auto" />
                    <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-8" />
                        <Skeleton className="h-8" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ) : error ? (
                <div className="py-6 text-center space-y-3">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button onClick={fetchIp} variant="outline" size="sm" className="gap-1.5">
                        <ArrowClockwise className="w-4 h-4" />
                        retry
                    </Button>
                </div>
            ) : data ? (
                <div className="space-y-4">
                    {/* Main Result */}
                    <div className="bg-muted/50 p-3 rounded-lg text-center space-y-1">
                        <p className="text-base sm:text-xl font-mono font-bold break-all leading-relaxed">{data.ip}</p>
                        <p className="text-xs text-muted-foreground break-words">
                            {data.city}, {data.regionName}, {data.countryCode}
                        </p>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 rounded-lg p-2 min-w-0">
                            <p className="text-xs text-muted-foreground">isp</p>
                            <p className="font-medium text-sm truncate">{data.isp}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2 min-w-0">
                            <p className="text-xs text-muted-foreground">timezone</p>
                            <p className="font-medium text-sm truncate">{data.timezone}</p>
                        </div>
                    </div>

                    {/* Options (Advanced Details) */}
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
                                        <p className="text-xs text-muted-foreground">country</p>
                                        <p className="font-medium">{data.countryCode} {data.country}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">region</p>
                                        <p className="font-medium">{data.regionName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">city</p>
                                        <p className="font-medium">{data.city}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">zip</p>
                                        <p className="font-medium">{data.zip || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">coords</p>
                                        <p className="font-medium">{data.lat.toFixed(4)}, {data.lon.toFixed(4)}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">as</p>
                                        <p className="font-medium text-xs truncate">{data.as.split(" ")[0]}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">org</p>
                                        <p className="font-medium text-xs truncate">{data.org || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">type</p>
                                        <p className="font-medium">
                                            {data.mobile ? "mobile" : "desktop"} · {data.hosting ? "hosting" : "residential"}
                                        </p>
                                    </div>
                                </div>
                                {data.proxy && (
                                    <p className="text-xs text-destructive">vpn/proxy detected</p>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button onClick={copy} variant="outline" className="flex-1 gap-1.5">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "copied!" : "copy ip"}
                        </Button>
                        <Button onClick={fetchIp} variant="outline" className="gap-1.5">
                            <ArrowClockwise className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </motion.div>
    );
}
