"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarBlank } from "@phosphor-icons/react";
import { format } from "date-fns";

export function DateDiff() {
    const [date1, setDate1] = useState<Date>(new Date());
    const [date2, setDate2] = useState<Date>(new Date());
    const [open1, setOpen1] = useState(false);
    const [open2, setOpen2] = useState(false);

    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const result = {
        days: diffDays,
        weeks: Math.floor(diffDays / 7),
        months: Math.floor(diffDays / 30.44),
        years: Math.floor(diffDays / 365.25),
        hours: Math.floor(diffTime / (1000 * 60 * 60)),
    };

    const setPreset = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setDate2(d);
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Date inputs */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">from</label>
                    <Popover open={open1} onOpenChange={setOpen1}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                            >
                                <CalendarBlank className="mr-2 h-4 w-4" />
                                {format(date1, "MMM d, yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date1}
                                onSelect={(d) => { if (d) { setDate1(d); setOpen1(false); } }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">to</label>
                    <Popover open={open2} onOpenChange={setOpen2}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                            >
                                <CalendarBlank className="mr-2 h-4 w-4" />
                                {format(date2, "MMM d, yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date2}
                                onSelect={(d) => { if (d) { setDate2(d); setOpen2(false); } }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Quick presets */}
            <div className="flex gap-1 flex-wrap">
                {[
                    { label: "+7d", days: 7 },
                    { label: "+30d", days: 30 },
                    { label: "+90d", days: 90 },
                    { label: "+1y", days: 365 },
                ].map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => setPreset(preset.days)}
                        className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Result */}
            <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-primary">{result.days}</p>
                    <p className="text-sm text-muted-foreground">days</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="font-semibold">{result.weeks}</p>
                        <p className="text-xs text-muted-foreground">weeks</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="font-semibold">{result.months}</p>
                        <p className="text-xs text-muted-foreground">months</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="font-semibold">{result.years}</p>
                        <p className="text-xs text-muted-foreground">years</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="font-semibold">{result.hours.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">hours</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
