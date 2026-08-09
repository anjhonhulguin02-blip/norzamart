import { ImageResponse } from "next/og";

export const alt = "NorzaMart — Fresh, local, delivered today.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F5132 0%, #1B7A4D 100%)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 24, position: "absolute", top: 60, left: 80, fontSize: 64 }}>
          <span>🥬</span>
          <span>🍅</span>
          <span>🥕</span>
        </div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 700, color: "white", letterSpacing: -2 }}>
          Norza<span style={{ color: "#E23744" }}>Mart</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#F3FBF6", marginTop: 20, opacity: 0.9 }}>
          Fresh, local, delivered today.
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#F3FBF6", marginTop: 40, opacity: 0.7 }}>
          Your hyperlocal marketplace for Norzagaray, Bulacan
        </div>
      </div>
    ),
    { ...size }
  );
}
