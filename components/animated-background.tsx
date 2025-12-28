"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Gradient orbs */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
                style={{
                    background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                    left: "-10%",
                    top: "-10%",
                }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
                style={{
                    background: "radial-gradient(circle, hsl(280 100% 60%) 0%, transparent 70%)",
                    right: "-5%",
                    bottom: "-5%",
                }}
                animate={{
                    x: [0, -80, 0],
                    y: [0, -60, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-3xl"
                style={{
                    background: "radial-gradient(circle, hsl(200 100% 50%) 0%, transparent 70%)",
                    right: "30%",
                    top: "20%",
                }}
                animate={{
                    x: [0, 60, 0],
                    y: [0, -40, 0],
                    scale: [1, 0.9, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                        linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                }}
            />
        </div>
    );
}
