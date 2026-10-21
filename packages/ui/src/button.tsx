"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./lib.js";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-redrock-500 text-white hover:bg-redrock-600 active:bg-redrock-700 shadow-sm",
  secondary:
    "bg-charcoal-900 text-sandstone-50 hover:bg-charcoal-800 active:bg-charcoal-700",
  ghost:
    "bg-transparent text-charcoal-800 hover:bg-charcoal-100 active:bg-charcoal-200",
  outline:
    "border border-charcoal-300 bg-white text-charcoal-800 hover:border-charcoal-400 hover:bg-sandstone-50",
  danger: "bg-danger-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redrock-500",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
