/** Typed shapes for the start.gg GraphQL fields we actually read. */

export type StartggImage = { url: string; type?: string | null };

export type StartggVideogame = { id: string; name: string; slug: string | null };

export type StartggHost = { id: string; name: string; slug: string | null };

export type StartggVenue = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type StartggEvent = {
  id: string;
  name: string;
  slug: string;
  startAt: number;
  endAt: number | null;
  timezone: string | null;
  isOnline: boolean;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  addrState: string | null;
  countryCode: string | null;
  registrationDeadline: number | null;
  currency: string | null;
  images: StartggImage[] | null;
  host: StartggHost | null;
  venue: StartggVenue | null;
  videogame: StartggVideogame | null;
  type: string | null;
};

export type StartggPageInfo = {
  hasNextPage: boolean;
  lastPage: number | null;
  currentPage: number | null;
  perPage: number | null;
  totalEntries: number | null;
};

export type EventsQueryResult = {
  events: {
    nodes: StartggEvent[];
    pageInfo: StartggPageInfo;
  };
};

export type VideogamesQueryResult = {
  /** Yes — the root field is spelled `videgames` in start.gg's schema. */
  videgames: {
    nodes: StartggVideogame[];
  };
};

export const EVENTS_QUERY = /* GraphQL */ `
  query UtahEsportsEvents(
    $perPage: Int!
    $page: Int
    $videogameIds: [Int]
    $nearbyLat: Float
    $nearbyLng: Float
    $nearbyRadius: String
    $afterDate: Timestamp
    $beforeDate: Timestamp
  ) {
    events(
      query: {
        perPage: $perPage
        page: $page
        filter: {
          videogameId: $videogameIds
          nearbyCoordinates: {
            lat: $nearbyLat
            longitude: $nearbyLng
            radius: $nearbyRadius
          }
          afterDate: $afterDate
          beforeDate: $beforeDate
        }
      }
    ) {
      nodes {
        id
        name
        slug
        startAt
        endAt
        timezone
        isOnline
        city
        region
        postalCode
        addrState
        countryCode
        registrationDeadline
        currency
        images {
          url
          type
        }
        host {
          id
          name
          slug
        }
        venue {
          id
          name
          address
          city
          state
          postalCode
          countryCode
          latitude
          longitude
        }
        videogame {
          id
          name
          slug
        }
        type
      }
      pageInfo {
        hasNextPage
        lastPage
        currentPage
        perPage
        totalEntries
      }
    }
  }
`;

export const VIDEOGAMES_QUERY = /* GraphQL */ `
  query UtahEsportsVideogames($perPage: Int!, $slug: String) {
    videgames(query: { perPage: $perPage, filter: { slug: $slug } }) {
      nodes {
        id
        name
        slug
      }
    }
  }
`;
