import { ImageResponse } from "next/og";

export const alt = "رَد — آثار یکتای هنری | RAD unique artworks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(145deg, #f3ebe0 0%, #e7d8c4 55%, #dcc9b0 100%)",
          color: "#201b17",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#a13d2e",
            height: 630,
            left: 0,
            position: "absolute",
            width: 34,
          }}
        />
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 160,
              fontWeight: 700,
              letterSpacing: -6,
              lineHeight: 1,
            }}
          >
            رَد
          </div>
          <div
            style={{
              color: "#a13d2e",
              fontSize: 28,
              letterSpacing: 4,
              marginTop: 24,
            }}
          >
            آثار یکتای هنری
          </div>
          <div
            style={{
              background: "#201b17",
              height: 2,
              marginTop: 36,
              width: 140,
            }}
          />
          <div style={{ fontSize: 22, letterSpacing: 3, marginTop: 24 }}>
            RAD · UNIQUE ARTWORKS
          </div>
        </div>
      </div>
    ),
    size,
  );
}
