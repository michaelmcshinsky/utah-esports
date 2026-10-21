"use client";

import { cn } from "./lib.js";

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <p className="text-sm text-charcoal-600">
        Page {page} of {totalPages} · {total} results
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-charcoal-300 px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:bg-sandstone-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-lg border border-charcoal-300 px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:bg-sandstone-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
