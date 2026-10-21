"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "./lib.js";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

export type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  label: string;
  className?: string;
};

export function Tabs({ items, defaultValue, value, onChange, label, className }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id ?? "");
  const active = value ?? internal;
  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-charcoal-200">
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={`${baseId}-panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            onClick={() => select(item.id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active === item.id
                ? "border-redrock-500 text-redrock-600"
                : "border-transparent text-charcoal-600 hover:text-charcoal-900",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={active !== item.id}
          className="pt-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
