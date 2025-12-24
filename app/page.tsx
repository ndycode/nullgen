"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolsCarousel } from "@/components/tools-carousel";
import { DeadDrop } from "@/components/tools/dead-drop";
import { QRGen } from "@/components/tools/qr-gen";
import { PassGen } from "@/components/tools/passgen";
import { ColorPicker } from "@/components/tools/color-picker";
import { HashGen } from "@/components/tools/hash-gen";
import { TextCleaner } from "@/components/tools/text-cleaner";
import { WordCount } from "@/components/tools/word-count";
import { DateDiff } from "@/components/tools/date-diff";
import { EmojiPicker } from "@/components/tools/emoji-picker";
import { CaseConverter } from "@/components/tools/case-converter";
import { ImageConverter } from "@/components/tools/image-converter";
import { FaviconGen } from "@/components/tools/favicon-gen";
import { BackgroundRemover } from "@/components/tools/bg-remover";

const transition = { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const };

export default function HomePage() {
    const [showTools, setShowTools] = useState(false);

    if (showTools) {
        return (
            <ToolsCarousel onBack={() => setShowTools(false)}>
                {/* Sharing */}
                <DeadDrop />
                <QRGen />
                {/* Generate */}
                <PassGen />
                <ColorPicker />
                <HashGen />
                {/* Text */}
                <TextCleaner />
                <WordCount />
                <DateDiff />
                <EmojiPicker />
                <CaseConverter />
                {/* Image */}
                <ImageConverter />
                <FaviconGen />
                <BackgroundRemover />
            </ToolsCarousel>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-visible">
            <div className="w-full max-w-xs md:max-w-sm text-center space-y-8 overflow-visible">

                {/* Brand - will morph to header */}
                <motion.div
                    layoutId="page-header"
                    className="space-y-2"
                    transition={transition}
                >
                    <motion.h1
                        layoutId="page-title"
                        className="text-4xl font-bold tracking-tight"
                        transition={transition}
                    >
                        vxid.cc
                    </motion.h1>
                    <motion.p
                        layoutId="page-subtitle"
                        className="text-muted-foreground text-sm"
                        transition={transition}
                    >
                        all tools u need :&gt;
                    </motion.p>
                </motion.div>

                {/* Enter Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <Button
                        size="lg"
                        className="w-full text-base py-6 rounded-xl"
                        onClick={() => setShowTools(true)}
                    >
                        enter
                    </Button>
                </motion.div>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-xs text-muted-foreground/50"
                >
                    the tools you keep forgetting to bookmark
                </motion.p>
            </div>
        </main>
    );
}