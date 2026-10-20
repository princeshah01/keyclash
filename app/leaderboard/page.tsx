import type { Metadata } from "next";
import { Suspense } from "react";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { SITE_NAME } from "@/lib/site";

const description =
  "Live global typing test leaderboard. See the fastest typists by WPM and accuracy, daily, weekly and all time.";

export const metadata: Metadata = {
  title: "Typing test leaderboard",
  description,
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `Typing test leaderboard · ${SITE_NAME}`,
    description,
    url: "/leaderboard",
  },
};

export default function LeaderboardPage() {
  return (
    <main className="flex flex-1 justify-center px-4 pt-6 pb-20 md:px-10">
      <Suspense>
        <LeaderboardView />
      </Suspense>
    </main>
  );
}
