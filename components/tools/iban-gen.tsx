"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

// Country codes for IBAN
const COUNTRY_CODES: { code: string; length: number; label: string }[] = [
    { code: "DE", length: 22, label: "germany" },
    { code: "FR", length: 27, label: "france" },
    { code: "GB", length: 22, label: "uk" },
    { code: "ES", length: 24, label: "spain" },
    { code: "IT", length: 27, label: "italy" },
    { code: "NL", length: 18, label: "netherlands" },
];

function generateBBAN(length: number): string {
    let bban = "";
    for (let i = 0; i < length; i++) {
        bban += Math.floor(Math.random() * 10);
    }
    return bban;
}

function calculateCheckDigits(countryCode: string, bban: string): string {
    // Convert letters to numbers (A=10, B=11, etc.)
    const numericIban = bban + countryCode.split("").map(c => c.charCodeAt(0) - 55).join("") + "00";

    // Calculate mod 97
    let remainder = 0;
    for (const char of numericIban) {
        remainder = (remainder * 10 + parseInt(char, 10)) % 97;
    }

    const checkDigits = (98 - remainder).toString().padStart(2, "0");
    return checkDigits;
}

function generateIBAN(countryCode: string, length: number): string {
    const bbanLength = length - 4; // Subtract country code (2) and check digits (2)
    const bban = generateBBAN(bbanLength);
    const checkDigits = calculateCheckDigits(countryCode, bban);
    return `${countryCode}${checkDigits}${bban}`;
}

function formatIBAN(iban: string): string {
    return iban.replace(/(.{4})/g, "$1 ").trim();
}

export function IbanGen() {
    const [country, setCountry] = useState(COUNTRY_CODES[0]);
    const [count, setCount] = useState(3);
    const [ibans, setIbans] = useState<string[]>(() =>
        Array.from({ length: 3 }, () => generateIBAN(COUNTRY_CODES[0].code, COUNTRY_CODES[0].length))
    );
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        setIbans(Array.from({ length: count }, () => generateIBAN(country.code, country.length)));
    }, [country, count]);

    const copyItem = async (iban: string) => {
        await navigator.clipboard.writeText(iban);
        setCopied(iban);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(ibans.join("\n"));
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
            {/* Country selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {COUNTRY_CODES.map((c) => (
                    <button
                        key={c.code}
                        onClick={() => setCountry(c)}
                        className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${country.code === c.code
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Generated IBANs */}
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {ibans.map((iban, i) => (
                    <motion.div
                        key={`${iban}-${i}`}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <span className="flex-1 font-mono text-xs tracking-wide">{formatIBAN(iban)}</span>
                        <button
                            onClick={() => copyItem(iban)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                            {copied === iban ? (
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
                generate ibans
            </motion.button>

            {/* Count slider */}
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

            {/* Copy all & disclaimer */}
            <div className="space-y-1">
                <button
                    onClick={copyAll}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                    {copied === "all" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    {copied === "all" ? "copied all!" : "copy all"}
                </button>
                <p className="text-xs text-muted-foreground text-center opacity-60">
                    for testing purposes only
                </p>
            </div>
        </motion.div>
    );
}
