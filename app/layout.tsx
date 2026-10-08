import type { Metadata, Viewport } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: {
    default: "keyclash — typing test & global leaderboard",
    template: "%s · keyclash",
  },
  description:
    "A fast, minimal typing test. Race the clock in time, words, quote or zen mode and climb the global leaderboard.",
  applicationName: "keyclash",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1b2224" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={cn(grotesk.variable, mono.variable)} lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            {children}
          </div>
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
