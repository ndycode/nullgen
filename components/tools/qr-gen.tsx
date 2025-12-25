"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { DownloadSimple, Copy, Link as LinkIcon, TextT, Check } from "@phosphor-icons/react";
import { THEME_COLORS, QR_PRESETS } from "@/lib/colors";

export function QRGen() {
    const [text, setText] = useState("");
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [fgColor, setFgColor] = useState<string>(THEME_COLORS.black);
    const [bgColor, setBgColor] = useState<string>(THEME_COLORS.white);
    const [size, setSize] = useState(160);
    const qrRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Silent fail
        }
    };

    const handleDownload = () => {
        if (!text) return;
        const svg = qrRef.current?.querySelector("svg");
        if (!svg) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();

        img.onload = () => {
            canvas.width = 512;
            canvas.height = 512;
            if (ctx) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, 512, 512);

                const pngUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = "qrcode.png";
                link.href = pngUrl;
                link.click();

                setDownloaded(true);
                setTimeout(() => setDownloaded(false), 2000);
            }
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const presets = QR_PRESETS;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 flex flex-col space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Input */}
            <div className="relative">
                <Input
                    type="text"
                    placeholder="enter text or url..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="h-11 text-sm pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {text.startsWith("http") ? (
                        <LinkIcon className="w-4 h-4" />
                    ) : (
                        <TextT className="w-4 h-4" />
                    )}
                </div>
            </div>

            {/* QR Preview */}
            <motion.div
                initial={false}
                animate={{ opacity: text ? 1 : 0.3 }}
                className="flex justify-center py-2"
            >
                <div
                    ref={qrRef}
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: bgColor }}
                >
                    <QRCodeSVG
                        value={text || "vxid.cc"}
                        size={size}
                        level="M"
                        bgColor={bgColor}
                        fgColor={fgColor}
                    />
                </div>
            </motion.div>

            {/* Color presets */}
            <div className="flex justify-center gap-2">
                {presets.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => { setFgColor(p.fg); setBgColor(p.bg); }}
                        className={`w-8 h-8 rounded-lg border-2 transition-all overflow-hidden ${fgColor === p.fg && bgColor === p.bg
                            ? "border-primary scale-110"
                            : "border-border hover:border-muted-foreground"
                            }`}
                        style={{ backgroundColor: p.bg }}
                        title={p.label}
                    >
                        <div
                            className="w-4 h-4 mx-auto mt-1 rounded-sm"
                            style={{ backgroundColor: p.fg }}
                        />
                    </button>
                ))}
            </div>

            {/* Size slider */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>size</span>
                    <span>{size}px</span>
                </div>
                <input
                    type="range"
                    min={100}
                    max={256}
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={handleCopy}
                    disabled={!text}
                    className="flex-1 gap-1.5"
                >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                    onClick={handleDownload}
                    disabled={!text}
                    className="flex-1 gap-1.5"
                >
                    {downloaded ? <Check className="w-4 h-4" /> : <DownloadSimple className="w-4 h-4" />}
                    {downloaded ? "Downloaded!" : "Download"}
                </Button>
            </div>
        </motion.div>
    );
}
