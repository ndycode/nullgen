"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

// Apple-style emoji categories with actual emojis
const EMOJI_DATA = {
    "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐"],
    "Gestures": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🙏", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "❤️‍🔥", "❤️‍🩹", "💋", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤"],
    "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🦂"],
    "Food": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🥫", "🍝"],
    "Objects": ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳"],
    "Symbols": ["✅", "❌", "❓", "❗", "‼️", "⁉️", "💯", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "◾", "◽", "▪️", "▫️", "⬛", "⬜", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⭐", "🌟", "✨", "💫", "🔥", "💥", "💢", "💤", "🔔", "🔕", "📣", "📢"],
    "Flags": ["🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🏳️‍⚧️", "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇯🇵", "🇰🇷", "🇨🇳", "🇮🇳", "🇧🇷", "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇲🇽", "🇵🇭", "🇹🇭", "🇻🇳", "🇮🇩", "🇸🇬", "🇲🇾", "🇳🇬", "🇿🇦", "🇪🇬", "🇦🇪", "🇸🇦", "🇹🇷", "🇷🇺", "🇺🇦", "🇵🇱", "🇳🇱", "🇧🇪", "🇨🇭", "🇦🇹", "🇸🇪", "🇳🇴", "🇩🇰", "🇫🇮", "🇮🇪", "🇵🇹", "🇬🇷", "🇦🇷", "🇨🇱", "🇨🇴", "🇵🇪"],
};

const CATEGORIES = Object.keys(EMOJI_DATA);

export function EmojiPicker() {
    const [category, setCategory] = useState<keyof typeof EMOJI_DATA>("Smileys");
    const [search, setSearch] = useState("");
    const [copied, setCopied] = useState<string | null>(null);
    const [recent, setRecent] = useState<string[]>([]);

    // Filter emojis by search
    const allEmojis = Object.values(EMOJI_DATA).flat();
    const filteredEmojis = search
        ? allEmojis.filter(e => e.includes(search))
        : EMOJI_DATA[category];

    const copyEmoji = async (emoji: string) => {
        await navigator.clipboard.writeText(emoji);
        setCopied(emoji);
        setTimeout(() => setCopied(null), 1000);

        // Add to recent
        setRecent(prev => [emoji, ...prev.filter(e => e !== emoji)].slice(0, 12));
    };

    return (
        <div className="bg-card border rounded-2xl p-4 space-y-3">
            {/* Search */}
            <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search emoji..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Recent */}
            {recent.length > 0 && !search && (
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Recent</p>
                    <div className="flex flex-wrap gap-1">
                        {recent.map((emoji, i) => (
                            <button
                                key={i}
                                onClick={() => copyEmoji(emoji)}
                                className="w-9 h-9 text-xl hover:bg-muted rounded-lg transition-colors flex items-center justify-center"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories - iOS style segmented control */}
            {!search && (
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat as keyof typeof EMOJI_DATA)}
                            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${category === cat
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji grid - Apple style */}
            <div className="h-[180px] overflow-y-auto">
                <div className="grid grid-cols-7 gap-1">
                    {filteredEmojis.map((emoji, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyEmoji(emoji)}
                            className={`w-10 h-10 text-2xl hover:bg-muted rounded-xl transition-colors flex items-center justify-center ${copied === emoji ? "bg-primary/20" : ""
                                }`}
                        >
                            {emoji}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Copied toast */}
            <AnimatePresence>
                {copied && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-card border rounded-full shadow-lg text-sm z-50"
                    >
                        {copied} copied!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
