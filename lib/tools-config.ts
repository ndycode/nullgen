import { Package, QrCode, Key, Palette, Hash, TextAa, TextT, CalendarBlank, Smiley, ArrowsClockwise, ImageSquare, Browser, Eraser } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export interface Tool {
    id: string;
    name: string;
    tagline: string;
    icon: Icon;
    category: "sharing" | "generate" | "text" | "image";
}

export const TOOLS: Tool[] = [
    // Sharing
    {
        id: "dead-drop",
        name: "drop",
        tagline: "share files, no sign up",
        icon: Package,
        category: "sharing",
    },
    {
        id: "qr-gen",
        name: "qr",
        tagline: "instant qr codes",
        icon: QrCode,
        category: "sharing",
    },
    // Generate
    {
        id: "passgen",
        name: "pass",
        tagline: "strong passwords, one tap",
        icon: Key,
        category: "generate",
    },
    {
        id: "color",
        name: "color",
        tagline: "hex ↔ rgb ↔ hsl",
        icon: Palette,
        category: "generate",
    },
    {
        id: "hash",
        name: "hash",
        tagline: "md5 · sha256 · sha512",
        icon: Hash,
        category: "generate",
    },
    // Text
    {
        id: "text-clean",
        name: "clean",
        tagline: "strip spaces & empty lines",
        icon: TextAa,
        category: "text",
    },
    {
        id: "word-count",
        name: "count",
        tagline: "words · chars · read time",
        icon: TextT,
        category: "text",
    },
    {
        id: "date-diff",
        name: "days",
        tagline: "time between dates",
        icon: CalendarBlank,
        category: "text",
    },
    {
        id: "emoji",
        name: "emoji",
        tagline: "tap to copy ✨",
        icon: Smiley,
        category: "text",
    },
    {
        id: "case",
        name: "case",
        tagline: "UPPER · lower · Title",
        icon: ArrowsClockwise,
        category: "text",
    },
    // Image
    {
        id: "image",
        name: "convert",
        tagline: "png ↔ jpg ↔ webp",
        icon: ImageSquare,
        category: "image",
    },
    {
        id: "favicon",
        name: "favicon",
        tagline: "emoji to .ico",
        icon: Browser,
        category: "image",
    },
    {
        id: "bg-remove",
        name: "erase",
        tagline: "remove backgrounds",
        icon: Eraser,
        category: "image",
    },
];

export function getToolById(id: string): Tool | undefined {
    return TOOLS.find(tool => tool.id === id);
}

export function getToolsByCategory(category: Tool["category"]): Tool[] {
    return TOOLS.filter(tool => tool.category === category);
}
