"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SharePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home page which now handles both views
        router.replace("/");
    }, [router]);

    return null;
}
