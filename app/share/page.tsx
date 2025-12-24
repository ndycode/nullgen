"use client";

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

export default function SharePage() {
    return (
        <ToolsCarousel>
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
