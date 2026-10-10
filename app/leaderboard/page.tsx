import { Suspense } from "react";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";

export const metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <main className="flex flex-1 justify-center px-4 pt-6 pb-20 md:px-10">
      <Suspense>
        <LeaderboardView />
      </Suspense>
    </main>
  );
}
