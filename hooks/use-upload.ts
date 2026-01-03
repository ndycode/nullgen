"use client";

import { useState, useCallback } from "react";
import confetti from "canvas-confetti";

const EXPIRY_MINUTES = [10, 60, 1440, 10080];
const LIMITS_VALUES = [1, 5, 10, -1];

interface UploadOptions {
    expiry: number;
    limit: number;
    password: string;
}

interface UploadState {
    file: File | null;
    status: "idle" | "uploading" | "done";
    progress: number;
    shareCode: string;
    error: string;
}

export function useUpload() {
    const [state, setState] = useState<UploadState>({
        file: null,
        status: "idle",
        progress: 0,
        shareCode: "",
        error: "",
    });

    const setFile = useCallback((file: File | null) => {
        setState(prev => ({ ...prev, file, error: "" }));
    }, []);

    const upload = useCallback(async (options: UploadOptions) => {
        if (!state.file) return;

        setState(prev => ({ ...prev, status: "uploading", progress: 0, error: "" }));

        const mimeType = state.file.type || "application/octet-stream";

        return new Promise<string>(async (resolve, reject) => {
            try {
                const initRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: state.file?.name,
                        size: state.file?.size,
                        mimeType,
                        expiryMinutes: EXPIRY_MINUTES[options.expiry],
                        maxDownloads: LIMITS_VALUES[options.limit],
                        password: options.password || undefined,
                    }),
                });

                const initData = await initRes.json().catch(() => ({}));
                if (!initRes.ok) {
                    setState(prev => ({
                        ...prev,
                        error: initData.error || "Upload failed",
                        status: "idle",
                    }));
                    reject(new Error(initData.error || "Upload failed"));
                    return;
                }

                const uploadUrl = typeof initData.uploadUrl === "string" ? initData.uploadUrl : "";
                const code = typeof initData.code === "string" ? initData.code : "";
                if (!uploadUrl || !code) {
                    setState(prev => ({
                        ...prev,
                        error: "Upload initialization failed",
                        status: "idle",
                    }));
                    reject(new Error("Upload initialization failed"));
                    return;
                }

                await new Promise<void>((uploadResolve, uploadReject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener("progress", (e) => {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            setState(prev => ({ ...prev, progress: percent }));
                        }
                    });

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setState(prev => ({ ...prev, progress: 100 }));
                            uploadResolve();
                            return;
                        }
                        uploadReject(new Error("Upload failed"));
                    });

                    xhr.addEventListener("error", () => uploadReject(new Error("Upload failed")));

                    xhr.open("PUT", uploadUrl);
                    xhr.setRequestHeader("Content-Type", mimeType);
                    xhr.send(state.file as Blob);
                });

                const finalizeRes = await fetch("/api/upload/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });
                const finalizeData = await finalizeRes.json().catch(() => ({}));
                if (!finalizeRes.ok) {
                    setState(prev => ({
                        ...prev,
                        error: finalizeData.error || "Upload failed",
                        status: "idle",
                    }));
                    reject(new Error(finalizeData.error || "Upload failed"));
                    return;
                }

                const shareCode = finalizeData.code || code;
                setState(prev => ({
                    ...prev,
                    shareCode,
                    status: "done",
                }));

                // Fire confetti!
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#ec4899', '#f472b6', '#f9a8d4'],
                });

                const { toast } = await import("sonner");
                toast.success("File uploaded!");
                resolve(shareCode);
            } catch (err) {
                setState(prev => ({
                    ...prev,
                    error: "Upload failed",
                    status: "idle",
                }));
                reject(err instanceof Error ? err : new Error("Upload failed"));
            }
        });
    }, [state.file]);

    const reset = useCallback(() => {
        setState({
            file: null,
            status: "idle",
            progress: 0,
            shareCode: "",
            error: "",
        });
    }, []);

    return {
        ...state,
        setFile,
        upload,
        reset,
    };
}
