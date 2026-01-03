"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Lock,
    Warning,
    Link as LinkIcon,
    FileText,
    Image as ImageIcon,
    Code,
    Table,
    Fire,
    DownloadSimple,
    Eye,
    EyeSlash,
    ArrowClockwise,
    House,
} from "@phosphor-icons/react";
import { ShareType } from "@/lib/share-types";

interface ShareData {
    type: ShareType;
    content: string;
    language?: string;
    originalName?: string;
    mimeType?: string;
    expiresAt: string;
    burnAfterReading: boolean;
    burned: boolean;
    requiresPassword: boolean;
}

const TYPE_ICONS: Record<ShareType, React.ElementType> = {
    link: LinkIcon,
    paste: FileText,
    image: ImageIcon,
    note: Fire,
    code: Code,
    json: Code,
    csv: Table,
};

const TYPE_LABELS: Record<ShareType, string> = {
    link: "Shortened Link",
    paste: "Paste",
    image: "Image",
    note: "Secret Note",
    code: "Code",
    json: "JSON",
    csv: "CSV",
};

function formatJson(content: string): string {
    try {
        return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
        return "Invalid JSON";
    }
}

interface ShareViewerClientProps {
    code: string;
}

export function ShareViewerClient({ code }: ShareViewerClientProps) {
    const [data, setData] = useState<ShareData | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [needsPassword, setNeedsPassword] = useState(false);
    const [shareType, setShareType] = useState<ShareType | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const fetchShare = useCallback(async (pwd?: string) => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/share/${code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: pwd || undefined }),
            });
            const json = await res.json();

            if (res.status === 401 && json.requiresPassword) {
                setNeedsPassword(true);
                setShareType(json.type);
                setLoading(false);
                return;
            }

            if (!res.ok) {
                setError(json.error || "Failed to load share");
                setLoading(false);
                return;
            }

            setData(json);
            setNeedsPassword(false);

            // For links, redirect
            if (json.type === "link") {
                window.location.href = json.content;
            }
        } catch {
            setError("Failed to load share");
        } finally {
            setLoading(false);
        }
    }, [code]);

    useEffect(() => {
        fetchShare();
    }, [fetchShare]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) {
            fetchShare(password);
        }
    };

    const Icon = data?.type ? TYPE_ICONS[data.type] : shareType ? TYPE_ICONS[shareType] : FileText;
    const label = data?.type
        ? TYPE_LABELS[data.type]
        : shareType
            ? TYPE_LABELS[shareType]
            : "Share";

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
            <motion.div
                className="w-full max-w-sm space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                        <Icon weight="duotone" className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">{label}</h1>
                    <p className="text-sm text-muted-foreground">vxid.cc/s/{code}</p>
                </div>

                {/* Content */}
                <motion.div
                    className="bg-card border rounded-2xl p-4 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {loading ? (
                        <div className="py-12">
                            <LoadingSpinner size="md" label="Loading share..." />
                        </div>
                    ) : error ? (
                        <div className="py-8 text-center space-y-4">
                            <Warning
                                weight="duotone"
                                className="w-12 h-12 text-destructive mx-auto"
                            />
                            <p className="text-destructive font-medium">{error}</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={() => fetchShare()}
                                    variant="outline"
                                    className="flex-1 gap-2"
                                >
                                    <ArrowClockwise weight="bold" className="w-4 h-4" />
                                    Try again
                                </Button>
                                <Link href="/" className="flex-1">
                                    <Button variant="ghost" className="w-full gap-2">
                                        <House weight="bold" className="w-4 h-4" />
                                        Go home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : needsPassword ? (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="py-6 text-center space-y-2">
                                <Lock weight="duotone" className="w-12 h-12 text-primary mx-auto" />
                                <p className="font-medium">This share is password protected</p>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="text-center pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeSlash className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <Button type="submit" className="w-full" disabled={!password}>
                                Unlock
                            </Button>
                        </form>
                    ) : data ? (
                        <div className="space-y-4">
                            {/* Burn warning */}
                            {data.burnAfterReading && !data.burned && (
                                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                                    <Fire weight="fill" className="w-4 h-4" />
                                    This content will be destroyed after you leave this page
                                </div>
                            )}

                            {/* Content viewer based on type */}
                            {data.type === "link" && (
                                <div className="py-8 text-center">
                                    <p className="text-muted-foreground">Redirecting...</p>
                                </div>
                            )}

                            {(data.type === "paste" || data.type === "note") && (
                                <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto">
                                    <pre className="whitespace-pre-wrap text-sm font-mono">
                                        {data.content}
                                    </pre>
                                </div>
                            )}

                            {data.type === "code" && (
                                <div className="space-y-2">
                                    {data.language && (
                                        <span className="text-xs text-muted-foreground">
                                            {data.language}
                                        </span>
                                    )}
                                    <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto">
                                        <pre className="text-sm font-mono">
                                            <code>{data.content}</code>
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {data.type === "json" && (
                                <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto">
                                    <pre className="text-sm font-mono">
                                        {formatJson(data.content)}
                                    </pre>
                                </div>
                            )}

                            {data.type === "csv" && (
                                <div className="overflow-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {data.content
                                                .split("\n")
                                                .filter(Boolean)
                                                .map((row, i) => (
                                                    <tr
                                                        key={i}
                                                        className={
                                                            i === 0
                                                                ? "bg-muted/50 font-semibold"
                                                                : ""
                                                        }
                                                    >
                                                        {row.split(",").map((cell, j) => (
                                                            <td
                                                                key={j}
                                                                className="border px-2 py-1"
                                                            >
                                                                {cell.trim()}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {data.type === "image" && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <img
                                            src={data.content}
                                            alt={data.originalName || "Shared image"}
                                            className="max-w-full max-h-96 mx-auto rounded-lg"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = data.content;
                                            link.download = data.originalName || "image.png";
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <DownloadSimple className="w-4 h-4" />
                                        Download image
                                    </Button>
                                </div>
                            )}

                            {/* Copy button */}
                            {data.type !== "link" && data.type !== "image" && (
                                <CopyButton
                                    text={data.content}
                                    label="Copy content"
                                    className="w-full"
                                />
                            )}
                        </div>
                    ) : null}
                </motion.div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground/50">
                    <Link href="/" className="hover:text-foreground">
                        vxid.cc
                    </Link>{" "}
                    — privacy-first tools
                </p>
            </motion.div>
        </main>
    );
}
