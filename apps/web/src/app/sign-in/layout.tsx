import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to save events, follow communities, and get weekly Utah gaming digests — or browse without an account.",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: true },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
