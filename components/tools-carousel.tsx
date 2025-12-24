"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CaretLeft, CaretRight, CaretDown, Check } from "@phosphor-icons/react";
import { TOOLS } from "@/lib/tools-config";

interface ToolsCarouselProps {
    children: React.ReactNode[];
    initialIndex?: number;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

export function ToolsCarousel({ children, initialIndex = 0 }: ToolsCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [direction, setDirection] = useState(0);
    const [showMenu, setShowMenu] = useState(false);

    const paginate = (newDirection: number) => {
        const newIndex = currentIndex + newDirection;
        if (newIndex >= 0 && newIndex < children.length) {
            setDirection(newDirection);
            setCurrentIndex(newIndex);
        }
    };

    const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
        const swipe = swipePower(offset.x, velocity.x);

        if (swipe < -swipeConfidenceThreshold) {
            paginate(1);
        } else if (swipe > swipeConfidenceThreshold) {
            paginate(-1);
        }
    };

    const selectTool = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
        setShowMenu(false);
    };

    const currentTool = TOOLS[currentIndex];

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 200 : -200,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 200 : -200,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-6 relative transform-gpu">
            {/* Back button */}
            <Link href="/" className="absolute top-4 left-4">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>

            {/* Arrow navigation - desktop only */}
            <div className="hidden sm:flex absolute inset-y-0 left-2 items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => paginate(-1)}
                    disabled={currentIndex === 0}
                    className="opacity-50 hover:opacity-100 disabled:opacity-20"
                >
                    <CaretLeft className="w-6 h-6" />
                </Button>
            </div>
            <div className="hidden sm:flex absolute inset-y-0 right-2 items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => paginate(1)}
                    disabled={currentIndex === children.length - 1}
                    className="opacity-50 hover:opacity-100 disabled:opacity-20"
                >
                    <CaretRight className="w-6 h-6" />
                </Button>
            </div>

            {/* Header */}
            <motion.div
                className="text-center mb-6 max-w-sm w-full transform-gpu"
                layout
            >
                <AnimatePresence mode="wait">
                    <motion.h1
                        key={currentTool.id + "-title"}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="text-4xl font-bold tracking-tight"
                    >
                        {currentTool.name}
                    </motion.h1>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentTool.id + "-tagline"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-muted-foreground text-sm"
                    >
                        {currentTool.tagline}
                    </motion.p>
                </AnimatePresence>
            </motion.div>

            {/* Content (no drag - inputs work normally) */}
            <div className="w-full max-w-sm relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.15 },
                        }}
                        className="w-full transform-gpu"
                    >
                        {children[currentIndex]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dot indicators */}
            <div className="flex gap-2 mt-6">
                {TOOLS.map((tool, index) => (
                    <button
                        key={tool.id}
                        onClick={() => selectTool(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex
                            ? "bg-primary w-6"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            }`}
                        aria-label={`Go to ${tool.name}`}
                    />
                ))}
            </div>

            {/* Inline text navigation with dropdown */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
                <button
                    onClick={() => selectTool(currentIndex === 0 ? TOOLS.length - 1 : currentIndex - 1)}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors text-lg"
                    aria-label="Previous tool"
                >
                    ←
                </button>

                {/* Clickable tool name with dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        {currentTool.name}
                        <CaretDown className={`w-3 h-3 transition-transform ${showMenu ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border rounded-xl shadow-lg overflow-hidden w-[280px] max-h-[350px] overflow-y-auto scrollbar-hide z-50 p-2"
                                >
                                    {/* Categories */}
                                    <div className="space-y-2">
                                        {/* Sharing */}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase px-1 mb-1">Sharing</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.slice(0, 2).map((tool, idx) => {
                                                    const index = idx;
                                                    const Icon = tool.icon;
                                                    return (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => selectTool(index)}
                                                            className={`px-2 py-1.5 text-xs rounded-lg flex items-center gap-2 transition-colors ${index === currentIndex
                                                                ? "bg-primary text-primary-foreground"
                                                                : "hover:bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" />
                                                            <span className="truncate">{tool.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Generate */}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase px-1 mb-1">Generate</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.slice(2, 5).map((tool, idx) => {
                                                    const index = idx + 2;
                                                    const Icon = tool.icon;
                                                    return (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => selectTool(index)}
                                                            className={`px-2 py-1.5 text-xs rounded-lg flex items-center gap-2 transition-colors ${index === currentIndex
                                                                ? "bg-primary text-primary-foreground"
                                                                : "hover:bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" />
                                                            <span className="truncate">{tool.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Text Tools */}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase px-1 mb-1">Text</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.slice(5, 10).map((tool, idx) => {
                                                    const index = idx + 5;
                                                    const Icon = tool.icon;
                                                    return (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => selectTool(index)}
                                                            className={`px-2 py-1.5 text-xs rounded-lg flex items-center gap-2 transition-colors ${index === currentIndex
                                                                ? "bg-primary text-primary-foreground"
                                                                : "hover:bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" />
                                                            <span className="truncate">{tool.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Image */}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase px-1 mb-1">Image</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.slice(10).map((tool, idx) => {
                                                    const index = idx + 10;
                                                    const Icon = tool.icon;
                                                    return (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => selectTool(index)}
                                                            className={`px-2 py-1.5 text-xs rounded-lg flex items-center gap-2 transition-colors ${index === currentIndex
                                                                ? "bg-primary text-primary-foreground"
                                                                : "hover:bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" />
                                                            <span className="truncate">{tool.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => selectTool(currentIndex === TOOLS.length - 1 ? 0 : currentIndex + 1)}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors text-lg"
                    aria-label="Next tool"
                >
                    →
                </button>
            </div>
        </div>
    );
}
