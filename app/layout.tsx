import type { Metadata, Viewport } from "next";
import {
  Fira_Code,
  Geist_Mono,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Lexend,
  Roboto_Mono,
  Source_Code_Pro,
  Space_Grotesk,
  Space_Mono,
} from "next/font/google";
import Script from "next/script";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { BOOT_SCRIPT } from "@/lib/settings/apply";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code", display: "swap" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });

const fontVariables = [
  grotesk,
  geistMono,
  jetbrainsMono,
  firaCode,
  ibmPlexMono,
  sourceCodePro,
  spaceMono,
  robotoMono,
  lexend,
].map((font) => font.variable);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  category: "games",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ["keyclash typing test", "key clash"],
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
}).replace(/</g, "\\u003c");

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1b2224" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={cn(fontVariables)}
      data-accent="keyclash"
      data-font="space-grotesk"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <Script id="settings-boot" strategy="beforeInteractive">
          {BOOT_SCRIPT}
        </Script>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, `<` escaped
          dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }}
          type="application/ld+json"
        />
      </head>
      <body suppressHydrationWarning>
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
