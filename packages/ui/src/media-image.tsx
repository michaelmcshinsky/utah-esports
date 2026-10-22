import { cn } from "./lib.js";

/**
 * Media with a themed placeholder. Legacy Utah Esports photography and
 * posters live in apps/web/public/images; listings without art get a
 * consistent Utah-outdoors placeholder instead of a broken box.
 */

export type MediaKind = "event" | "venue" | "team" | "community" | "organization";
export type MediaRatio = "video" | "wide" | "square";

const GRADIENTS: Record<MediaKind, [string, string]> = {
  event: ["#833828", "#1a1d26"],
  venue: ["#31553e", "#12141a"],
  team: ["#323745", "#12141a"],
  community: ["#a44730", "#242833"],
  organization: ["#454b5c", "#1a1d26"],
};

const RATIOS: Record<MediaRatio, string> = {
  video: "aspect-video",
  wide: "aspect-[2/1]",
  square: "aspect-square",
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic unique gradient id (server-render safe — no hooks). */
function gradientId(kind: MediaKind, seed: string): string {
  return `ue-${kind}-${hashString(seed).toString(36)}`;
}

function PlaceholderArt({ kind, seed }: { kind: MediaKind; seed: string }) {
  const id = gradientId(kind, seed);
  const [from, to] = GRADIENTS[kind];
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id})`} />
      {/* Contour-line motif (Utah topography) */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.08">
        <path d="M0 44c40 0 40 18 80 18s40-18 80-18 40 18 80 18 40-18 80-18" />
        <path d="M0 84c40 0 40 18 80 18s40-18 80-18 40 18 80 18 40-18 80-18" />
        <path d="M0 124c40 0 40 18 80 18s40-18 80-18 40 18 80 18 40-18 80-18" />
      </g>
      {/* Mountain silhouette — Utah outdoors */}
      <path
        d="M0 180V132l38-30 26 20 44-52 40 44 30-22 42 36 36-28 64 52v28z"
        fill="#ffffff"
        fillOpacity="0.14"
      />
      <circle cx="252" cy="46" r="16" fill="#ffffff" fillOpacity="0.16" />
    </svg>
  );
}

export type MediaImageProps = {
  src?: string | null;
  alt: string;
  kind?: MediaKind;
  ratio?: MediaRatio;
  /** Short label for placeholders (game, city, initials context). */
  label?: string;
  fit?: "cover" | "contain";
  className?: string;
  /** Rendered inside the placeholder to identify the subject. */
  overlayText?: string;
};

export function MediaImage({
  src,
  alt,
  kind = "event",
  ratio = "video",
  fit = "cover",
  label,
  className,
  overlayText,
}: MediaImageProps) {
  const seed = `${kind}:${label ?? alt}`;
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-charcoal-900",
        RATIOS[ratio],
        className,
      )}
    >
      {/* Placeholder art is ALWAYS the background layer: lazy images show
          art while loading instead of an empty dark box, and failed images
          degrade to the same themed graphic. */}
      <div aria-hidden className="absolute inset-0">
        <PlaceholderArt kind={kind} seed={seed} />
      </div>
      {src ? (
        // Legacy migrated assets are statically sized; plain img keeps
        // zero-dependency local rendering with lazy loading.
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "relative h-full w-full",
            fit === "cover" ? "object-cover" : "object-contain p-4",
          )}
        />
      ) : overlayText ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-950/80 to-transparent px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wide text-sandstone-100">
          {overlayText}
        </span>
      ) : null}
    </div>
  );
}
