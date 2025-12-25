"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Check, DownloadSimple, Barcode as BarcodeIcon } from "@phosphor-icons/react";
import JsBarcode from "jsbarcode";

type BarcodeFormat = "CODE128" | "EAN13" | "UPC" | "CODE39" | "ITF14";

const FORMATS: { id: BarcodeFormat; label: string; placeholder: string }[] = [
    { id: "CODE128", label: "code128", placeholder: "ABC-12345" },
    { id: "EAN13", label: "ean-13", placeholder: "5901234123457" },
    { id: "UPC", label: "upc-a", placeholder: "012345678905" },
    { id: "CODE39", label: "code39", placeholder: "HELLO123" },
    { id: "ITF14", label: "itf-14", placeholder: "10012345678902" },
];

export function BarcodeGen() {
    const [text, setText] = useState("VXID-2024");
    const [format, setFormat] = useState<BarcodeFormat>("CODE128");
    const [showText, setShowText] = useState(true);
    const [copied, setCopied] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!text.trim() || !svgRef.current) return;

        try {
            JsBarcode(svgRef.current, text, {
                format: format,
                displayValue: showText,
                background: "transparent",
                lineColor: "currentColor",
                width: 2,
                height: 60,
                margin: 10,
                fontSize: 14,
                font: "inherit",
            });
            setError(null);
        } catch (e) {
            setError("invalid input for this format");
        }
    }, [text, format, showText]);

    const download = () => {
        if (!svgRef.current) return;
        const svg = svgRef.current.outerHTML;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `barcode-${text}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyAsSvg = async () => {
        if (!svgRef.current) return;
        await navigator.clipboard.writeText(svgRef.current.outerHTML);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const currentFormat = FORMATS.find(f => f.id === format)!;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Input */}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">text to encode</p>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.toUpperCase())}
                    placeholder={currentFormat.placeholder}
                    className="w-full px-3 py-2 text-sm font-mono bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Format selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {FORMATS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${format === f.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Barcode preview */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
                <svg ref={svgRef} className="text-black" />
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
            )}

            {/* Options */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setShowText(!showText)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${showText
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    show text
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={copyAsSvg}
                        className="px-2.5 py-1.5 text-xs bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-1"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "copied!" : "copy svg"}
                    </button>
                    <button
                        onClick={download}
                        className="px-2.5 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg transition-colors flex items-center gap-1"
                    >
                        <DownloadSimple className="w-3 h-3" />
                        download
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
