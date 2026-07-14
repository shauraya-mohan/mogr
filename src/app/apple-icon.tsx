import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon — same "m." mark as icon.tsx, scaled up.
 */
export default function AppleIcon() {
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
          fontSize: 108,
          color: "#F4F2EC",
        }}
      >
        m<span style={{ color: "#C68A47" }}>.</span>
      </div>
    ),
    { ...size },
  );
}
