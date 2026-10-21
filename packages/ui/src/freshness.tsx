import { Badge, type BadgeVariant } from "./badge.js";

/**
 * Freshness + provenance labels. Trust is a product feature: every listing
 * shows where it came from and when it was last checked.
 */

export type FreshnessLevel = "fresh" | "aging" | "stale" | "unknown";

export function freshnessLevel(
  lastConfirmedAt: Date | null | undefined,
  now = new Date(),
): FreshnessLevel {
  if (!lastConfirmedAt) return "unknown";
  const days = (now.getTime() - lastConfirmedAt.getTime()) / 86_400_000;
  if (days <= 30) return "fresh";
  if (days <= 90) return "aging";
  return "stale";
}

const LABELS: Record<FreshnessLevel, { label: string; variant: BadgeVariant }> = {
  fresh: { label: "Checked recently", variant: "success" },
  aging: { label: "Check upcoming", variant: "warning" },
  stale: { label: "Needs re-confirmation", variant: "danger" },
  unknown: { label: "Unconfirmed", variant: "neutral" },
};

export function FreshnessBadge({
  lastConfirmedAt,
  sourceLabel,
  now,
  className,
}: {
  lastConfirmedAt: Date | null | undefined;
  sourceLabel?: string | null;
  now?: Date;
  className?: string;
}) {
  const level = freshnessLevel(lastConfirmedAt, now);
  const { label, variant } = LABELS[level];
  const checked = lastConfirmedAt
    ? `last checked ${lastConfirmedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "never confirmed";
  return (
    <span className={className}>
      <Badge variant={variant} title={checked}>
        {label}
      </Badge>
      {sourceLabel ? (
        <Badge variant="neutral" className="ml-1" title={`Source: ${sourceLabel}`}>
          {sourceLabel}
        </Badge>
      ) : null}
    </span>
  );
}
