import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ShareLoading() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm space-y-6">
                {/* Skeleton Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-muted rounded-xl mx-auto skeleton-shimmer" />
                    <div className="h-6 w-32 bg-muted rounded mx-auto skeleton-shimmer" />
                    <div className="h-4 w-24 bg-muted rounded mx-auto skeleton-shimmer" />
                </div>

                {/* Skeleton Content */}
                <div className="bg-card border rounded-2xl p-6">
                    <div className="flex flex-col items-center py-8">
                        <LoadingSpinner size="md" label="Loading share..." />
                    </div>
                </div>

                {/* Skeleton Footer */}
                <div className="h-3 w-32 bg-muted/50 rounded mx-auto skeleton-shimmer" />
            </div>
        </main>
    );
}
