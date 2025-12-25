"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

type CardType = "visa" | "mastercard" | "amex" | "discover" | "random";

const CARD_PREFIXES: Record<Exclude<CardType, "random">, string[]> = {
    visa: ["4"],
    mastercard: ["51", "52", "53", "54", "55"],
    amex: ["34", "37"],
    discover: ["6011", "65"],
};

const CARD_LENGTHS: Record<Exclude<CardType, "random">, number> = {
    visa: 16,
    mastercard: 16,
    amex: 15,
    discover: 16,
};

const FIRST_NAMES = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Sophia", "Lucas", "Isabella"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"];

function random<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function luhnChecksum(cardNumber: string): number {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    return (10 - (sum % 10)) % 10;
}

function generateCardNumber(type: Exclude<CardType, "random">): string {
    const prefix = random(CARD_PREFIXES[type]);
    const length = CARD_LENGTHS[type];

    // Generate digits (minus prefix and check digit)
    let number = prefix;
    while (number.length < length - 1) {
        number += Math.floor(Math.random() * 10);
    }

    // Add Luhn check digit
    number += luhnChecksum(number + "0");

    return number;
}

function formatCardNumber(number: string): string {
    if (number.length === 15) {
        // Amex: 4-6-5
        return `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10)}`;
    }
    // Standard: 4-4-4-4
    return number.replace(/(.{4})/g, "$1 ").trim();
}

function generateExpiry(): string {
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const year = String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 1).slice(-2);
    return `${month}/${year}`;
}

function generateCVV(isAmex: boolean): string {
    const length = isAmex ? 4 : 3;
    return String(Math.floor(Math.random() * Math.pow(10, length))).padStart(length, "0");
}

interface CardData {
    type: Exclude<CardType, "random">;
    number: string;
    expiry: string;
    cvv: string;
    name: string;
}

const CARD_TYPES: { id: CardType; label: string }[] = [
    { id: "random", label: "random" },
    { id: "visa", label: "visa" },
    { id: "mastercard", label: "mastercard" },
    { id: "amex", label: "amex" },
    { id: "discover", label: "discover" },
];

export function CreditCardGen() {
    const [selectedType, setSelectedType] = useState<CardType>("random");
    const [card, setCard] = useState<CardData | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        let type: Exclude<CardType, "random">;
        if (selectedType === "random") {
            const types: Exclude<CardType, "random">[] = ["visa", "mastercard", "amex", "discover"];
            type = random(types);
        } else {
            type = selectedType;
        }

        const number = generateCardNumber(type);
        const expiry = generateExpiry();
        const cvv = generateCVV(type === "amex");
        const name = `${random(FIRST_NAMES)} ${random(LAST_NAMES)}`.toUpperCase();

        setCard({ type, number, expiry, cvv, name });
    }, [selectedType]);

    const copyField = async (value: string, field: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(field);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        if (!card) return;
        const text = `Card: ${formatCardNumber(card.number)}\nExpiry: ${card.expiry}\nCVV: ${card.cvv}\nName: ${card.name}`;
        await navigator.clipboard.writeText(text);
        setCopied("all");
        setTimeout(() => setCopied(null), 1500);
    };

    // Generate on mount
    useState(() => { generate(); });

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Type selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {CARD_TYPES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedType(t.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${selectedType === t.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Card display */}
            {card && (
                <motion.div
                    className="relative p-4 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {/* Card type badge */}
                    <div className="absolute top-3 right-3 text-xs font-bold uppercase text-primary">
                        {card.type}
                    </div>

                    {/* Card number */}
                    <button
                        onClick={() => copyField(card.number, "number")}
                        className="w-full text-left group"
                    >
                        <p className="text-xs text-muted-foreground mb-1">card number</p>
                        <p className="font-mono text-lg tracking-wider group-hover:text-primary transition-colors">
                            {formatCardNumber(card.number)}
                        </p>
                    </button>

                    {/* Expiry, CVV, Name */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <button
                            onClick={() => copyField(card.expiry, "expiry")}
                            className="text-left group"
                        >
                            <p className="text-xs text-muted-foreground">expiry</p>
                            <p className="font-mono text-sm group-hover:text-primary transition-colors">{card.expiry}</p>
                        </button>
                        <button
                            onClick={() => copyField(card.cvv, "cvv")}
                            className="text-left group"
                        >
                            <p className="text-xs text-muted-foreground">cvv</p>
                            <p className="font-mono text-sm group-hover:text-primary transition-colors">{card.cvv}</p>
                        </button>
                        <button
                            onClick={() => copyField(card.name, "name")}
                            className="text-left group"
                        >
                            <p className="text-xs text-muted-foreground">name</p>
                            <p className="font-mono text-xs group-hover:text-primary transition-colors truncate">{card.name}</p>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Generate button */}
            <motion.button
                onClick={generate}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <ArrowClockwise className="w-4 h-4" />
                generate card
            </motion.button>

            {/* Copy all */}
            {card && (
                <button
                    onClick={copyAll}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                    {copied === "all" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    {copied === "all" ? "copied all!" : "copy all details"}
                </button>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center opacity-60">
                for testing purposes only • not real cards
            </p>
        </motion.div>
    );
}
