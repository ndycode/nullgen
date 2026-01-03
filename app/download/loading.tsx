import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DecorativeBackground } from "@/components/decorative-background";

export default function DownloadLoading() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-background via-background to-primary/5">
            <DecorativeBackground />

            <div className="relative z-10 w-full max-w-sm">
                {/* Skeleton Header */}
                <div className="mb-8">
                    <div className="h-10 w-32 bg-muted rounded-lg skeleton-shimmer mb-4" />
                    <div className="h-8 w-48 bg-muted rounded-lg skeleton-shimmer mb-2" />
                    <div className="h-4 w-64 bg-muted rounded skeleton-shimmer" />
                </div>

                {/* Skeleton Card */}
                <div className="bg-card border-2 rounded-xl p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-muted rounded skeleton-shimmer" />
                            <div className="h-5 w-24 bg-muted rounded skeleton-shimmer" />
                        </div>
                        <div className="h-4 w-48 bg-muted rounded skeleton-shimmer" />
                    </div>

                    <div className="flex flex-col items-center py-4">
                        <LoadingSpinner size="md" label="Loading download..." />
                    </div>
                </div>
            </div>
        </main>
    );
}
