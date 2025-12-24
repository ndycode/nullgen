"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShareNetwork, ArrowRight } from "@phosphor-icons/react";

export default function HomePage() {
    return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden relative gap-8">
            {/* Logo / Brand */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center"
            >
                <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">
                    vxid.cc
                </h1>
                <motion.p
                    className="text-muted-foreground mt-3 text-sm md:text-base"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    Secure file transfer with style
                </motion.p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
                className="relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
                <Link href="/share">
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                        <Button
                            size="lg"
                            className="gap-3 px-8 py-6 text-lg group relative overflow-hidden"
                        >
                            <ShareNetwork weight="duotone" className="w-5 h-5" />
                            <span>Share File</span>
                            <ArrowRight
                                weight="bold"
                                className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200"
                            />
                        </Button>
                    </motion.div>
                </Link>
            </motion.div>

            {/* Decorative elements */}
            <motion.div
                className="absolute bottom-8 text-xs text-muted-foreground/50 font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                encrypted • fast • ephemeral
            </motion.div>
        </main>
    );
}