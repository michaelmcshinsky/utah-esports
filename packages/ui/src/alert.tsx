import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./lib.js";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const styles: Record<AlertVariant, string> = {
  info: "border-charcoal-200 bg-charcoal-100 text-charcoal-800",
  success: "border-green-200 bg-success-100 text-success-700",
  warning: "border-amber-200 bg-warning-100 text-warning-500",
  danger: "border-red-200 bg-danger-100 text-danger-600",
};

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
};

export function Alert({ variant = "info", title, children, className, ...props }: AlertProps) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3 text-sm", styles[variant], className)}
      {...props}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
