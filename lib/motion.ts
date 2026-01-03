/**
 * Shared motion/animation constants for consistent animations across the app.
 * Using centralized values ensures visual consistency and easier maintenance.
 */

// Spring transitions - reusable spring animation configs
export const SPRING_SMOOTH = {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 1,
};

export const SPRING_SNAPPY = {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
};

export const SPRING_GENTLE = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
};

// Fade transitions
export const FADE_IN = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const FADE_UP = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

export const FADE_DOWN = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
};

// Scale transitions
export const SCALE_IN = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
};

// Timing constants
export const DURATION_FAST = 0.15;
export const DURATION_NORMAL = 0.2;
export const DURATION_SLOW = 0.3;

// Easing curves
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.25, 0.1, 0.25, 1];
