import type { ReactNode } from "react";

type Props = {
  /** Grid gap class (default `gap-5`). */
  gap?: string;
  /** Responsive column classes (default 1/2/3). */
  columns?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Responsive event-card grid used across state home pages,
 * events listings, and filtered results.
 */
export function EventCardGrid({ gap = "gap-5", columns = "sm:grid-cols-2 lg:grid-cols-3", className, children }: Props) {
  return (
    <div className={`grid ${gap} ${columns} ${className ?? ""}`}>{children}</div>
  );
}
