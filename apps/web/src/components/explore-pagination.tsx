import Link from "next/link";
import type { EventSearchFilter } from "@utah-esports/core";
import { serializeFilters } from "@utah-esports/core";

export function ExplorePagination({
  filter,
  total,
  view,
}: {
  filter: EventSearchFilter;
  total: number;
  view: string;
}) {
  const pageSize = filter.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const href = (page: number) =>
    `/explore?${serializeFilters({ ...filter, page })}${view !== "list" ? `&view=${view}` : ""}`;
  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex items-center justify-between gap-4"
    >
      <p className="text-sm text-charcoal-600">
        Page {filter.page} of {totalPages} · {total} results
      </p>
      <div className="flex gap-2">
        {filter.page > 1 ? (
          <Link
            href={href(filter.page - 1)}
            className="rounded-lg border border-charcoal-300 px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:bg-sandstone-50"
          >
            Previous
          </Link>
        ) : null}
        {filter.page < totalPages ? (
          <Link
            href={href(filter.page + 1)}
            className="rounded-lg border border-charcoal-300 px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:bg-sandstone-50"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
