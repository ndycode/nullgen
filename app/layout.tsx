import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: "NullGen - Secure File Transfer",
  description: "Transfer files securely between devices with a simple 6-digit code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} dark`}>
      <body className={`${jetbrainsMono.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

