import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./lib.js";

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  actions,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-charcoal-300 bg-sandstone-50 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-3 text-charcoal-400" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-charcoal-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-prose text-sm text-charcoal-600">{description}</p>
      ) : null}
      {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-charcoal-100", className)}
      aria-hidden
      {...props}
    />
  );
}
