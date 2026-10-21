"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "./lib.js";
import { Button } from "./button.js";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

const emptySubscribe = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

/**
 * Accessible modal built on native <dialog>. Escape closes, focus is
 * trapped by the browser, background scroll is blocked while open.
 * Portals only after mount so SSR never touches `document`.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, getClientMounted, getServerMounted);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open, mounted]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleClose = () => onClose();
    el.addEventListener("cancel", handleCancel);
    el.addEventListener("close", handleClose);
    return () => {
      el.removeEventListener("cancel", handleCancel);
      el.removeEventListener("close", handleClose);
    };
  }, [onClose, open, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-charcoal-200 bg-white p-0 shadow-card-hover backdrop:bg-charcoal-950/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-charcoal-100 p-4">
        <div>
          <h2 id="dialog-title" className="text-lg font-semibold text-charcoal-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-charcoal-600">{description}</p>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
          ✕
        </Button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>,
    document.body,
  );
}
