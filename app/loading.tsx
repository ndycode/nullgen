import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <LoadingSpinner size="lg" label="Loading..." />
        </main>
    );
}
