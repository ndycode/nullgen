import { ShareViewerClient } from "./share-viewer-client";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ code: string }>;
}

export default async function ShareViewerPage({ params }: PageProps) {
    const { code } = await params;
    return <ShareViewerClient code={code} />;
}
