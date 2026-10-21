import { type HTMLAttributes } from "react";
import { cn } from "./lib.js";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const badgeStyles: Record<BadgeVariant, string> = {
  neutral: "bg-charcoal-100 text-charcoal-700",
  accent: "bg-redrock-100 text-redrock-700",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-500",
  danger: "bg-danger-100 text-danger-600",
  info: "bg-charcoal-900 text-sandstone-100",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        badgeStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
