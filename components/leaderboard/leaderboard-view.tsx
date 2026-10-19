"use client";

import { Globe, UsersThree } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GlobalBoard } from "@/components/leaderboard/global-board";
import { RoomsView } from "@/components/rooms/rooms-view";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "global", label: "Global", icon: Globe },
  { id: "rooms", label: "Rooms", icon: UsersThree },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function LeaderboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "rooms" ? "rooms" : "global";

  const selectTab = (next: Tab) => {
    const params = new URLSearchParams();
    if (next === "rooms") {
      params.set("tab", "rooms");
    }
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  return (
    <div className={cn("flex w-full flex-col gap-8", tab === "rooms" ? "max-w-6xl" : "max-w-4xl")}>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Leaderboard
        </h1>
        <div className="flex items-center rounded-full bg-surface p-1" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              aria-selected={tab === id}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-[13px] transition-colors",
                tab === id ? "text-primary" : "text-subtle hover:text-muted",
              )}
              key={id}
              onClick={() => selectTab(id)}
              role="tab"
              type="button"
            >
              {tab === id && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary-soft"
                  layoutId="leaderboard-tab"
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                />
              )}
              <Icon className="relative" size={15} weight="duotone" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>
      {tab === "global" ? <GlobalBoard /> : <RoomsView />}
    </div>
  );
}
