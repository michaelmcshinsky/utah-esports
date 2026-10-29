/**
 * Section heading with Royal Tickets-style red underline accent.
 */
export function SectionTitle({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <h2 id={id} className={`section-title ${className}`}>{children}</h2>
  );
}
