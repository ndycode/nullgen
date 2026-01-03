"use client";

import { useState, useCallback } from "react";

/**
 * Hook for copying text to clipboard with automatic reset.
 * @param timeout - Time in ms before copied state resets (default: 1500)
 */
export function useCopyToClipboard(timeout = 1500) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(
        async (text: string): Promise<boolean> => {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), timeout);
                return true;
            } catch {
                return false;
            }
        },
        [timeout]
    );

    const reset = useCallback(() => {
        setCopied(false);
    }, []);

    return { copied, copy, reset };
}
