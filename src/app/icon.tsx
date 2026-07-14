import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser tab favicon — the same "m." mark the console sidebar collapses
 * down to (see ConsoleShell.tsx), same colors: dark ink ground, bone "m",
 * bronze dot.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1A16",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "#F4F2EC",
        }}
      >
        m<span style={{ color: "#C68A47" }}>.</span>
      </div>
    ),
    { ...size },
  );
}
