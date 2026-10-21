import Link from "next/link";

export type CalendarEventItem = {
  slug: string;
  title: string;
  startsAt: string;
  gameNames: string[];
};

/**
 * Month-grid calendar over the currently filtered results. Server-rendered
 * so it works without JS; every day links to the event detail page.
 */
export function EventCalendarView({ events }: { events: CalendarEventItem[] }) {
  const parsed = events
    .map((e) => ({ ...e, date: new Date(e.startsAt) }))
    .filter((e) => !Number.isNaN(e.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (parsed.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-charcoal-300 bg-white px-6 py-12 text-center text-sm text-charcoal-600">
        No dated events in the current filter.
      </div>
    );
  }

  const months = new Map<string, typeof parsed>();
  for (const event of parsed) {
    const key = event.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const bucket = months.get(key) ?? [];
    bucket.push(event);
    months.set(key, bucket);
  }

  return (
    <div className="space-y-8">
      {[...months.entries()].map(([monthLabel, monthEvents]) => {
        const first = monthEvents[0]!.date;
        const year = first.getFullYear();
        const month = first.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startWeekday = new Date(year, month, 1).getDay();
        const byDay = new Map<number, typeof monthEvents>();
        for (const event of monthEvents) {
          const day = event.date.getDate();
          const bucket = byDay.get(day) ?? [];
          bucket.push(event);
          byDay.set(day, bucket);
        }
        return (
          <section key={monthLabel} aria-label={monthLabel}>
            <h2 className="text-lg font-semibold text-charcoal-900">{monthLabel}</h2>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-charcoal-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: startWeekday }, (_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayEvents = byDay.get(day) ?? [];
                return (
                  <div
                    key={day}
                    className={`min-h-24 rounded-lg border p-1 text-left align-top ${
                      dayEvents.length
                        ? "border-redrock-200 bg-redrock-50"
                        : "border-charcoal-100 bg-white"
                    }`}
                  >
                    <p className="text-charcoal-600">{day}</p>
                    {dayEvents.slice(0, 2).map((event) => (
                      <Link
                        key={event.slug}
                        href={`/events/${event.slug}`}
                        className="mt-0.5 block truncate rounded bg-white/80 px-1 py-0.5 text-xs font-medium text-charcoal-800 hover:bg-white"
                        title={event.title}
                      >
                        {event.title}
                      </Link>
                    ))}
                    {dayEvents.length > 2 ? (
                      <p className="mt-0.5 px-1 text-xs text-charcoal-500">
                        +{dayEvents.length - 2} more
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
