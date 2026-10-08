import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-24 text-center">
      <p className="font-bold font-mono text-7xl text-primary">404</p>
      <p className="text-muted">This page took a wrong keystroke.</p>
      <Link className={buttonClass("soft")} href="/">
        back to typing
      </Link>
    </main>
  );
}
