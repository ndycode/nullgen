import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const dynamic = "force-dynamic";
import ShareClient from "./share-client";

export default function SharePage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center px-4 py-8">
                    <LoadingSpinner size="md" label="Redirecting..." />
                </main>
            }
        >
            <ShareClient />
        </Suspense>
    );
}
