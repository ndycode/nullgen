"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cube, CaretDown } from "@phosphor-icons/react";

interface WebGLData {
    supported: boolean;
    version: string;
    renderer: string;
    vendor: string;
    maxTextureSize: number;
    maxViewportDims: number[];
    extensions: number;
}

export function WebGLChecker() {
    const [data, setData] = useState<WebGLData | null>(null);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
            setData({
                supported: false,
                version: "none",
                renderer: "unknown",
                vendor: "unknown",
                maxTextureSize: 0,
                maxViewportDims: [0, 0],
                extensions: 0,
            });
            return;
        }

        const glContext = gl as WebGLRenderingContext;
        const debugInfo = glContext.getExtension("WEBGL_debug_renderer_info");

        setData({
            supported: true,
            version: glContext.getParameter(glContext.VERSION) || "unknown",
            renderer: debugInfo ? glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown",
            vendor: debugInfo ? glContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "unknown",
            maxTextureSize: glContext.getParameter(glContext.MAX_TEXTURE_SIZE) || 0,
            maxViewportDims: glContext.getParameter(glContext.MAX_VIEWPORT_DIMS) || [0, 0],
            extensions: glContext.getSupportedExtensions()?.length || 0,
        });
    }, []);

    if (!data) return null;

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Main Result */}
            <div className={`bg-muted/50 p-3 rounded-lg text-center space-y-1 ${!data.supported ? "border border-destructive/50" : ""}`}>
                <p className="text-lg font-semibold">{data.supported ? "webgl supported" : "webgl not supported"}</p>
                {data.supported && (
                    <p className="text-xs text-muted-foreground truncate">{data.renderer}</p>
                )}
            </div>

            {data.supported && (
                <>
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">vendor</p>
                            <p className="font-medium truncate">{data.vendor.split(" ")[0]}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">extensions</p>
                            <p className="font-medium">{data.extensions}</p>
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
                                className="space-y-2 overflow-hidden text-sm"
                            >
                                <div>
                                    <p className="text-xs text-muted-foreground">version</p>
                                    <p className="font-medium truncate">{data.version}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">renderer</p>
                                    <p className="font-medium text-xs break-all">{data.renderer}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">max texture</p>
                                    <p className="font-medium">{data.maxTextureSize}px</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">max viewport</p>
                                    <p className="font-medium">{data.maxViewportDims.join(" × ")}px</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}
