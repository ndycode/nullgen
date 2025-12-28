"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowClockwise } from "@phosphor-icons/react";

const LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
    "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
    "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
    "deserunt", "mollit", "anim", "id", "est", "laborum", "at", "vero", "eos",
    "accusamus", "iusto", "odio", "dignissimos", "ducimus", "blanditiis",
    "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores",
    "quas", "molestias", "excepturi", "obcaecati", "cupiditate", "provident"
];

type GenerateType = "paragraphs" | "sentences" | "words";

export function LoremGen() {
    const [type, setType] = useState<GenerateType>("paragraphs");
    const [count, setCount] = useState(3);
    const [output, setOutput] = useState("");
    const [copied, setCopied] = useState(false);

    const generateWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];

    const generateSentence = (wordCount = 8 + Math.floor(Math.random() * 8)) => {
        const words = Array.from({ length: wordCount }, generateWord);
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        return words.join(" ") + ".";
    };

    const generateParagraph = (sentenceCount = 4 + Math.floor(Math.random() * 4)) => {
        return Array.from({ length: sentenceCount }, () => generateSentence()).join(" ");
    };

    const generate = () => {
        let result = "";
        switch (type) {
            case "paragraphs":
                result = Array.from({ length: count }, () => generateParagraph()).join("\n\n");
                break;
            case "sentences":
                result = Array.from({ length: count }, () => generateSentence()).join(" ");
                break;
            case "words":
                result = Array.from({ length: count }, generateWord).join(" ");
                break;
        }
        setOutput(result);
    };

    const copy = async () => {
        await navigator.clipboard.writeText(output);
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
            {/* Type selector */}
            <div className="flex gap-1">
                {(["paragraphs", "sentences", "words"] as GenerateType[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 py-2 text-xs rounded-lg transition-colors ${type === t
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Count input */}
            <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">count:</label>
                <input
                    type="number"
                    min={1}
                    max={50}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-20 px-2 py-1 text-sm bg-muted/50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button onClick={generate} size="sm" className="ml-auto gap-1">
                    <ArrowClockwise className="w-3.5 h-3.5" />
                    Generate
                </Button>
            </div>

            {/* Output */}
            {output && (
                <div className="space-y-2">
                    <div className="bg-muted/50 p-3 rounded-lg max-h-48 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap break-words">{output}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            {output.split(/\s+/).length} words · {output.length} chars
                        </p>
                        <Button onClick={copy} variant="outline" size="sm" className="gap-1">
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
