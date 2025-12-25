"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolsCarousel } from "@/components/tools-carousel";
import { DeadDrop } from "@/components/tools/dead-drop";
import { QRGen } from "@/components/tools/qr-gen";
import { LinkShortener } from "@/components/tools/link-shortener";
import { Pastebin } from "@/components/tools/pastebin";
import { ImageHost } from "@/components/tools/image-host";
import { SecretNote } from "@/components/tools/secret-note";
import { CodeShare } from "@/components/tools/code-share";
import { JsonShare } from "@/components/tools/json-share";
import { CsvShare } from "@/components/tools/csv-share";
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
import { PrivacyStripper } from "@/components/tools/privacy-stripper";
import { ImageCompressor } from "@/components/tools/image-compressor";
import { BulkResizer } from "@/components/tools/bulk-resizer";
import { ImageCropper } from "@/components/tools/image-cropper";
import { SvgOptimizer } from "@/components/tools/svg-optimizer";
import { AspectRatioCalc } from "@/components/tools/aspect-ratio-calc";
import { ColorFromImage } from "@/components/tools/color-from-image";
import { ImageWatermarker } from "@/components/tools/image-watermarker";
import { ImageSplitter } from "@/components/tools/image-splitter";
import { DuplicateRemover } from "@/components/tools/duplicate-remover";
import { TextReverser } from "@/components/tools/text-reverser";
import { CharacterMap } from "@/components/tools/character-map";
import { NumberConverter } from "@/components/tools/number-converter";
import { UuidGenerator } from "@/components/tools/uuid-generator";
import { BarcodeGen } from "@/components/tools/barcode-gen";
import { FakeDataGen } from "@/components/tools/fake-data-gen";
import { ColorPaletteGen } from "@/components/tools/color-palette-gen";
import { CreditCardGen } from "@/components/tools/credit-card-gen";
import { StringGen } from "@/components/tools/string-gen";
import { IntegerGen } from "@/components/tools/integer-gen";
import { SequenceGen } from "@/components/tools/sequence-gen";
import { UsernameGen } from "@/components/tools/username-gen";
import { BusinessNameGen } from "@/components/tools/business-name-gen";
import { IbanGen } from "@/components/tools/iban-gen";
import { MacGen } from "@/components/tools/mac-gen";

const transition = {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 1
};

export default function HomePage() {
    const [showTools, setShowTools] = useState(false);

    if (showTools) {
        // IMPORTANT: Children order MUST match TOOLS array in tools-config.ts exactly!
        // The carousel uses the index to sync between children and TOOLS array
        return (
            <ToolsCarousel onBack={() => setShowTools(false)}>
                {/* 1. dead-drop */}
                <DeadDrop />
                {/* 2. qr-gen */}
                <QRGen />
                {/* 3. link-shortener */}
                <LinkShortener />
                {/* 4. pastebin */}
                <Pastebin />
                {/* 5. image-host */}
                <ImageHost />
                {/* 6. secret-note */}
                <SecretNote />
                {/* 7. code-share */}
                <CodeShare />
                {/* 8. json-share */}
                <JsonShare />
                {/* 9. csv-share */}
                <CsvShare />
                {/* 10. passgen */}
                <PassGen />
                {/* 4. color */}
                <ColorPicker />
                {/* 5. barcode */}
                <BarcodeGen />
                {/* 6. fakedata */}
                <FakeDataGen />
                {/* 7. palette */}
                <ColorPaletteGen />
                {/* 8. testcard */}
                <CreditCardGen />
                {/* 9. stringgen */}
                <StringGen />
                {/* 10. integergen */}
                <IntegerGen />
                {/* 11. sequencegen */}
                <SequenceGen />
                {/* 12. usernamegen */}
                <UsernameGen />
                {/* 13. businessgen */}
                <BusinessNameGen />
                {/* 14. ibangen */}
                <IbanGen />
                {/* 15. macgen */}
                <MacGen />
                {/* 16. privacy */}
                <PrivacyStripper />
                {/* 6. compress */}
                <ImageCompressor />
                {/* 7. resize */}
                <BulkResizer />
                {/* 8. word-count */}
                <WordCount />
                {/* 9. case */}
                <CaseConverter />
                {/* 10. text-clean */}
                <TextCleaner />
                {/* 11. emoji */}
                <EmojiPicker />
                {/* 12. image (convert) */}
                <ImageConverter />
                {/* 13. favicon */}
                <FaviconGen />
                {/* 14. hash */}
                <HashGen />
                {/* 15. date-diff */}
                <DateDiff />
                {/* 16. dedup */}
                <DuplicateRemover />
                {/* 17. reverse */}
                <TextReverser />
                {/* 18. charmap */}
                <CharacterMap />
                {/* 19. numconv */}
                <NumberConverter />
                {/* 20. uuid */}
                <UuidGenerator />
                {/* 21. bg-remove */}
                <BackgroundRemover />
                {/* 22. crop */}
                <ImageCropper />
                {/* 23. svg-opt */}
                <SvgOptimizer />
                {/* 24. ratio */}
                <AspectRatioCalc />
                {/* 25. pick-color */}
                <ColorFromImage />
                {/* 26. watermark */}
                <ImageWatermarker />
                {/* 27. split */}
                <ImageSplitter />
            </ToolsCarousel>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.main
                key="landing"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-visible"
            >
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
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
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
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                        className="text-xs text-muted-foreground/50"
                    >
                        the tools you keep forgetting to bookmark
                    </motion.p>
                </div>
            </motion.main>
        </AnimatePresence>
    );
}