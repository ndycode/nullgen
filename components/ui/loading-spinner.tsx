import { Spinner } from "@phosphor-icons/react/dist/ssr";

type SpinnerSize = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
    /** Size of the spinner */
    size?: SpinnerSize;
    /** Optional label text */
    label?: string;
    /** Additional CSS class */
    className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
};

/**
 * Reusable loading spinner component.
 */
export function LoadingSpinner({ size = "md", label, className = "" }: LoadingSpinnerProps) {
    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <Spinner weight="bold" className={`${SIZE_CLASSES[size]} text-primary animate-spin`} />
            {label && <p className="text-sm text-muted-foreground">{label}</p>}
        </div>
    );
}
