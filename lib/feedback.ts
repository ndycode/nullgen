"use client";

/**
 * Haptic and Sound Feedback System
 * Provides optional tactile and audio feedback for interactions
 */

type FeedbackType = "success" | "error" | "warning" | "click" | "copy";

interface FeedbackOptions {
    haptic?: boolean;
    sound?: boolean;
}

// Check if haptic feedback is supported
const supportsHaptics = typeof navigator !== "undefined" && "vibrate" in navigator;

// Haptic patterns (in milliseconds)
const HAPTIC_PATTERNS: Record<FeedbackType, number | number[]> = {
    success: [10, 50, 10],  // Short buzz, pause, short buzz
    error: [50, 50, 50],    // Three quick buzzes
    warning: [30],          // Single medium buzz
    click: [5],             // Tiny tap
    copy: [10],             // Quick tap
};

/**
 * Trigger haptic feedback
 */
export function triggerHaptic(type: FeedbackType = "click"): void {
    if (!supportsHaptics) return;

    try {
        const pattern = HAPTIC_PATTERNS[type];
        navigator.vibrate(pattern);
    } catch {
        // Silently fail if haptics not available
    }
}

/**
 * Trigger feedback (haptic + optional sound)
 * Sound is disabled by default for better UX
 */
export function triggerFeedback(
    type: FeedbackType,
    options: FeedbackOptions = { haptic: true, sound: false }
): void {
    if (options.haptic) {
        triggerHaptic(type);
    }

    // Sound functionality placeholder
    // Can be implemented with Web Audio API if needed
    if (options.sound) {
        // Future: Play subtle sound effect
    }
}

/**
 * Success feedback - for completed actions
 */
export function successFeedback(): void {
    triggerFeedback("success");
}

/**
 * Error feedback - for failed actions
 */
export function errorFeedback(): void {
    triggerFeedback("error");
}

/**
 * Copy feedback - for clipboard copies
 */
export function copyFeedback(): void {
    triggerFeedback("copy");
}

/**
 * Click feedback - for button presses
 */
export function clickFeedback(): void {
    triggerFeedback("click");
}

/**
 * Shake an element with error animation
 */
export function shakeElement(element: HTMLElement | null): void {
    if (!element) return;

    element.classList.add("animate-shake");
    errorFeedback();

    // Remove class after animation completes
    setTimeout(() => {
        element.classList.remove("animate-shake");
    }, 500);
}

/**
 * Add spring pop animation to element
 */
export function springPop(element: HTMLElement | null): void {
    if (!element) return;

    element.classList.add("animate-spring-pop");
    successFeedback();

    setTimeout(() => {
        element.classList.remove("animate-spring-pop");
    }, 400);
}
