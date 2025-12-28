"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "@phosphor-icons/react";

type CaseType =
    | "lowercase"
    | "uppercase"
    | "titlecase"
    | "sentencecase"
    | "camelcase"
    | "pascalcase"
    | "snakecase"
    | "kebabcase"
    | "constantcase"
    | "alternating"
    | "inverse";

const CASE_OPTIONS: { id: CaseType; label: string }[] = [
    { id: "lowercase", label: "lower" },
    { id: "uppercase", label: "UPPER" },
    { id: "titlecase", label: "Title" },
    { id: "sentencecase", label: "Sentence" },
    { id: "camelcase", label: "camel" },
    { id: "pascalcase", label: "Pascal" },
    { id: "snakecase", label: "snake" },
    { id: "kebabcase", label: "kebab" },
    { id: "constantcase", label: "CONST" },
    { id: "alternating", label: "aLtErN" },
    { id: "inverse", label: "iNVERSE" },
];

function convertCase(text: string, caseType: CaseType): string {
    if (!text) return "";

    switch (caseType) {
        case "lowercase":
            return text.toLowerCase();
        case "uppercase":
            return text.toUpperCase();
        case "titlecase":
            return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        case "sentencecase":
            return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
        case "camelcase":
            return text
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
                .replace(/^./, c => c.toLowerCase());
        case "pascalcase":
            return text
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
                .replace(/^./, c => c.toUpperCase());
        case "snakecase":
            return text
                .replace(/([A-Z])/g, '_$1')
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+/g, '_')
                .replace(/^_|_$/g, '')
                .replace(/_+/g, '_');
        case "kebabcase":
            return text
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .replace(/-+/g, '-');
        case "constantcase":
            return text
                .replace(/([A-Z])/g, '_$1')
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_|_$/g, '')
                .replace(/_+/g, '_');
        case "alternating":
            return text
                .split('')
                .map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())
                .join('');
        case "inverse":
            return text
                .split('')
                .map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())
                .join('');
        default:
            return text;
    }
}

export function CaseConverter() {
    const [input, setInput] = useState("");
    const [caseType, setCaseType] = useState<CaseType>("lowercase");
    const [copied, setCopied] = useState(false);

    // Use useMemo to ensure output recalculates when deps change
    const output = useMemo(() => convertCase(input, caseType), [input, caseType]);

    const copy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const paste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInput(text);
        } catch { }
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Input */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-muted-foreground">input text</label>
                    <button onClick={paste} className="text-xs text-primary hover:underline">
                        paste
                    </button>
                </div>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type or paste text to convert..."
                    className="w-full h-20 px-3 py-2 text-sm bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Case type grid */}
            <div className="grid grid-cols-3 gap-1.5">
                {CASE_OPTIONS.slice(0, 6).map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setCaseType(opt.id)}
                        className={`px-2 py-2 text-xs rounded-lg transition-colors ${caseType === opt.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Advanced options */}
            <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    more options
                </summary>
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {CASE_OPTIONS.slice(6).map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setCaseType(opt.id)}
                            className={`px-2 py-2 text-xs rounded-lg transition-colors ${caseType === opt.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </details>

            {/* Output */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs text-muted-foreground">result</label>
                    <button
                        onClick={copy}
                        disabled={!output}
                        className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "copied!" : "copy"}
                    </button>
                </div>
                <div
                    className="p-3 bg-muted/30 border rounded-lg min-h-[60px] text-sm break-all font-mono"
                    style={{ textTransform: 'none' }}
                >
                    {output || <span className="text-muted-foreground font-sans">result will appear here</span>}
                </div>
            </div>
        </motion.div>
    );
}
