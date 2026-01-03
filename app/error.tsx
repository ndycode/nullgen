"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console for development
        console.error("Global error:", error);

        // Report to backend for monitoring
        fetch("/api/log-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: error.message,
                stack: error.stack,
                digest: error.digest,
                url: typeof window !== "undefined" ? window.location.href : undefined,
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                timestamp: new Date().toISOString(),
            }),
        }).catch(() => {
            // Silently fail - don't create error loops
        });
    }, [error]);

    return <ErrorState onRetry={reset} />;
}
