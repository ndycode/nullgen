"use client";

import { useState, useRef, ReactNode } from "react";
import { motion } from "framer-motion";

interface TiltCardProps {
    children: ReactNode;
    className?: string;
    tiltAmount?: number;
    glowColor?: string;
}

export function TiltCard({
    children,
    className = "",
    tiltAmount = 10,
    glowColor = "hsl(var(--primary))"
}: TiltCardProps) {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = e.clientX - centerX;
        const y = e.clientY - centerY;
        setRotateX((-y / rect.height) * tiltAmount);
        setRotateY((x / rect.width) * tiltAmount);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setIsHovered(false);
    };

    return (
        <motion.div
            ref={cardRef}
            className={`relative ${className}`}
            style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            animate={{
                rotateX,
                rotateY,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
        >
            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 rounded-lg opacity-0 blur-xl -z-10"
                style={{ backgroundColor: glowColor }}
                animate={{ opacity: isHovered ? 0.15 : 0 }}
                transition={{ duration: 0.2 }}
            />
            {children}
        </motion.div>
    );
}
