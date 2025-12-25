"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldWarning, CaretDown } from "@phosphor-icons/react";

interface PasswordAnalysis {
    score: number;
    label: string;
    color: string;
    length: number;
    hasLower: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
    entropy: number;
    crackTime: string;
}

function analyzePassword(password: string): PasswordAnalysis {
    const length = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    // Calculate charset size
    let charset = 0;
    if (hasLower) charset += 26;
    if (hasUpper) charset += 26;
    if (hasNumber) charset += 10;
    if (hasSymbol) charset += 32;

    // Calculate entropy
    const entropy = length * Math.log2(charset || 1);

    // Score based on entropy
    let score = 0;
    if (entropy >= 60) score = 4;
    else if (entropy >= 40) score = 3;
    else if (entropy >= 28) score = 2;
    else if (entropy >= 15) score = 1;

    // Additional penalties
    if (length < 8) score = Math.min(score, 1);
    if (/^[a-zA-Z]+$/.test(password)) score = Math.min(score, 2);
    if (/^[0-9]+$/.test(password)) score = Math.min(score, 1);

    const labels = ["very weak", "weak", "fair", "strong", "very strong"];
    const colors = ["text-destructive", "text-orange-500", "text-yellow-500", "text-primary", "text-green-500"];

    // Crack time estimate (10B guesses/sec)
    const combinations = Math.pow(charset || 1, length);
    const seconds = combinations / 10000000000;
    let crackTime = "instant";
    if (seconds > 31536000000) crackTime = "centuries";
    else if (seconds > 31536000) crackTime = `${Math.floor(seconds / 31536000)} years`;
    else if (seconds > 86400) crackTime = `${Math.floor(seconds / 86400)} days`;
    else if (seconds > 3600) crackTime = `${Math.floor(seconds / 3600)} hours`;
    else if (seconds > 60) crackTime = `${Math.floor(seconds / 60)} minutes`;
    else if (seconds > 1) crackTime = `${Math.floor(seconds)} seconds`;

    return {
        score,
        label: labels[score],
        color: colors[score],
        length,
        hasLower,
        hasUpper,
        hasNumber,
        hasSymbol,
        entropy: Math.round(entropy),
        crackTime,
    };
}

export function PasswordChecker() {
    const [password, setPassword] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const analysis = password ? analyzePassword(password) : null;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Password Input */}
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="enter password to check"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-16 font-mono text-sm"
                />
                <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                    {showPassword ? "hide" : "show"}
                </button>
            </div>

            {/* Result */}
            {analysis && (
                <>
                    {/* Strength Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className={`font-medium ${analysis.color}`}>{analysis.label}</span>
                            <span className="text-muted-foreground">{analysis.entropy} bits</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(analysis.score + 1) * 20}%` }}
                                className={`h-full rounded-full ${analysis.score >= 3 ? "bg-primary" :
                                        analysis.score >= 2 ? "bg-yellow-500" : "bg-destructive"
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">crack time</p>
                            <p className="font-medium">{analysis.crackTime}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">length</p>
                            <p className="font-medium">{analysis.length} chars</p>
                        </div>
                    </div>

                    {/* Options (Details) */}
                    <div>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-full flex items-center justify-between text-sm text-muted-foreground py-2 hover:text-foreground"
                        >
                            details
                            <motion.div animate={{ rotate: showOptions ? 180 : 0 }}>
                                <CaretDown className="w-4 h-4" />
                            </motion.div>
                        </button>
                        {showOptions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="space-y-1 overflow-hidden text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    {analysis.hasLower ? <ShieldCheck className="w-4 h-4 text-primary" /> : <ShieldWarning className="w-4 h-4 text-muted-foreground" />}
                                    <span className={analysis.hasLower ? "" : "text-muted-foreground"}>lowercase letters</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {analysis.hasUpper ? <ShieldCheck className="w-4 h-4 text-primary" /> : <ShieldWarning className="w-4 h-4 text-muted-foreground" />}
                                    <span className={analysis.hasUpper ? "" : "text-muted-foreground"}>uppercase letters</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {analysis.hasNumber ? <ShieldCheck className="w-4 h-4 text-primary" /> : <ShieldWarning className="w-4 h-4 text-muted-foreground" />}
                                    <span className={analysis.hasNumber ? "" : "text-muted-foreground"}>numbers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {analysis.hasSymbol ? <ShieldCheck className="w-4 h-4 text-primary" /> : <ShieldWarning className="w-4 h-4 text-muted-foreground" />}
                                    <span className={analysis.hasSymbol ? "" : "text-muted-foreground"}>symbols</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </>
            )}

            {/* Empty State */}
            {!password && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                    enter a password to analyze
                </div>
            )}
        </motion.div>
    );
}
