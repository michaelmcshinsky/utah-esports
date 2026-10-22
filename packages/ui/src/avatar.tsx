import { cn } from "./lib.js";

/**
 * Deterministic initials avatar for organizer/player contacts.
 * Earth-tone palette; no network calls, SSR-safe.
 */

const PALETTE = [
  "bg-redrock-500 text-white",
  "bg-pine-600 text-white",
  "bg-charcoal-800 text-sandstone-100",
  "bg-redrock-700 text-white",
  "bg-charcoal-600 text-white",
  "bg-pine-500 text-white",
];

const SIZES = {
  sm: "size-7 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
} as const;

export function initialsOf(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
}

export type AvatarProps = {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Optional role/label rendered beside the circle by the caller. */
  decorative?: boolean;
};

export function Avatar({ name, size = "md", className, decorative }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold leading-none",
        SIZES[size],
        avatarColor(name),
        className,
      )}
      aria-hidden={decorative || undefined}
      title={decorative ? undefined : name}
    >
      {initialsOf(name)}
    </span>
  );
}
