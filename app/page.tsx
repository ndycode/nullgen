"use client";

export const dynamic = "force-static";

import { useState } from "react";
import nextDynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolsCarousel } from "@/components/tools-carousel";

const ToolLoading = () => (
    <div className="w-full py-12 flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading tool...</p>
    </div>
);

// IMPORTANT: Order MUST match TOOLS array in tools-config.ts exactly.
const TOOL_COMPONENTS = [
    nextDynamic(() => import("@/components/tools/ip-checker").then((m) => m.IpChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/dns-checker").then((m) => m.DnsChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/whois-checker").then((m) => m.WhoisChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/ssl-checker").then((m) => m.SslChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/ping-checker").then((m) => m.PingChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/useragent-checker").then((m) => m.UserAgentChecker),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/screen-checker").then((m) => m.ScreenChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/cookies-checker").then((m) => m.CookiesChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/webgl-checker").then((m) => m.WebGLChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/password-checker").then((m) => m.PasswordChecker),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/leak-checker").then((m) => m.LeakChecker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/dead-drop").then((m) => m.DeadDrop), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/qr-gen").then((m) => m.QRGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/link-shortener").then((m) => m.LinkShortener), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/pastebin").then((m) => m.Pastebin), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/image-host").then((m) => m.ImageHost), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/secret-note").then((m) => m.SecretNote), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/code-share").then((m) => m.CodeShare), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/json-share").then((m) => m.JsonShare), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/csv-share").then((m) => m.CsvShare), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/passgen").then((m) => m.PassGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/color-picker").then((m) => m.ColorPicker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/barcode-gen").then((m) => m.BarcodeGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/fake-data-gen").then((m) => m.FakeDataGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/color-palette-gen").then((m) => m.ColorPaletteGen),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/credit-card-gen").then((m) => m.CreditCardGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/string-gen").then((m) => m.StringGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/integer-gen").then((m) => m.IntegerGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/sequence-gen").then((m) => m.SequenceGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/username-gen").then((m) => m.UsernameGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/business-name-gen").then((m) => m.BusinessNameGen),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/iban-gen").then((m) => m.IbanGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/mac-gen").then((m) => m.MacGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/privacy-stripper").then((m) => m.PrivacyStripper),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(
        () => import("@/components/tools/image-compressor").then((m) => m.ImageCompressor),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/bulk-resizer").then((m) => m.BulkResizer), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/word-count").then((m) => m.WordCount), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/case-converter").then((m) => m.CaseConverter), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/text-cleaner").then((m) => m.TextCleaner), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/emoji-picker").then((m) => m.EmojiPicker), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/image-converter").then((m) => m.ImageConverter), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/favicon-gen").then((m) => m.FaviconGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/hash-gen").then((m) => m.HashGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/date-diff").then((m) => m.DateDiff), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/duplicate-remover").then((m) => m.DuplicateRemover),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/text-reverser").then((m) => m.TextReverser), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/character-map").then((m) => m.CharacterMap), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/number-converter").then((m) => m.NumberConverter),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/uuid-generator").then((m) => m.UuidGenerator), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/bg-remover").then((m) => m.BackgroundRemover), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/image-cropper").then((m) => m.ImageCropper), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/svg-optimizer").then((m) => m.SvgOptimizer), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/aspect-ratio-calc").then((m) => m.AspectRatioCalc),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/color-from-image").then((m) => m.ColorFromImage), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(
        () => import("@/components/tools/image-watermarker").then((m) => m.ImageWatermarker),
        { ssr: false, loading: ToolLoading }
    ),
    nextDynamic(() => import("@/components/tools/image-splitter").then((m) => m.ImageSplitter), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/image-blur").then((m) => m.ImageBlur), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/image-rotate").then((m) => m.ImageRotate), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/image-filter").then((m) => m.ImageFilter), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/lorem-gen").then((m) => m.LoremGen), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/base64-tool").then((m) => m.Base64Tool), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/regex-tester").then((m) => m.RegexTester), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/timestamp-tool").then((m) => m.TimestampTool), {
        ssr: false,
        loading: ToolLoading,
    }),
    nextDynamic(() => import("@/components/tools/gradient-gen").then((m) => m.GradientGen), {
        ssr: false,
        loading: ToolLoading,
    }),
];

const transition = {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 1,
};

export default function HomePage() {
    const [showTools, setShowTools] = useState(false);

    if (showTools) {
        return (
            <ToolsCarousel onBack={() => setShowTools(false)}>
                {TOOL_COMPONENTS.map((ToolComponent, index) => (
                    <ToolComponent key={index} />
                ))}
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
                className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
            >
                <div className="w-full max-w-sm text-center space-y-8 overflow-visible">
                    <motion.div
                        layoutId="page-header"
                        className="space-y-3"
                        transition={transition}
                    >
                        <motion.h1
                            layoutId="page-title"
                            className="text-3xl xs:text-4xl font-bold tracking-tight"
                            transition={transition}
                        >
                            vxid.cc
                        </motion.h1>
                        <motion.p
                            layoutId="page-subtitle"
                            className="text-muted-foreground text-sm break-words"
                            transition={transition}
                        >
                            all tools u need :&gt;
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <Button
                            size="lg"
                            className="w-full text-base py-6 rounded-xl hover-lift hover-glow"
                            onClick={() => setShowTools(true)}
                        >
                            enter
                        </Button>
                    </motion.div>

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
