"use client";

import * as React from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-8 h-8 rounded-lg border-2 border-border cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        className
                    )}
                    style={{ backgroundColor: color }}
                />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-3">
                    <HexColorPicker color={color} onChange={onChange} />
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg border"
                            style={{ backgroundColor: color }}
                        />
                        <HexColorInput
                            color={color}
                            onChange={onChange}
                            prefixed
                            className="flex-1 px-2 py-1 text-xs font-mono bg-muted border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
