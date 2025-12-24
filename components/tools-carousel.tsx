"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CaretLeft, CaretRight, CaretDown, Check } from "@phosphor-icons/react";
import { TOOLS } from "@/lib/tools-config";

interface ToolsCarouselProps {
    children: React.ReactNode[];
    initialIndex?: number;
    onBack?: () => void;
}

export function ToolsCarousel({ children, initialIndex = 0, onBack }: ToolsCarouselProps) {
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

    const selectTool = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
        setShowMenu(false);
    };

    const currentTool = TOOLS[currentIndex];

    const variants = {
        enter: {
            opacity: 0,
        },
        center: {
            zIndex: 1,
            opacity: 1,
        },
        exit: {
            zIndex: 0,
            opacity: 0,
        },
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 py-6 relative transform-gpu overflow-visible">
            {/* Back button */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 p-2 rounded-lg hover:bg-muted transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Header - morphs from home page */}
            <motion.div
                layoutId="page-header"
                className="text-center mb-4 md:mb-6 max-w-sm md:max-w-md lg:max-w-lg w-full transform-gpu space-y-2"
                transition={{ type: "spring", stiffness: 200, damping: 30, mass: 1 }}
            >
                <motion.h1
                    layoutId="page-title"
                    className="text-4xl font-bold tracking-tight"
                    transition={{ type: "spring", stiffness: 200, damping: 30, mass: 1 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={currentTool.id + "-title"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {currentTool.name}
                        </motion.span>
                    </AnimatePresence>
                </motion.h1>
                <motion.p
                    layoutId="page-subtitle"
                    className="text-muted-foreground text-sm"
                    transition={{ type: "spring", stiffness: 200, damping: 30, mass: 1 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={currentTool.id + "-tagline"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {currentTool.tagline}
                        </motion.span>
                    </AnimatePresence>
                </motion.p>
            </motion.div>

            {/* Content with inline arrows */}
            <div className="flex items-center gap-2 md:gap-4 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
                {/* Left arrow */}
                <button
                    onClick={() => paginate(-1)}
                    disabled={currentIndex === 0}
                    className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary hover:scale-110 disabled:opacity-20 disabled:hover:scale-100 disabled:hover:bg-card/50 disabled:hover:border-border transition-all duration-200 shrink-0"
                >
                    <CaretLeft className="w-5 h-5" />
                </button>

                {/* Tool content */}
                <div className="w-full max-w-sm md:max-w-md lg:max-w-lg relative mx-auto">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                                duration: 0.25,
                                ease: "easeOut",
                            }}
                            className="w-full"
                        >
                            {children[currentIndex]}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right arrow */}
                <button
                    onClick={() => paginate(1)}
                    disabled={currentIndex === children.length - 1}
                    className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary hover:scale-110 disabled:opacity-20 disabled:hover:scale-100 disabled:hover:bg-card/50 disabled:hover:border-border transition-all duration-200 shrink-0"
                >
                    <CaretRight className="w-5 h-5" />
                </button>
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

            {/* Tool dropdown menu */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
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
            </div>
        </div>
    );
}
