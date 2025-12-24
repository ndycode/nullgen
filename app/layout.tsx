import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: "vxid.cc - Secure File Transfer",
  description: "Transfer files securely between devices with a simple 6-digit code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} dark`}>
      <body className={`${jetbrainsMono.className} antialiased relative`}>
        {/* Flickering Grid Background - Hacker Green */}
        <div className="fixed inset-0 z-0 bg-background">
          <FlickeringGrid
            className="absolute inset-0 w-full h-full"
            squareSize={4}
            gridGap={6}
            color="#22c55e"
            maxOpacity={0.2}
            flickerChance={0.1}
          />
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
