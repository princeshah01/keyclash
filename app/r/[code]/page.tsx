import { Suspense } from "react";
import { JoinRoom } from "@/components/rooms/join-room";

export const metadata = { title: "Join room" };

export default function JoinRoomPage({ params }: PageProps<"/r/[code]">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 pb-24">
      <Suspense>
        <JoinRoom params={params} />
      </Suspense>
    </main>
  );
}
