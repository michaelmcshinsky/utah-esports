"use client";

import { useState } from "react";

/**
 * Royal Tickets-style accordion for FAQ sections.
 * Each item toggles open/closed with smooth height transition.
 */
export type AccordionItem = {
  question: string;
  answer: string;
};

export function Accordion({
  items,
  className = "",
}: {
  items: AccordionItem[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={className}>
      {items.map((item, i) => (
        <div
          key={i}
          data-open={openIndex === i}
          className="accordion-item"
        >
          <button
            type="button"
            className="accordion-trigger"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span>{item.question}</span>
            <span className="accordion-icon" aria-hidden>
              {openIndex === i ? "−" : "+"}
            </span>
          </button>
          {openIndex === i && (
            <div className="accordion-content">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}
