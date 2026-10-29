"use client";

import { useSyncExternalStore } from "react";

/**
 * Light mode is the default; this opts the visitor into dark explicitly.
 * State is read from <html data-theme> (set pre-paint by the root layout's
 * inline script) via useSyncExternalStore — hydration-safe, no effect
 * driven setState. A custom "theme" event keeps the button in sync;
 * "storage" syncs across tabs.
 */

function subscribe(onChange: () => void): () => void {
  window.addEventListener("theme", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("theme", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

function getServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !dark;
    if (next) {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // storage unavailable — session-only theme
    }
    window.dispatchEvent(new Event("theme"));
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? (
        // Sun (currently dark → switch to light)
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        // Moon (currently light → switch to dark)
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </button>
  );
}
