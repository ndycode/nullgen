"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function WordCount() {
    const [text, setText] = useState("");
    const [copied, setCopied] = useState(false);

    const stats = {
        chars: text.length,
        charsNoSpace: text.replace(/\s/g, "").length,
        words: text.trim() ? text.trim().split(/\s+/).length : 0,
        sentences: text.trim() ? (text.match(/[.!?]+/g) || []).length || (text.trim() ? 1 : 0) : 0,
        paragraphs: text.trim() ? text.split(/\n\n+/).filter(p => p.trim()).length : 0,
        lines: text.trim() ? text.split("\n").length : 0,
    };

    // Reading time (avg 200 words/min = 3.33 words/sec)
    const readingSeconds = Math.round((stats.words / 200) * 60);
    const readingTimeDisplay = readingSeconds < 60
        ? `${readingSeconds}s`
        : `${Math.ceil(readingSeconds / 60)} min`;

    const copy = async () => {
        const summary = `Characters: ${stats.chars}\nWords: ${stats.words}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nReading time: ${readingTimeDisplay}`;
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const statItems = [
        { value: stats.words, label: "words", primary: true },
        { value: stats.chars, label: "characters" },
        { value: stats.sentences, label: "sentences" },
    ];

    return (
        <motion.div
            className="bg-card border rounded-2xl p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Input */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type text to count..."
                className="w-full h-32 px-3 py-2 text-sm bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Stats grid with stagger animation */}
            <div className="grid grid-cols-3 gap-2">
                {statItems.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        className="bg-muted/50 rounded-lg p-3 text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.2 }}
                    >
                        <motion.p
                            className={`text-2xl font-bold ${stat.primary ? "text-primary" : ""}`}
                            key={stat.value}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.15 }}
                        >
                            {stat.value}
                        </motion.p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Additional stats */}
            <motion.div
                className="flex justify-between text-xs text-muted-foreground px-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <span>{stats.charsNoSpace} chars (no spaces)</span>
                <span>{stats.paragraphs} paragraphs</span>
                <span>{stats.lines} lines</span>
            </motion.div>

            {/* Reading time */}
            <motion.div
                className="flex justify-between items-center p-3 bg-primary/10 rounded-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
            >
                <span className="text-sm">Reading time</span>
                <span className="font-medium">{readingTimeDisplay}</span>
            </motion.div>

            {/* Copy stats button */}
            <motion.button
                onClick={copy}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                {copied ? "copied!" : "copy stats"}
            </motion.button>
        </motion.div>
    );
}
