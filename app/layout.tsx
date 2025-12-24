import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransitionProvider } from "@/components/transition-provider";
import { ClientErrorBoundary } from "@/components/client-error-boundary";
import { GitHubTyping } from "@/components/github-typing";
import { Toaster } from "sonner";

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: "vxid.cc",
  description: "Transfer files securely between devices with a simple 6-digit code",
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

// Disable right-click globally
const disableRightClickScript = `
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });
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
        <script dangerouslySetInnerHTML={{ __html: disableRightClickScript }} />
      </head>
      <body className={`${jetbrainsMono.className} antialiased relative min-h-screen`}>
        <div className="fixed inset-0 z-0 bg-background"></div>

        {/* Global Theme Toggle */}
        <div className="fixed top-4 right-4 z-50">
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
          className="fixed bottom-6 left-6 z-50 w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform"
        >
          <img src="/logo.png" alt="vxid.cc" className="w-full h-full object-cover invert dark:invert-0" />
        </a>

        {/* Global GitHub Link */}
        <a
          href="https://github.com/ndycode"
          target="_blank"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/40 hover:text-primary transition-colors z-50"
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
          }}
        />
      </body>
    </html>
  );
}
