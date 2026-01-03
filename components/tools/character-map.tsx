"use client";

import { useState, useMemo, useCallback, memo } from "react";

type Category = "symbols" | "arrows" | "math" | "currency" | "punctuation" | "emoji";

const CHAR_CATEGORIES: Record<Category, { label: string; chars: string[] }> = {
    symbols: {
        label: "symbols",
        chars: ["©", "®", "™", "℗", "℠", "§", "¶", "†", "‡", "•", "◦", "‣", "⁂", "※", "⌘", "⌥", "⇧", "⎋", "⏎", "⌫", "⌦", "⇥", "⇤", "♠", "♣", "♥", "♦", "★", "☆", "✓", "✗", "✔", "✘", "✕", "✖", "♀", "♂", "⚡", "☀", "☁", "☂", "☃", "☄", "♨", "⚠", "⚙", "⚛", "☢", "☣", "♻", "⚜", "☮", "☯", "☸", "✡", "☪", "✝", "☦", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]
    },
    arrows: {
        label: "arrows",
        chars: ["←", "→", "↑", "↓", "↔", "↕", "↖", "↗", "↘", "↙", "⇐", "⇒", "⇑", "⇓", "⇔", "⇕", "⟵", "⟶", "⟷", "⟸", "⟹", "⟺", "➜", "➝", "➞", "➔", "➟", "➠", "➡", "➢", "➣", "➤", "➥", "➦", "➧", "➨", "➩", "➪", "➫", "➬", "➭", "➮", "➯", "➱", "➲", "↩", "↪", "↫", "↬", "↭", "↮", "↯", "↰", "↱", "↲", "↳", "↴", "↵", "↶", "↷", "↸", "↹", "↺", "↻"]
    },
    math: {
        label: "math",
        chars: ["±", "×", "÷", "≠", "≈", "≤", "≥", "∞", "∑", "∏", "√", "∛", "∜", "∫", "∂", "∆", "∇", "∈", "∉", "∋", "∌", "∩", "∪", "⊂", "⊃", "⊆", "⊇", "∅", "∀", "∃", "∄", "∴", "∵", "∝", "∠", "∡", "∢", "⊥", "∥", "∦", "⌀", "°", "′", "″", "‰", "‱", "π", "φ", "θ", "α", "β", "γ", "δ", "ε", "λ", "μ", "σ", "ω", "Ω", "Σ", "Δ", "Π", "Φ"]
    },
    currency: {
        label: "currency",
        chars: ["$", "€", "£", "¥", "₹", "₽", "₩", "₪", "₫", "₴", "₦", "₱", "₿", "₵", "₡", "₢", "₣", "₤", "₥", "₧", "₨", "₭", "₮", "₯", "₰", "₲", "₳", "₶", "₷", "₸", "₺", "₻", "₼", "₾", "¢", "฿", "៛", "﷼", "元", "円", "圓", "원"]
    },
    punctuation: {
        label: "punctuation",
        chars: ["…", "–", "—", "―", "'", "'", "‚", "‛", "\u201C", "\u201D", "„", "‟", "«", "»", "‹", "›", "¡", "¿", "‽", "⁇", "⁈", "⁉", "‼", "⸮", "·", "•", "◦", "‣", "⁃", "⁌", "⁍", "※", "⁂", "⁕", "†", "‡", "§", "¶", "©", "®", "™", "℗", "℠", "№"]
    },
    emoji: {
        label: "emoji",
        chars: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "❤️", "🧡", "💛", "💚", "💙", "💜"]
    }
};

const ALL_CHARS = Object.values(CHAR_CATEGORIES).flatMap(c => c.chars);
const CATEGORIES = Object.entries(CHAR_CATEGORIES).map(([id, { label }]) => ({
    id: id as Category,
    label
}));

// Memoized character button
interface CharButtonProps {
    char: string;
    isCopied: boolean;
    onCopy: (char: string) => void;
}

const CharButton = memo(function CharButton({ char, isCopied, onCopy }: CharButtonProps) {
    return (
        <button
            onClick={() => onCopy(char)}
            className={`aspect-square flex items-center justify-center text-base sm:text-lg rounded-lg transition-all min-h-zone-xs min-w-[40px] active:scale-90 ${isCopied
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted hover:bg-muted/80 hover:scale-105"
                }`}
        >
            {char}
        </button>
    );
});

export function CharacterMap() {
    const [search, setSearch] = useState("");
    const [copied, setCopied] = useState<string | null>(null);
    const [category, setCategory] = useState<Category>("symbols");

    // Memoized copy handler
    const copyChar = useCallback(async (char: string) => {
        await navigator.clipboard.writeText(char);
        setCopied(char);
        setTimeout(() => setCopied(null), 1000);
    }, []);

    // Memoized filtered characters
    const filteredChars = useMemo(() => {
        if (!search) return CHAR_CATEGORIES[category].chars;
        return ALL_CHARS.filter(c => c.includes(search));
    }, [search, category]);

    return (
        <div className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4">
            {/* Search */}
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search characters..."
                className="w-full px-3 py-2 text-sm bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); setSearch(""); }}
                        className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors min-h-touch-sm ${category === cat.id && !search
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Character grid - optimized with memoized buttons */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-52 overflow-y-auto scrollbar-hide">
                {filteredChars.map((char, i) => (
                    <CharButton
                        key={`${char}-${i}`}
                        char={char}
                        isCopied={copied === char}
                        onCopy={copyChar}
                    />
                ))}
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
                {filteredChars.length} characters • tap to copy
            </p>
        </div>
    );
}
