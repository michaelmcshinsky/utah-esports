import type { ReactNode } from "react";

/**
 * Royal Tickets-style hero banner with gradient overlay.
 * State-agnostic — pass your own background image and content.
 */
export function HeroBanner({
  title,
  subtitle,
  children,
  backgroundImage,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  backgroundImage?: string;
  className?: string;
}) {
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
