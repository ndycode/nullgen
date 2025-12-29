"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    /** Use shimmer wave animation */
    shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true }: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-lg bg-muted",
                shimmer ? "skeleton-shimmer" : "animate-pulse",
                className
            )}
        />
    );
}

interface SkeletonTextProps {
    lines?: number;
    className?: string;
    shimmer?: boolean;
}

export function SkeletonText({ lines = 3, className, shimmer = true }: SkeletonTextProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    shimmer={shimmer}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

interface SkeletonCardProps {
    className?: string;
    shimmer?: boolean;
}

export function SkeletonCard({ className, shimmer = true }: SkeletonCardProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <Skeleton shimmer={shimmer} className="h-8 w-1/3" />
            <SkeletonText shimmer={shimmer} lines={4} />
        </div>
    );
}

/** Skeleton for tool cards in carousel */
export function SkeletonToolCard({ className }: { className?: string }) {
    return (
        <div className={cn("space-y-4 p-4", className)}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
            <SkeletonText lines={3} />
            <Skeleton className="h-10 w-full rounded-xl" />
        </div>
    );
}

/** Skeleton for input fields */
export function SkeletonInput({ className }: { className?: string }) {
    return <Skeleton className={cn("h-10 w-full rounded-lg", className)} />;
}

/** Skeleton for buttons */
export function SkeletonButton({ className }: { className?: string }) {
    return <Skeleton className={cn("h-10 w-24 rounded-full", className)} />;
}
