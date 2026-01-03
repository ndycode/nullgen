"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "@phosphor-icons/react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type ButtonProps = React.ComponentProps<typeof Button>;

interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
    /** Text to copy to clipboard */
    text: string;
    /** Optional callback after successful copy */
    onCopy?: () => void;
    /** Custom label (defaults to "Copy" / "Copied!") */
    label?: string;
    /** Custom copied label */
    copiedLabel?: string;
    /** Whether to show icon */
    showIcon?: boolean;
}

/**
 * Reusable copy-to-clipboard button with automatic feedback.
 */
export function CopyButton({
    text,
    onCopy,
    label = "Copy",
    copiedLabel = "Copied!",
    showIcon = true,
    variant = "outline",
    className = "",
    disabled,
    children,
    ...props
}: CopyButtonProps) {
    const { copied, copy } = useCopyToClipboard();

    const handleClick = async () => {
        const success = await copy(text);
        if (success && onCopy) {
            onCopy();
        }
    };

    return (
        <Button
            variant={variant}
            onClick={handleClick}
            disabled={disabled || !text}
            className={`gap-1.5 ${className}`}
            {...props}
        >
            {showIcon &&
                (copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />)}
            {children ?? (copied ? copiedLabel : label)}
        </Button>
    );
}
