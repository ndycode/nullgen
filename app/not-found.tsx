import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass, House } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="max-w-sm space-y-6">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                    <MagnifyingGlass weight="duotone" className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-semibold">Page not found</h1>
                    <p className="text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                    </p>
                </div>

                <Link href="/">
                    <Button className="w-full gap-2">
                        <House weight="bold" className="w-4 h-4" />
                        Go home
                    </Button>
                </Link>

                <p className="text-xs text-muted-foreground/60">vxid.cc — privacy-first tools</p>
            </div>
        </main>
    );
}
