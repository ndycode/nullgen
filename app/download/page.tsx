import { Suspense } from "react";
import DownloadClient from "./download-client";

export default function DownloadPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center px-4 py-8">
                    Loading...
                </main>
            }
        >
            <DownloadClient />
        </Suspense>
    );
}
