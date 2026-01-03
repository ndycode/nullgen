import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Warning, House, ArrowClockwise } from "@phosphor-icons/react";

interface ErrorStateProps {
    /** Error title */
    title?: string;
    /** Error description */
    description?: string;
    /** Retry handler - if provided, shows retry button */
    onRetry?: () => void;
    /** Whether to show the home link (default: true) */
    showHomeLink?: boolean;
    /** Additional footer text */
    footerText?: string;
    /** Whether to use full-screen layout (default: true) */
    fullScreen?: boolean;
}

/**
 * Reusable error state component for displaying errors consistently.
 */
export function ErrorState({
    title = "Something didn't load correctly",
    description = "This may be a temporary issue. You can try again, or go back to the home page.",
    onRetry,
    showHomeLink = true,
    footerText = "If this keeps happening, try refreshing the page.",
    fullScreen = true,
}: ErrorStateProps) {
    const content = (
        <div className="max-w-sm space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                <Warning weight="duotone" className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {(onRetry || showHomeLink) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {onRetry && (
                        <Button onClick={onRetry} className="flex-1 gap-2">
                            <ArrowClockwise weight="bold" className="w-4 h-4" />
                            Try again
                        </Button>
                    )}
                    {showHomeLink && (
                        <Link href="/" className="flex-1">
                            <Button
                                variant={onRetry ? "outline" : "default"}
                                className="w-full gap-2"
                            >
                                <House weight="bold" className="w-4 h-4" />
                                Go home
                            </Button>
                        </Link>
                    )}
                </div>
            )}

            {footerText && (
                <p className="text-xs text-muted-foreground/60 text-center">{footerText}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-center">
                {content}
            </div>
        );
    }

    return <div className="flex flex-col items-center py-8 text-center">{content}</div>;
}
