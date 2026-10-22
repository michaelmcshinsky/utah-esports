import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Moderation", template: "%s · Moderation" },
  robots: { index: false, follow: false },
};

export default function ModerationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
