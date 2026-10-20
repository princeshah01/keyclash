import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#2a9d84",
      }}
    >
      <svg aria-hidden height="120" viewBox="0 0 32 32" width="120">
        <path
          d="M10 9.5v13m0-6.5 8-6.5m-5 4.5 5.5 7"
          fill="none"
          stroke="#fcf8f6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
    </div>,
    size,
  );
}
