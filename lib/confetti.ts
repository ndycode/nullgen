"use client";

import confetti from "canvas-confetti";

type ConfettiOptions = {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    scalar?: number;
};

// Basic confetti burst
export function triggerConfetti(options?: ConfettiOptions) {
    confetti({
        particleCount: options?.particleCount ?? 100,
        spread: options?.spread ?? 70,
        startVelocity: options?.startVelocity ?? 30,
        decay: options?.decay ?? 0.94,
        scalar: options?.scalar ?? 1,
        origin: { y: 0.6 },
    });
}

// Small celebration for copy actions
export function triggerCopyConfetti() {
    confetti({
        particleCount: 30,
        spread: 50,
        startVelocity: 20,
        decay: 0.95,
        scalar: 0.8,
        origin: { y: 0.8 },
        colors: ["#ec4899", "#8b5cf6", "#06b6d4"],
    });
}

// Success celebration for uploads/shares
export function triggerSuccessConfetti() {
    const duration = 1500;
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ["#22c55e", "#10b981", "#34d399"],
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ["#22c55e", "#10b981", "#34d399"],
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };
    frame();
}

// Sparkle effect (subtle)
export function triggerSparkle() {
    confetti({
        particleCount: 15,
        spread: 40,
        startVelocity: 15,
        decay: 0.92,
        scalar: 0.6,
        origin: { y: 0.7 },
        shapes: ["circle"],
        colors: ["#fbbf24", "#f59e0b", "#d97706"],
    });
}
