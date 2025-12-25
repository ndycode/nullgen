"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export function LenisProvider({ children }: { children: React.ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // Initialize Lenis with prevent option to allow native scroll in nested elements
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            syncTouch: false,
            touchMultiplier: 2,
            // Allow native scroll behavior for elements with overflow
            prevent: (node) => {
                // Check if element or any parent has overflow-y scroll/auto
                let current: HTMLElement | null = node as HTMLElement;
                while (current && current !== document.body) {
                    const style = window.getComputedStyle(current);
                    const overflowY = style.overflowY;
                    const overflowX = style.overflowX;

                    // Allow native scroll for scrollable containers
                    if (
                        (overflowY === "scroll" || overflowY === "auto") &&
                        current.scrollHeight > current.clientHeight
                    ) {
                        return true;
                    }
                    if (
                        (overflowX === "scroll" || overflowX === "auto") &&
                        current.scrollWidth > current.clientWidth
                    ) {
                        return true;
                    }

                    // Also check for specific data attribute to opt-out
                    if (current.hasAttribute("data-lenis-prevent")) {
                        return true;
                    }

                    current = current.parentElement;
                }
                return false;
            },
        });

        lenisRef.current = lenis;

        // RAF loop
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Cleanup
        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
