import type { ReactNode } from "react";

/**
 * Royal Tickets-style empty state. State-agnostic.
 */
export function EmptyState({
  title,
  description,
  actions,
  className = "",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border-2 border-dashed border-charcoal-200 bg-white px-6 py-16 text-center ${className}`}>
      <p className="text-lg font-medium text-charcoal-900">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-charcoal-600">{description}</p>
      ) : null}
      {actions ? <div className="mt-5 flex justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
