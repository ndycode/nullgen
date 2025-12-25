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
        <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center px-3 sm:px-6 lg:px-12 py-4 sm:py-6 relative transform-gpu overflow-visible">
            {/* Back button */}
            <button
                onClick={onBack}
                className="absolute top-3 left-3 sm:top-4 sm:left-4 p-2 rounded-lg hover:bg-muted transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Header - morphs from home page, then instant updates */}
            <motion.div
                layoutId="page-header"
                className="text-center mb-3 sm:mb-4 md:mb-6 max-w-sm md:max-w-md lg:max-w-lg w-full space-y-1 sm:space-y-2 mt-10 sm:mt-0"
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
                <motion.h1
                    layoutId="page-title"
                    className="text-3xl sm:text-4xl font-bold tracking-tight"
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                >
                    {currentTool.name}
                </motion.h1>
                <motion.p
                    layoutId="page-subtitle"
                    className="text-muted-foreground text-xs sm:text-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                >
                    {currentTool.tagline}
                </motion.p>
            </motion.div>

            {/* Content with inline arrows */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-6 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
                {/* Left arrow - minimal */}
                <button
                    onClick={() => paginate(-1)}
                    disabled={currentIndex === 0}
                    className="hidden md:flex items-center justify-center p-2 text-muted-foreground hover:text-primary disabled:opacity-20 disabled:hover:text-muted-foreground transition-colors shrink-0"
                >
                    <CaretLeft className="w-6 h-6" />
                </button>

                {/* Tool content */}
                <div className="w-full max-w-sm md:max-w-md lg:max-w-lg relative mx-auto">
                    {children[currentIndex]}
                </div>

                {/* Right arrow - minimal */}
                <button
                    onClick={() => paginate(1)}
                    disabled={currentIndex === children.length - 1}
                    className="hidden md:flex items-center justify-center p-2 text-muted-foreground hover:text-primary disabled:opacity-20 disabled:hover:text-muted-foreground transition-colors shrink-0"
                >
                    <CaretRight className="w-6 h-6" />
                </button>
            </div>

            {/* Navigation hint */}
            <div className="flex flex-col items-center gap-2 mt-4 sm:mt-6">
                <p className="text-[10px] text-muted-foreground/40">use dropdown below</p>
            </div>

            {/* Tool dropdown menu */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
                {/* Clickable tool name with dropdown */}
                <div className="relative">
                    <motion.button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-sm hover:text-foreground transition-all flex items-center gap-1 px-3 py-1.5 rounded-lg"
                        style={{ color: "#a1a1aa" }}
                        animate={{
                            color: ["#a1a1aa", "#ec4899", "#a1a1aa", "#ec4899", "#a1a1aa"],
                            opacity: [0.6, 1, 0.6, 1, 1]
                        }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                    >
                        {currentTool.name}
                        <CaretDown className={`w-3 h-3 transition-transform ${showMenu ? "rotate-180" : ""}`} />
                    </motion.button>

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
                                    {/* Tools by category */}
                                    <div className="space-y-3">
                                        {/* Checker */}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground/50 uppercase px-1 mb-1">checker</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.filter(t => t.category === 'checker').map((tool) => {
                                                    const index = TOOLS.findIndex(t => t.id === tool.id);
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

                                        {/* Sharing */}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground/50 uppercase px-1 mb-1">sharing</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.filter(t => t.category === 'sharing').map((tool) => {
                                                    const index = TOOLS.findIndex(t => t.id === tool.id);
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
                                            <p className="text-[10px] text-muted-foreground/50 uppercase px-1 mb-1">generate</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.filter(t => t.category === 'generate').map((tool) => {
                                                    const index = TOOLS.findIndex(t => t.id === tool.id);
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

                                        {/* Text */}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground/50 uppercase px-1 mb-1">text</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.filter(t => t.category === 'text').map((tool) => {
                                                    const index = TOOLS.findIndex(t => t.id === tool.id);
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
                                            <p className="text-[10px] text-muted-foreground/50 uppercase px-1 mb-1">image</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {TOOLS.filter(t => t.category === 'image').map((tool) => {
                                                    const index = TOOLS.findIndex(t => t.id === tool.id);
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
