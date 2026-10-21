"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "./lib.js";

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function Chip({ selected, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected ?? false}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-redrock-500 bg-redrock-500 text-white"
          : "border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400 hover:bg-sandstone-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
