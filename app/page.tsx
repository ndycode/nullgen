"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShareNetwork } from "@phosphor-icons/react";

// Smooth sophisticated transition
const transitionSmooth = { type: "tween", ease: "easeOut", duration: 0.8 } as const;

export default function HomePage() {
    return (
        <main className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative">
            <motion.div
                className="text-center relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitionSmooth}
            >
                <Link href="/share">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <Button size="lg" className="gap-3 px-8 py-6 text-lg shadow-xl transition-all border border-border/50 bg-background text-foreground hover:bg-muted/50">
                            <ShareNetwork weight="duotone" className="w-6 h-6 text-primary" />
                            Share File
                        </Button>
                    </motion.div>
                </Link>
            </motion.div>
        </main>
    );
}