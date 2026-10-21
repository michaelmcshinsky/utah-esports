import { EVENTS_QUERY, VIDEOGAMES_QUERY, type EventsQueryResult, type StartggEvent, type StartggVideogame, type VideogamesQueryResult } from "./types.js";

export { StartggClient, StartggError, RateLimiter, type StartggClientOptions } from "./client.js";
export * from "./types.js";
export * from "./normalize.js";

import { StartggClient } from "./client.js";

export type FetchUtahEventsOptions = {
  /** Unix seconds. Defaults to now. */
  afterDate?: number;
  /** Unix seconds. Defaults to +90 days. */
  beforeDate?: number;
  /** Utah-ish bounding center. Salt Lake City by default. */
  lat?: number;
  lng?: number;
  /** start.gg expects strings like "150mi". */
  radius?: string;
  perPage?: number;
  maxPages?: number;
  videogameIds?: number[];
};

/** Salt Lake City — default search center for the Utah network. */
export const UTAH_CENTER = { lat: 40.7608, lng: -111.891 };

export async function* iterateUtahEvents(
  client: StartggClient,
  options: FetchUtahEventsOptions = {},
): AsyncGenerator<StartggEvent> {
  const afterDate = options.afterDate ?? Math.floor(Date.now() / 1000);
  const beforeDate = options.beforeDate ?? afterDate + 90 * 24 * 60 * 60;
  const perPage = options.perPage ?? 25;
  const maxPages = options.maxPages ?? 10;
  let page = 1;
  while (page <= maxPages) {
    const data = await client.query<EventsQueryResult>(EVENTS_QUERY, {
      perPage,
      page,
      videogameIds: options.videogameIds?.length ? options.videogameIds : undefined,
      nearbyLat: options.lat ?? UTAH_CENTER.lat,
      nearbyLng: options.lng ?? UTAH_CENTER.lng,
      nearbyRadius: options.radius ?? "150mi",
      afterDate,
      beforeDate,
    });
    for (const node of data.events.nodes) {
      yield node;
    }
    if (!data.events.pageInfo.hasNextPage) break;
    page += 1;
  }
}

export async function fetchVideogameBySlug(
  client: StartggClient,
  slug: string,
): Promise<StartggVideogame | null> {
  const data = await client.query<VideogamesQueryResult>(VIDEOGAMES_QUERY, {
    perPage: 1,
    slug,
  });
  return data.videgames.nodes[0] ?? null;
}

export async function collectUtahEvents(
  client: StartggClient,
  options: FetchUtahEventsOptions = {},
): Promise<StartggEvent[]> {
  const out: StartggEvent[] = [];
  for await (const event of iterateUtahEvents(client, options)) {
    out.push(event);
  }
  return out;
}
