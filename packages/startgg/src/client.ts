/**
 * Minimal GraphQL-over-fetch client with a token-bucket rate limiter.
 * start.gg enforces a per-token request budget; we stay under it by default.
 */

export class StartggError extends Error {
  readonly kind: "network" | "graphql" | "auth" | "rate_limited";
  readonly status?: number;

  constructor(
    message: string,
    kind: StartggError["kind"],
    status?: number,
  ) {
    super(message);
    this.name = "StartggError";
    this.kind = kind;
    this.status = status;
  }
}

export type RateLimiterOptions = {
  /** Requests per minute. Default 80 — under start.gg's documented 100/min. */
  perMinute?: number;
  /** Max queued requests waiting for a slot. */
  maxQueue?: number;
};

export class RateLimiter {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private lastRefill: number;
  private queue: Array<() => void> = [];
  private draining = false;

  constructor(options: RateLimiterOptions = {}) {
    const perMinute = options.perMinute ?? 80;
    this.capacity = Math.max(1, Math.floor(perMinute / 4));
    this.tokens = this.capacity;
    this.refillPerMs = perMinute / 60_000;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
      void this.drain();
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
    this.lastRefill = now;
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length > 0) {
        this.refill();
        if (this.tokens >= 1) {
          this.tokens -= 1;
          const next = this.queue.shift();
          next?.();
        } else {
          const waitMs = Math.max(10, (1 - this.tokens) / this.refillPerMs);
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
    } finally {
      this.draining = false;
    }
  }
}

export type GraphQLResponse<T> = { data?: T; errors?: Array<{ message: string }> };

export type StartggClientOptions = {
  token: string;
  endpoint?: string;
  rateLimiter?: RateLimiter;
  fetchImpl?: typeof fetch;
  userAgent?: string;
};

const DEFAULT_ENDPOINT = "https://api.start.gg/gql";

export class StartggClient {
  private readonly token: string;
  private readonly endpoint: string;
  private readonly limiter: RateLimiter;
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;

  constructor(options: StartggClientOptions) {
    if (!options.token) {
      throw new StartggError("STARTGG_TOKEN is required", "auth");
    }
    this.token = options.token;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.limiter = options.rateLimiter ?? new RateLimiter();
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.userAgent = "utah-esports-sync/0.1 (+https://utahesports.net)";
  }

  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    await this.limiter.acquire();
    let response: Response;
    try {
      response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.token}`,
          accept: "application/json",
          "user-agent": this.userAgent,
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (err) {
      throw new StartggError(
        `network error: ${err instanceof Error ? err.message : String(err)}`,
        "network",
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new StartggError("start.gg rejected the token", "auth", response.status);
    }
    if (response.status === 429) {
      throw new StartggError("start.gg rate limit hit", "rate_limited", 429);
    }
    if (!response.ok) {
      throw new StartggError(`start.gg HTTP ${response.status}`, "network", response.status);
    }
    const body = (await response.json()) as GraphQLResponse<T>;
    if (body.errors?.length) {
      throw new StartggError(
        `start.gg GraphQL error: ${body.errors.map((e) => e.message).join("; ")}`,
        "graphql",
      );
    }
    if (body.data === undefined) {
      throw new StartggError("start.gg returned no data", "graphql");
    }
    return body.data;
  }
}
