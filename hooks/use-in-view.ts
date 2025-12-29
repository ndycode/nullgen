"use client";

import { useState, useEffect, useRef, RefObject } from "react";

interface UseInViewOptions {
    /** Threshold for intersection (0-1) */
    threshold?: number;
    /** Root margin for earlier/later triggering */
    rootMargin?: string;
    /** Only trigger once */
    triggerOnce?: boolean;
    /** Initial state */
    initialInView?: boolean;
}

interface UseInViewReturn {
    ref: RefObject<HTMLDivElement | null>;
    inView: boolean;
    hasBeenInView: boolean;
}

/**
 * Hook to detect when an element enters the viewport
 * Useful for scroll-triggered animations
 */
export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
    const {
        threshold = 0.1,
        rootMargin = "0px",
        triggerOnce = true,
        initialInView = false,
    } = options;

    const ref = useRef<HTMLDivElement | null>(null);
    const [inView, setInView] = useState(initialInView);
    const [hasBeenInView, setHasBeenInView] = useState(initialInView);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Check for IntersectionObserver support
        if (!("IntersectionObserver" in window)) {
            // Fallback: assume in view
            setInView(true);
            setHasBeenInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isIntersecting = entry.isIntersecting;

                if (isIntersecting) {
                    setInView(true);
                    setHasBeenInView(true);

                    // If triggerOnce, stop observing
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setInView(false);
                }
            },
            {
                threshold,
                rootMargin,
            }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [threshold, rootMargin, triggerOnce]);

    return { ref, inView, hasBeenInView };
}

/**
 * Hook to add visible class when element enters viewport
 * Convenience wrapper for CSS-based animations
 */
export function useScrollReveal(options: UseInViewOptions = {}) {
    const { ref, inView, hasBeenInView } = useInView(options);

    return {
        ref,
        className: hasBeenInView ? "visible" : "",
        inView,
    };
}
