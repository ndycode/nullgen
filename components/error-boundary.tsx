"use client";

import React from "react";
import { ErrorState } from "@/components/ui/error-state";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to console for debugging - never expose to users
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return <ErrorState onRetry={this.handleReset} fullScreen={false} />;
        }

        return this.props.children;
    }
}
