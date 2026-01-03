"use client";

import { useState, useCallback } from "react";
import { CODE_LENGTH } from "@/lib/constants";

interface FileInfo {
    name: string;
    size: number;
    expiresAt: string;
    requiresPassword: boolean;
    downloadsRemaining: number | string;
}

interface DownloadState {
    code: string;
    status: "idle" | "loading" | "ready" | "downloading";
    error: string;
    fileInfo: FileInfo | null;
    password: string;
}

export function useDownload() {
    const [state, setState] = useState<DownloadState>({
        code: "",
        status: "idle",
        error: "",
        fileInfo: null,
        password: "",
    });

    const setCode = useCallback((code: string) => {
        setState(prev => ({ ...prev, code, error: "" }));
    }, []);

    const setPassword = useCallback((password: string) => {
        setState(prev => ({ ...prev, password }));
    }, []);

    const checkCode = useCallback(async (codeToCheck?: string) => {
        const code = codeToCheck || state.code;
        if (code.length !== CODE_LENGTH) return null;

        setState(prev => ({ ...prev, status: "loading", error: "", fileInfo: null }));

        try {
            const res = await fetch(`/api/download/${code}`);
            const data = await res.json();

            if (!res.ok) {
                setState(prev => ({
                    ...prev,
                    error: data.error || "File not found",
                    status: "idle",
                }));
                return null;
            }

            setState(prev => ({
                ...prev,
                fileInfo: data,
                status: "ready",
            }));
            return data as FileInfo;
        } catch {
            setState(prev => ({
                ...prev,
                error: "Network error - check your connection",
                status: "idle",
            }));
            return null;
        }
    }, [state.code]);

    const download = useCallback(async () => {
        if (!state.fileInfo) return false;

        setState(prev => ({ ...prev, status: "downloading" }));

        try {
            const res = await fetch(`/api/download/${state.code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: state.fileInfo.requiresPassword ? state.password : undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setState(prev => ({
                    ...prev,
                    error: data.error || "Download failed",
                    status: "ready",
                }));
                return false;
            }

            if (!data.downloadUrl) {
                setState(prev => ({
                    ...prev,
                    error: "Download failed",
                    status: "ready",
                }));
                return false;
            }

            const link = document.createElement("a");
            link.href = data.downloadUrl as string;
            link.download = state.fileInfo.name;
            document.body.appendChild(link);
            link.click();
            link.remove();

            const { toast } = await import("sonner");
            toast.success("Download started!");

            // Reset after successful download
            setState({
                code: "",
                status: "idle",
                error: "",
                fileInfo: null,
                password: "",
            });

            return true;
        } catch {
            setState(prev => ({
                ...prev,
                error: "Download failed",
                status: "ready",
            }));
            return false;
        }
    }, [state.code, state.fileInfo, state.password]);

    const reset = useCallback(() => {
        setState({
            code: "",
            status: "idle",
            error: "",
            fileInfo: null,
            password: "",
        });
    }, []);

    return {
        ...state,
        setCode,
        setPassword,
        checkCode,
        download,
        reset,
    };
}
