"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowsLeftRight, Clock } from "@phosphor-icons/react";

type Mode = "unix-to-human" | "human-to-unix";

export function TimestampTool() {
    const [mode, setMode] = useState<Mode>("unix-to-human");
    const [unixInput, setUnixInput] = useState("");
    const [dateInput, setDateInput] = useState("");
    const [timeInput, setTimeInput] = useState("");
    const [currentUnix, setCurrentUnix] = useState(0);
    const [output, setOutput] = useState("");
    const [copied, setCopied] = useState(false);

    // Update current timestamp every second
    useEffect(() => {
        const update = () => setCurrentUnix(Math.floor(Date.now() / 1000));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    const convert = () => {
        try {
            if (mode === "unix-to-human") {
                const ts = parseInt(unixInput);
                if (isNaN(ts)) {
                    setOutput("Invalid timestamp");
                    return;
                }
                // Handle seconds vs milliseconds
                const date = new Date(ts > 9999999999 ? ts : ts * 1000);
                setOutput(date.toLocaleString() + "\n" + date.toISOString());
            } else {
                if (!dateInput) {
                    setOutput("Please enter a date");
                    return;
                }
                const dateStr = `${dateInput}T${timeInput || "00:00"}`;
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    setOutput("Invalid date");
                    return;
                }
                const unix = Math.floor(date.getTime() / 1000);
                setOutput(`${unix}\n(milliseconds: ${date.getTime()})`);
            }
        } catch {
            setOutput("Conversion failed");
        }
    };

    const useNow = () => {
        if (mode === "unix-to-human") {
            setUnixInput(currentUnix.toString());
        } else {
            const now = new Date();
            setDateInput(now.toISOString().split("T")[0]);
            setTimeInput(now.toTimeString().slice(0, 5));
        }
    };

    const swap = () => {
        setMode(mode === "unix-to-human" ? "human-to-unix" : "unix-to-human");
        setOutput("");
    };

    const copy = async () => {
        const textToCopy = output.split("\n")[0];
        await navigator.clipboard.writeText(textToCopy);
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
            {/* Current time */}
            <div className="bg-muted/50 p-3 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">current unix timestamp</p>
                <p className="text-2xl font-mono font-bold">{currentUnix}</p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1">
                <button
                    onClick={() => setMode("unix-to-human")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${mode === "unix-to-human"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Unix → Human
                </button>
                <button
                    onClick={swap}
                    className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    title="Swap mode"
                >
                    <ArrowsLeftRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setMode("human-to-unix")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${mode === "human-to-unix"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Human → Unix
                </button>
            </div>

            {/* Input */}
            {mode === "unix-to-human" ? (
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">unix timestamp</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="1704067200"
                            value={unixInput}
                            onChange={(e) => setUnixInput(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Button onClick={useNow} variant="outline" size="sm" className="gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Now
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-muted-foreground">date</label>
                            <input
                                type="date"
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-muted-foreground">time</label>
                            <input
                                type="time"
                                value={timeInput}
                                onChange={(e) => setTimeInput(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                    <Button onClick={useNow} variant="outline" size="sm" className="w-full gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Use Current Time
                    </Button>
                </div>
            )}

            <Button onClick={convert} className="w-full">
                Convert
            </Button>

            {/* Output */}
            {output && (
                <div className="space-y-2">
                    <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-mono whitespace-pre-line">{output}</p>
                    </div>
                    <Button onClick={copy} variant="outline" size="sm" className="w-full gap-1">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
