import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/lib/site";

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dark keyclash palette from globals.css, as hex (satori has no oklch).
const PAGE = "#1b2224";
const PRIMARY = "#5ccdb1";
const FOREGROUND = "#e3ecea";
const MUTED = "#8a9898";
const FAINT = "#4a5759";

const TYPED = "the quick brown fox jumps";
const UNTYPED = "over the lazy dog";

function Logo({ size: px }: { size: number }) {
  return (
    <svg aria-hidden height={px} viewBox="0 0 32 32" width={px}>
      <rect fill={PRIMARY} height="24" opacity="0.25" rx="7" width="24" x="6" y="6" />
      <rect fill={PRIMARY} height="24" rx="7" width="24" x="2" y="2" />
      <path
        d="M10 9.5v9m0-4.5 6-4.5m-3.8 3.1 4.3 4.9"
        fill="none"
        stroke={PAGE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ color: PRIMARY, fontSize: 64, lineHeight: 1 }}>{value}</span>
      <span style={{ color: MUTED, fontSize: 20, letterSpacing: 4 }}>{label}</span>
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "64px 80px",
        background: `radial-gradient(circle at 85% 0%, rgba(92, 205, 177, 0.18), transparent 55%), ${PAGE}`,
        color: FOREGROUND,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Logo size={64} />
        <div style={{ display: "flex", fontSize: 48 }}>
          <span>key</span>
          <span style={{ color: PRIMARY, marginLeft: -8 }}>clash</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <span style={{ fontSize: 76, letterSpacing: -2, lineHeight: 1.05 }}>
          How fast can you type?
        </span>
        <div style={{ display: "flex", alignItems: "center", fontSize: 40 }}>
          <span style={{ color: FOREGROUND }}>{TYPED}</span>
          <span
            style={{ width: 4, height: 46, marginLeft: 12, marginRight: 2, background: PRIMARY }}
          />
          <span style={{ color: FAINT }}>{UNTYPED}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 64 }}>
          <Stat label="WPM" value="142" />
          <Stat label="ACCURACY" value="98%" />
        </div>
        <span
          style={{
            padding: "12px 24px",
            borderRadius: 999,
            background: "rgba(92, 205, 177, 0.15)",
            color: PRIMARY,
            fontSize: 26,
          }}
        >
          free typing test · live global leaderboard
        </span>
      </div>
    </div>,
    size,
  );
}
