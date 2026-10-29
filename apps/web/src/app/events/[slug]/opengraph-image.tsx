import { ImageResponse } from "next/og";
import { getEventBySlug } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(db(), slug);
  const title = event?.title ?? "Utah Esports";
  const city = event?.city ? `${event.city}, UT` : "Utah";
  const date = event?.startsAt
    ? new Date(event.startsAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";
  const games = event?.description?.slice(0, 60) ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#24262b",
          color: "#ffffff",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "#d9072a",
          }}
        />
        <div style={{ fontSize: "18px", color: "#d9072a", letterSpacing: "3px", textTransform: "uppercase" }}>
          Utah Esports
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            lineHeight: 1.2,
            textAlign: "center",
            marginTop: "24px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "24px", color: "#b0b0b0", marginTop: "16px" }}>
          {[city, date].filter(Boolean).join(" · ")}
        </div>
        {games && (
          <div style={{ fontSize: "18px", color: "#8a8a8a", marginTop: "12px" }}>
            {games}...
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "40px",
            fontSize: "16px",
            color: "#8a8a8a",
          }}
        >
          utahesports.net
        </div>
      </div>
    ),
    { ...size },
  );
}
