"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

type UsernameStyle = "simple" | "gamer" | "professional" | "random";

const ADJECTIVES = ["Cool", "Swift", "Dark", "Bright", "Silent", "Wild", "Fast", "Epic", "Neon", "Cyber", "Ultra", "Mega", "Pro", "Elite", "Prime", "Alpha", "Omega", "Nova", "Zen", "Ace"];
const NOUNS = ["Wolf", "Tiger", "Dragon", "Phoenix", "Shadow", "Storm", "Blade", "Knight", "Ninja", "Hunter", "Wizard", "Ghost", "Hawk", "Viper", "Fox", "Raven", "Lion", "Bear", "Shark", "Eagle"];
const SIMPLE_WORDS = ["blue", "red", "sky", "moon", "star", "sun", "fire", "ice", "wind", "rain", "snow", "leaf", "tree", "rock", "wave", "cloud", "dawn", "dusk", "mist", "glow"];
const PRO_PREFIXES = ["dev", "code", "tech", "data", "web", "app", "sys", "net", "io", "api"];

function random<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateUsername(style: UsernameStyle): string {
    const num = Math.floor(Math.random() * 999);

    switch (style) {
        case "simple":
            return `${random(SIMPLE_WORDS)}${random(SIMPLE_WORDS)}${num}`;
        case "gamer":
            return `${random(ADJECTIVES)}${random(NOUNS)}${num}`;
        case "professional":
            return `${random(PRO_PREFIXES)}_${random(SIMPLE_WORDS)}_${num}`;
        case "random":
        default:
            const styles: UsernameStyle[] = ["simple", "gamer", "professional"];
            return generateUsername(random(styles));
    }
}

const STYLES: { id: UsernameStyle; label: string }[] = [
    { id: "random", label: "random" },
    { id: "simple", label: "simple" },
    { id: "gamer", label: "gamer" },
    { id: "professional", label: "professional" },
];

export function UsernameGen() {
    const [style, setStyle] = useState<UsernameStyle>("random");
    const [count, setCount] = useState(5);
    const [usernames, setUsernames] = useState<string[]>(() =>
        Array.from({ length: 5 }, () => generateUsername("random"))
    );
    const [copied, setCopied] = useState<string | null>(null);

    const generate = useCallback(() => {
        setUsernames(Array.from({ length: count }, () => generateUsername(style)));
    }, [style, count]);

    const copyItem = async (item: string) => {
        await navigator.clipboard.writeText(item);
        setCopied(item);
        setTimeout(() => setCopied(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(usernames.join("\n"));
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
            {/* Style selector */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {STYLES.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${style === s.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Generated usernames */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {usernames.map((username, i) => (
                    <motion.div
                        key={`${username}-${i}`}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <span className="flex-1 font-mono text-sm">{username}</span>
                        <button
                            onClick={() => copyItem(username)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                            {copied === username ? (
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
                generate usernames
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
