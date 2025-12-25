"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

type DataType = "name" | "email" | "phone" | "address" | "company" | "username";

const FIRST_NAMES = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Sophia", "Lucas", "Isabella", "Mason", "Mia", "Ethan", "Charlotte", "Logan", "Amelia", "Aiden", "Harper", "Elijah", "Evelyn"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "proton.me", "mail.com", "email.com", "example.com"];
const STREETS = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm St", "Park Ave", "Lake Dr", "Hill Rd", "River Ln"];
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Diego", "Dallas", "Austin", "Seattle", "Denver"];
const COMPANIES = ["Acme Corp", "Globex Inc", "Initech", "Umbrella Co", "Stark Industries", "Wayne Enterprises", "Cyberdyne", "Weyland Corp", "Oscorp", "Virtucon"];

function random<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateData(type: DataType): string {
    const first = random(FIRST_NAMES);
    const last = random(LAST_NAMES);

    switch (type) {
        case "name":
            return `${first} ${last}`;
        case "email":
            return `${first.toLowerCase()}.${last.toLowerCase()}@${random(DOMAINS)}`;
        case "phone":
            return `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        case "address":
            return `${Math.floor(Math.random() * 9999) + 1} ${random(STREETS)}, ${random(CITIES)}`;
        case "company":
            return random(COMPANIES);
        case "username":
            return `${first.toLowerCase()}${last.toLowerCase()}${Math.floor(Math.random() * 999)}`;
        default:
            return "";
    }
}

const DATA_TYPES: { id: DataType; label: string }[] = [
    { id: "name", label: "name" },
    { id: "email", label: "email" },
    { id: "phone", label: "phone" },
    { id: "address", label: "address" },
    { id: "company", label: "company" },
    { id: "username", label: "username" },
];

export function FakeDataGen() {
    const [dataType, setDataType] = useState<DataType>("name");
    const [count, setCount] = useState(5);
    const [data, setData] = useState<string[]>(() =>
        Array.from({ length: 5 }, () => generateData("name"))
    );
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        setData(Array.from({ length: count }, () => generateData(dataType)));
    }, [dataType, count]);

    const copyItem = async (item: string) => {
        await navigator.clipboard.writeText(item);
        setCopied(item);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(data.join("\n"));
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
            {/* Type selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {DATA_TYPES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => { setDataType(t.id); }}
                        className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${dataType === t.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Generated data */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {data.map((item, i) => (
                    <motion.div
                        key={`${item}-${i}`}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <span className="flex-1 text-sm truncate">{item}</span>
                        <button
                            onClick={() => copyItem(item)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                            {copied === item ? (
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
                generate {count} {dataType}s
            </motion.button>

            {/* Advanced options */}
            <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    advanced options
                </summary>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">count</span>
                        <input
                            type="range"
                            min={1}
                            max={20}
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                        <span className="text-xs w-6 text-center">{count}</span>
                    </div>
                </div>
            </details>

            {/* Copy all */}
            <button
                onClick={copyAll}
                className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
                {copied === "all" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                {copied === "all" ? "copied all!" : "copy all"}
            </button>
        </motion.div>
    );
}
