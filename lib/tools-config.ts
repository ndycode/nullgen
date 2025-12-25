import { Package, QrCode, Key, Palette, Hash, TextAa, TextT, CalendarBlank, Smiley, ArrowsClockwise, ImageSquare, Browser, Eraser, ShieldCheck, FileArrowDown, ArrowsOutSimple, Crop, FileCode, Ruler, Eyedropper, TextT as WatermarkIcon, GridFour, Rows, ArrowsLeftRight, Keyboard, Binary, Fingerprint, Barcode, UserCircle, Swatches, CreditCard, TextAlignLeft, NumberSquareOne, Shuffle, At, Buildings, Bank, WifiHigh, Globe, GlobeSimple, MagnifyingGlass, Lock, WifiSlash, Desktop, Monitor, Cookie, Cube, Code, Password, Warning } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export interface Tool {
    id: string;
    name: string;
    tagline: string;
    icon: Icon;
    category: "checker" | "sharing" | "generate" | "text" | "image";
}

// Ordered by category: checker → sharing → generate → text → image
export const TOOLS: Tool[] = [
    // Checker tools (first category)
    {
        id: "ip-checker",
        name: "ip",
        tagline: "your ip, location, isp",
        icon: Globe,
        category: "checker",
    },
    {
        id: "dns-checker",
        name: "dns",
        tagline: "lookup dns records",
        icon: GlobeSimple,
        category: "checker",
    },
    {
        id: "whois-checker",
        name: "whois",
        tagline: "domain registration info",
        icon: MagnifyingGlass,
        category: "checker",
    },
    {
        id: "ssl-checker",
        name: "ssl",
        tagline: "check ssl certificates",
        icon: Lock,
        category: "checker",
    },
    {
        id: "ping-checker",
        name: "ping",
        tagline: "website latency checker",
        icon: WifiHigh,
        category: "checker",
    },
    {
        id: "useragent-checker",
        name: "useragent",
        tagline: "your browser info",
        icon: Browser,
        category: "checker",
    },
    {
        id: "screen-checker",
        name: "screen",
        tagline: "resolution and viewport",
        icon: Monitor,
        category: "checker",
    },
    {
        id: "cookies-checker",
        name: "cookies",
        tagline: "browser storage test",
        icon: Cookie,
        category: "checker",
    },
    {
        id: "webgl-checker",
        name: "webgl",
        tagline: "gpu and graphics info",
        icon: Cube,
        category: "checker",
    },
    {
        id: "password-checker",
        name: "password",
        tagline: "check password strength",
        icon: Password,
        category: "checker",
    },
    {
        id: "leak-checker",
        name: "leak",
        tagline: "check email breaches",
        icon: Warning,
        category: "checker",
    },
    // Sharing tools
    {
        id: "dead-drop",
        name: "drop",
        tagline: "share files, no sign up",
        icon: Package,
        category: "sharing",
    },
    // Most used utilities
    {
        id: "qr-gen",
        name: "qr",
        tagline: "instant qr codes",
        icon: QrCode,
        category: "sharing",
    },
    {
        id: "link-shortener",
        name: "shorten",
        tagline: "short links, your domain",
        icon: ArrowsLeftRight,
        category: "sharing",
    },
    {
        id: "pastebin",
        name: "paste",
        tagline: "share text snippets",
        icon: TextT,
        category: "sharing",
    },
    {
        id: "image-host",
        name: "imghost",
        tagline: "quick image sharing",
        icon: ImageSquare,
        category: "sharing",
    },
    {
        id: "secret-note",
        name: "secret",
        tagline: "self-destructing notes",
        icon: Fingerprint,
        category: "sharing",
    },
    {
        id: "code-share",
        name: "code",
        tagline: "share code snippets",
        icon: FileCode,
        category: "sharing",
    },
    {
        id: "json-share",
        name: "json",
        tagline: "share json with viewer",
        icon: Rows,
        category: "sharing",
    },
    {
        id: "csv-share",
        name: "csv",
        tagline: "share spreadsheets",
        icon: GridFour,
        category: "sharing",
    },
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
        id: "barcode",
        name: "barcode",
        tagline: "product codes & labels",
        icon: Barcode,
        category: "generate",
    },
    {
        id: "fakedata",
        name: "fake",
        tagline: "test names & emails",
        icon: UserCircle,
        category: "generate",
    },
    {
        id: "palette",
        name: "palette",
        tagline: "harmonious color sets",
        icon: Swatches,
        category: "generate",
    },
    {
        id: "testcard",
        name: "card",
        tagline: "test credit card data",
        icon: CreditCard,
        category: "generate",
    },
    {
        id: "stringgen",
        name: "string",
        tagline: "random alphanumeric",
        icon: TextAlignLeft,
        category: "generate",
    },
    {
        id: "integergen",
        name: "integer",
        tagline: "random numbers",
        icon: NumberSquareOne,
        category: "generate",
    },
    {
        id: "sequencegen",
        name: "sequence",
        tagline: "shuffle number range",
        icon: Shuffle,
        category: "generate",
    },
    {
        id: "usernamegen",
        name: "username",
        tagline: "creative usernames",
        icon: At,
        category: "generate",
    },
    {
        id: "businessgen",
        name: "business",
        tagline: "company name ideas",
        icon: Buildings,
        category: "generate",
    },
    {
        id: "ibangen",
        name: "iban",
        tagline: "test bank accounts",
        icon: Bank,
        category: "generate",
    },
    {
        id: "macgen",
        name: "mac",
        tagline: "network addresses",
        icon: WifiHigh,
        category: "generate",
    },
    // New image tools
    {
        id: "privacy",
        name: "privacy",
        tagline: "strip exif & anti-hash",
        icon: ShieldCheck,
        category: "image",
    },
    {
        id: "compress",
        name: "compress",
        tagline: "shrink file size",
        icon: FileArrowDown,
        category: "image",
    },
    {
        id: "resize",
        name: "resize",
        tagline: "bulk resize with presets",
        icon: ArrowsOutSimple,
        category: "image",
    },
    // Text tools
    {
        id: "word-count",
        name: "count",
        tagline: "words · chars · read time",
        icon: TextT,
        category: "text",
    },
    {
        id: "case",
        name: "case",
        tagline: "UPPER · lower · Title",
        icon: ArrowsClockwise,
        category: "text",
    },
    {
        id: "text-clean",
        name: "clean",
        tagline: "strip spaces & empty lines",
        icon: TextAa,
        category: "text",
    },
    {
        id: "emoji",
        name: "emoji",
        tagline: "tap to copy ✨",
        icon: Smiley,
        category: "text",
    },
    // More image tools
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
    // Least used
    {
        id: "hash",
        name: "hash",
        tagline: "md5 · sha256 · sha512",
        icon: Hash,
        category: "generate",
    },
    {
        id: "date-diff",
        name: "days",
        tagline: "time between dates",
        icon: CalendarBlank,
        category: "text",
    },
    {
        id: "dedup",
        name: "dedup",
        tagline: "remove duplicate lines",
        icon: Rows,
        category: "text",
    },
    {
        id: "reverse",
        name: "reverse",
        tagline: "flip text backwards",
        icon: ArrowsLeftRight,
        category: "text",
    },
    {
        id: "charmap",
        name: "chars",
        tagline: "special characters",
        icon: Keyboard,
        category: "text",
    },
    {
        id: "numconv",
        name: "numbers",
        tagline: "bin ↔ dec ↔ hex",
        icon: Binary,
        category: "text",
    },
    {
        id: "uuid",
        name: "uuid",
        tagline: "generate unique ids",
        icon: Fingerprint,
        category: "text",
    },
    {
        id: "bg-remove",
        name: "erase",
        tagline: "remove backgrounds",
        icon: Eraser,
        category: "image",
    },
    // New image tools
    {
        id: "crop",
        name: "crop",
        tagline: "crop, rotate & flip",
        icon: Crop,
        category: "image",
    },
    {
        id: "svg-opt",
        name: "svg",
        tagline: "optimize svg files",
        icon: FileCode,
        category: "image",
    },
    {
        id: "ratio",
        name: "ratio",
        tagline: "aspect ratio calculator",
        icon: Ruler,
        category: "image",
    },
    {
        id: "pick-color",
        name: "pick",
        tagline: "colors from image",
        icon: Eyedropper,
        category: "image",
    },
    {
        id: "watermark",
        name: "watermark",
        tagline: "add text to images",
        icon: WatermarkIcon,
        category: "image",
    },
    {
        id: "split",
        name: "split",
        tagline: "image to grid tiles",
        icon: GridFour,
        category: "image",
    },
    {
        id: "blur",
        name: "blur",
        tagline: "blur or pixelate images",
        icon: ImageSquare,
        category: "image",
    },
    {
        id: "rotate",
        name: "rotate",
        tagline: "rotate and flip images",
        icon: ArrowsClockwise,
        category: "image",
    },
    {
        id: "filter",
        name: "filter",
        tagline: "apply image filters",
        icon: Palette,
        category: "image",
    },
];

export function getToolById(id: string): Tool | undefined {
    return TOOLS.find(tool => tool.id === id);
}

export function getToolsByCategory(category: Tool["category"]): Tool[] {
    return TOOLS.filter(tool => tool.category === category);
}
