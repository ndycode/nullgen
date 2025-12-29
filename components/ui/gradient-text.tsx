"use client";

import { cn } from "@/lib/utils";

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    /** Animate the gradient */
    animated?: boolean;
}

/**
 * Premium gradient text component
 * Displays text with a vibrant gradient effect
 */
export function GradientText({
    children,
    className,
    animated = false,
}: GradientTextProps) {
    return (
        <span
            className={cn(
                animated ? "gradient-text-animated" : "gradient-text",
                className
            )}
        >
            {children}
        </span>
    );
}
