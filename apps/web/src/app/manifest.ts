import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Utah Esports",
    short_name: "Utah Esports",
    description:
      "Find Utah tournaments, gaming communities, teams, and places to play.",
    start_url: "/",
    display: "standalone",
    background_color: "#12141a",
    theme_color: "#1a1d26",
    icons: [
      { src: "/favicon.png", sizes: "32x32", type: "image/png" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/images/site/logo-square.jpg", sizes: "192x192", type: "image/jpeg" },
    ],
  };
}
