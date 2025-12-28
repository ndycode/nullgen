"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Warning, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function RegexTester() {
    const [pattern, setPattern] = useState("");
    const [flags, setFlags] = useState("g");
    const [testString, setTestString] = useState("");
    const [copied, setCopied] = useState(false);

    const FLAG_OPTIONS = [
        { flag: "g", label: "global", description: "Find all matches" },
        { flag: "i", label: "case", description: "Case insensitive" },
        { flag: "m", label: "multi", description: "Multiline mode" },
    ];

    const toggleFlag = (flag: string) => {
        if (flags.includes(flag)) {
            setFlags(flags.replace(flag, ""));
        } else {
            setFlags(flags + flag);
        }
    };

    const result = useMemo(() => {
        if (!pattern || !testString) {
            return { valid: true, matches: [], error: "" };
        }

        try {
            const regex = new RegExp(pattern, flags);
            const matches: { match: string; index: number; groups?: string[] }[] = [];

            if (flags.includes("g")) {
                let match;
                while ((match = regex.exec(testString)) !== null) {
                    matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1),
                    });
                }
            } else {
                const match = testString.match(regex);
                if (match) {
                    matches.push({
                        match: match[0],
                        index: testString.indexOf(match[0]),
                        groups: match.slice(1),
                    });
                }
            }

            return { valid: true, matches, error: "" };
        } catch (e: any) {
            return { valid: false, matches: [], error: e.message || "Invalid regex" };
        }
    }, [pattern, flags, testString]);

    const highlightedText = useMemo(() => {
        if (!result.valid || result.matches.length === 0 || !testString) {
            return testString;
        }

        try {
            const regex = new RegExp(pattern, flags);
            return testString.replace(regex, (match) => `【${match}】`);
        } catch {
            return testString;
        }
    }, [testString, pattern, flags, result]);

    const copyPattern = async () => {
        await navigator.clipboard.writeText(`/${pattern}/${flags}`);
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
            {/* Pattern input */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground">regex pattern</label>
                <div className="flex items-center gap-1 bg-muted/50 border rounded-lg px-2">
                    <span className="text-muted-foreground">/</span>
                    <input
                        type="text"
                        placeholder="[a-z]+"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        className="flex-1 py-2 text-sm font-mono bg-transparent focus:outline-none"
                    />
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm font-mono text-primary">{flags || "​"}</span>
                </div>
            </div>

            {/* Flags */}
            <div className="flex gap-1">
                {FLAG_OPTIONS.map((opt) => (
                    <button
                        key={opt.flag}
                        onClick={() => toggleFlag(opt.flag)}
                        title={opt.description}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${flags.includes(opt.flag)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Test string */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground">test string</label>
                <textarea
                    placeholder="Enter text to test..."
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    className="w-full h-24 px-3 py-2 text-sm bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Error */}
            {!result.valid && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                    <Warning className="w-4 h-4" />
                    {result.error}
                </div>
            )}

            {/* Results */}
            {result.valid && pattern && testString && (
                <div className="space-y-3">
                    {/* Match count */}
                    <div className={`flex items-center gap-2 text-sm ${result.matches.length > 0 ? "text-success" : "text-muted-foreground"}`}>
                        {result.matches.length > 0 ? (
                            <>
                                <CheckCircle weight="fill" className="w-4 h-4" />
                                {result.matches.length} match{result.matches.length !== 1 ? "es" : ""} found
                            </>
                        ) : (
                            "No matches"
                        )}
                    </div>

                    {/* Highlighted text */}
                    {result.matches.length > 0 && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm break-all whitespace-pre-wrap">
                                {highlightedText.split(/【|】/).map((part, i) => (
                                    <span key={i} className={i % 2 === 1 ? "bg-primary/30 text-primary px-0.5 rounded" : ""}>
                                        {part}
                                    </span>
                                ))}
                            </p>
                        </div>
                    )}

                    {/* Match details */}
                    {result.matches.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">matches:</p>
                            <div className="flex flex-wrap gap-1">
                                {result.matches.slice(0, 10).map((m, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                                        "{m.match}"
                                    </span>
                                ))}
                                {result.matches.length > 10 && (
                                    <span className="px-2 py-0.5 text-xs text-muted-foreground">
                                        +{result.matches.length - 10} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Copy button */}
            {pattern && (
                <Button onClick={copyPattern} variant="outline" size="sm" className="w-full gap-1">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : `Copy /${pattern}/${flags}`}
                </Button>
            )}
        </motion.div>
    );
}
