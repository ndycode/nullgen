"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GoogleLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-background overflow-hidden relative flex items-center justify-center">
            <FlickeringGrid
                className="absolute inset-0 z-0"
                squareSize={4}
                gridGap={6}
                color="rgb(16, 185, 129)"
                maxOpacity={0.08}
                flickerChance={0.05}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative z-10"
            >
                <Card className="w-[400px] border bg-background/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Sign In</CardTitle>
                        <CardDescription>
                            Sign in with Google to upload files to your Drive
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={() => signIn("google", { callbackUrl: "/share" })}
                                className="w-full gap-3"
                                size="lg"
                            >
                                <GoogleLogo weight="bold" className="w-5 h-5" />
                                Continue with Google
                            </Button>
                        </motion.div>

                        <p className="text-xs text-muted-foreground text-center">
                            Files will be uploaded to your personal Google Drive
                        </p>

                        <div className="pt-2">
                            <Link href="/">
                                <Button variant="ghost" className="w-full">
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
    );
}
