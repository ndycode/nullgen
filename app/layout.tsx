import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransitionProvider } from "@/components/transition-provider";
import { ClientErrorBoundary } from "@/components/client-error-boundary";
import { GitHubTyping } from "@/components/github-typing";
import { LenisProvider } from "@/components/lenis-provider";
import { AnimatedBackground } from "@/components/animated-background";
import { Toaster } from "sonner";

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: "vxid.cc",
  description: "Transfer files securely between devices with a simple 6-digit code",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

// Inline script to set theme before hydration (defaults to dark)
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${jetbrainsMono.className} antialiased relative min-h-screen`}>
        <LenisProvider>
          <AnimatedBackground />
          <div className="fixed inset-0 z-0 bg-background/80"></div>

          {/* Global Theme Toggle */}
          <div className="fixed top-4 right-4 z-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
            <ThemeToggle />
          </div>

          <div className="relative z-10 min-h-screen">
            <ClientErrorBoundary>
              <TransitionProvider>
                {children}
              </TransitionProvider>
            </ClientErrorBoundary>
          </div>

          {/* Nav Icon */}
          <a
            href="/"
            className="fixed bottom-6 left-6 z-50 w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
          >
            <img src="/logo.png" alt="vxid.cc" className="w-full h-full object-cover invert dark:invert-0" />
          </a>

          {/* Global GitHub Link */}
          <a
            href="https://github.com/ndycode"
            target="_blank"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/40 hover:text-primary transition-colors z-50 pb-[env(safe-area-inset-bottom)]"
          >
            <GitHubTyping />
          </a>

          {/* Toast notifications */}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              },
              classNames: {
                toast: 'dark:shadow-lg dark:shadow-black/30',
                title: 'text-foreground font-medium',
                description: 'text-muted-foreground',
              },
            }}
          />
        </LenisProvider>
      </body>
    </html >
  );
}
