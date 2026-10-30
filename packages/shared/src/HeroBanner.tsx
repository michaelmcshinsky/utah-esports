import type { ReactNode } from "react";

/**
 * Royal Tickets-style hero banner. One component, two variants:
 *
 * - `image` (default): full-bleed photo hero with a dark gradient overlay —
 *   for detail/landing pages where the photo carries the brand.
 * - `band`: lightweight gradient band, no photo, tighter padding — for
 *   top-level listing pages so the banner doesn't compete with the results.
 */
export function HeroBanner({
  title,
  subtitle,
  children,
  backgroundImage,
  variant = "image",
  className = "",
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  backgroundImage?: string;
  variant?: "image" | "band";
  className?: string;
}) {
  if (variant === "band") {
    return (
      <div className={`hero-band text-white ${className}`}>
        <div className="page-container py-10 sm:py-12">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm text-white/85">{subtitle}</p> : null}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`hero-section text-white ${className}`}
      style={{
        backgroundImage: backgroundImage
          ? `url('${backgroundImage}')`
          : "linear-gradient(135deg, rgba(36,38,43,0.88), rgba(36,38,43,0.72))",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="page-container py-14">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-charcoal-200">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
