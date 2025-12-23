"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { ShareNetwork } from "@phosphor-icons/react";

const springBouncy = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function HomePage() {
    return (
        <main className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative">
            {/* Flickering Grid Background */}
            <FlickeringGrid
                className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
                squareSize={4}
                gridGap={6}
                color="rgb(16, 185, 129)"
                maxOpacity={0.15}
                flickerChance={0.1}
            />

            <motion.div
                className="text-center relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springBouncy}
            >
                <Link href="/share">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={springBouncy}
                    >
                        <Button size="lg" className="gap-3 px-8 py-6 text-lg shadow-lg shadow-primary/20">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                            >
                                <ShareNetwork weight="bold" className="w-6 h-6" />
                            </motion.div>
                            Share File
                        </Button>
                    </motion.div>
                </Link>
            </motion.div>
        </main>
    );
}