import type { Metadata } from "next";
import { TypingTest } from "@/components/typing/typing-test";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 pt-6 pb-6 md:px-10">
      <h1 className="sr-only">keyclash — free online typing test</h1>
      <TypingTest />
    </main>
  );
}
