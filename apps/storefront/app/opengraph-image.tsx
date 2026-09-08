import { ImageResponse } from "next/og";

export const alt = "RAD — Unique artworks by independent artists";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f6f0e5",
        color: "#201b17",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <div style={{ background: "#a13d2e", height: 630, left: 0, position: "absolute", width: 34 }} />
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 190, fontWeight: 700, letterSpacing: -10, lineHeight: 1 }}>RAD</div>
        <div style={{ color: "#a13d2e", fontSize: 27, letterSpacing: 12, marginTop: 28 }}>
          UNIQUE ARTWORKS
        </div>
        <div style={{ background: "#201b17", height: 2, marginTop: 42, width: 150 }} />
        <div style={{ fontSize: 25, letterSpacing: 2, marginTop: 28 }}>
          MADE BY INDEPENDENT ARTISTS
        </div>
      </div>
    </div>,
    size,
  );
}
