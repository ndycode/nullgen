// Design system color constants
// These match the CSS variables defined in globals.css

export const THEME_COLORS = {
    // Primary pink color (matches --primary in globals.css)
    primary: "#ec4899",
    primaryLight: "#f472b6",
    primaryLighter: "#f9a8d4",
    primaryBg: "#fdf2f8",

    // Neutral colors
    white: "#ffffff",
    black: "#000000",
    gray: "#6b7280",
    stone: "#f5f5f4",

    // Accent colors for palettes
    rose: "#f43f5e",
    orange: "#f97316",
    yellow: "#eab308",
    green: "#22c55e",
    cyan: "#06b6d4",
    blue: "#3b82f6",
    violet: "#8b5cf6",
} as const;

// Color presets for tools
export const COLOR_PRESETS = [
    THEME_COLORS.primary,
    THEME_COLORS.rose,
    THEME_COLORS.orange,
    THEME_COLORS.yellow,
    THEME_COLORS.green,
    THEME_COLORS.cyan,
    THEME_COLORS.blue,
    THEME_COLORS.violet,
    THEME_COLORS.black,
    THEME_COLORS.gray,
    THEME_COLORS.white,
    THEME_COLORS.stone,
];

// QR code color presets
export const QR_PRESETS = [
    { fg: THEME_COLORS.black, bg: THEME_COLORS.white, label: "default" },
    { fg: THEME_COLORS.white, bg: THEME_COLORS.black, label: "dark" },
    { fg: THEME_COLORS.primary, bg: THEME_COLORS.primaryBg, label: "pink" },
    { fg: THEME_COLORS.blue, bg: "#eff6ff", label: "blue" },
];

// Favicon color palette
export const FAVICON_COLORS = [
    THEME_COLORS.primary,
    THEME_COLORS.blue,
    THEME_COLORS.green,
    THEME_COLORS.orange,
    THEME_COLORS.violet,
    THEME_COLORS.black,
    THEME_COLORS.white,
];

// Confetti colors (for celebrations)
export const CONFETTI_COLORS = [
    THEME_COLORS.primary,
    THEME_COLORS.primaryLight,
    THEME_COLORS.primaryLighter,
];

// Canvas-specific colors (for image processing)
export const CANVAS_COLORS = {
    // JPEG background fill (must be opaque white for proper rendering)
    jpegBackground: "#FFFFFF",
    // Transparency checkerboard pattern
    transparencyChecker: "#808080",
} as const;
