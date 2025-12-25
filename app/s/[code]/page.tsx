"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    Lock,
    Warning,
    Link as LinkIcon,
    FileText,
    Image as ImageIcon,
    Code,
    Table,
    Fire
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

export default function ShareViewerPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const code = params.code as string;

    const [data, setData] = useState<ShareData | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [needsPassword, setNeedsPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareType, setShareType] = useState<ShareType | null>(null);

    const fetchShare = async (pwd?: string) => {
        setLoading(true);
        setError("");

        try {
            const url = pwd
                ? `/api/share/${code}?password=${encodeURIComponent(pwd)}`
                : `/api/share/${code}`;

            const res = await fetch(url);
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
            if (json.type === 'link') {
                window.location.href = json.content;
            }
        } catch (err) {
            setError("Failed to load share");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const urlPassword = searchParams.get("p");
        fetchShare(urlPassword || undefined);
    }, [code]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) {
            fetchShare(password);
        }
    };

    const copyContent = async () => {
        if (!data) return;
        await navigator.clipboard.writeText(data.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const Icon = data?.type ? TYPE_ICONS[data.type] : (shareType ? TYPE_ICONS[shareType] : FileText);
    const label = data?.type ? TYPE_LABELS[data.type] : (shareType ? TYPE_LABELS[shareType] : "Share");

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            <motion.div
                className="w-full max-w-lg space-y-6"
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
                        <div className="py-12 text-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center space-y-2">
                            <Warning weight="duotone" className="w-12 h-12 text-destructive mx-auto" />
                            <p className="text-destructive font-medium">{error}</p>
                        </div>
                    ) : needsPassword ? (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="py-6 text-center space-y-2">
                                <Lock weight="duotone" className="w-12 h-12 text-primary mx-auto" />
                                <p className="font-medium">This share is password protected</p>
                            </div>
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="text-center"
                            />
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
                            {data.type === 'link' && (
                                <div className="py-8 text-center">
                                    <p className="text-muted-foreground">Redirecting...</p>
                                </div>
                            )}

                            {(data.type === 'paste' || data.type === 'note') && (
                                <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto">
                                    <pre className="whitespace-pre-wrap text-sm font-mono">
                                        {data.content}
                                    </pre>
                                </div>
                            )}

                            {data.type === 'code' && (
                                <div className="space-y-2">
                                    {data.language && (
                                        <span className="text-xs text-muted-foreground">{data.language}</span>
                                    )}
                                    <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto">
                                        <pre className="text-sm font-mono">
                                            <code>{data.content}</code>
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {data.type === 'json' && (
                                <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto">
                                    <pre className="text-sm font-mono">
                                        {JSON.stringify(JSON.parse(data.content), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {data.type === 'csv' && (
                                <div className="overflow-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {data.content.split('\n').filter(Boolean).map((row, i) => (
                                                <tr key={i} className={i === 0 ? "bg-muted/50 font-semibold" : ""}>
                                                    {row.split(',').map((cell, j) => (
                                                        <td key={j} className="border px-2 py-1">
                                                            {cell.trim()}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {data.type === 'image' && (
                                <div className="text-center">
                                    <img
                                        src={data.content}
                                        alt={data.originalName || "Shared image"}
                                        className="max-w-full max-h-96 mx-auto rounded-lg"
                                    />
                                </div>
                            )}

                            {/* Copy button */}
                            {data.type !== 'link' && data.type !== 'image' && (
                                <Button
                                    onClick={copyContent}
                                    variant="outline"
                                    className="w-full gap-2"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "Copied!" : "Copy content"}
                                </Button>
                            )}
                        </div>
                    ) : null}
                </motion.div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground/50">
                    <a href="/" className="hover:text-foreground">vxid.cc</a> — privacy-first tools
                </p>
            </motion.div>
        </main>
    );
}
