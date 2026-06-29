import { ImageResponse } from "next/og";

// Image metadata
export const alt = "Costas · Έλεγχος Αυτοκινήτου";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image generation
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#fbfbfc",
          gap: "24px",
        }}
      >
        {/* Brand mark — indigo square with bold white C */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "96px",
            height: "96px",
            borderRadius: "18px",
            backgroundColor: "#4f46e5",
          }}
        >
          <span
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: "52px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            C
          </span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            color: "#111114",
            fontSize: "72px",
            fontWeight: 700,
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Costas
        </div>

        {/* Greek tagline */}
        <div
          style={{
            display: "flex",
            color: "#71757e",
            fontSize: "32px",
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          Έλεγχος &amp; ιστορικό αυτοκινήτου
        </div>
      </div>
    ),
    { ...size }
  );
}
