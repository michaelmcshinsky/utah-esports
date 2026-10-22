import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { SiteNav } from "@/src/components/site-nav";
import { SiteFooter } from "@/src/components/site-footer";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/src/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Find Utah tournaments, gaming communities, teams, and places to play. Utah's home base for local esports and gaming.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.png",
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/home/utah-esports-banner-1.jpg",
        width: 1200,
        height: 630,
        alt: "Utah Esports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/home/utah-esports-banner-1.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-redrock-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
