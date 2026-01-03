import { Warning, Info, WarningCircle } from "@phosphor-icons/react";

type AlertVariant = "error" | "warning" | "info";

interface AlertBannerProps {
    /** Visual variant */
    variant?: AlertVariant;
    /** Alert content */
    children: React.ReactNode;
    /** Additional CSS class */
    className?: string;
}

const VARIANT_STYLES: Record<AlertVariant, string> = {
    error: "bg-destructive/10 text-destructive",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
    info: "bg-primary/10 text-primary",
};

const VARIANT_ICONS: Record<AlertVariant, React.ElementType> = {
    error: Warning,
    warning: WarningCircle,
    info: Info,
};

/**
 * Reusable inline alert banner for error, warning, or info messages.
 */
export function AlertBanner({ variant = "error", children, className = "" }: AlertBannerProps) {
    const Icon = VARIANT_ICONS[variant];

    return (
        <div
            className={`${VARIANT_STYLES[variant]} text-sm p-3 rounded-lg flex items-center gap-2 ${className}`}
        >
            <Icon weight="fill" className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">{children}</div>
        </div>
    );
}
