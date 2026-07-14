import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon — same mark as icon.svg, scaled up.
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
          position: "relative",
          background: "#1B1B19",
          borderRadius: 39,
          fontFamily: "'Space Grotesk','Poppins','Helvetica Neue',Arial,sans-serif",
          fontWeight: 700,
          fontSize: 108,
          color: "#F4F2EC",
        }}
      >
        m
        <div
          style={{
            position: "absolute",
            left: 126,
            top: 106,
            width: 21,
            height: 21,
            borderRadius: "50%",
            background: "#B07A3C",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
