/**
 * Royal Tickets-style badge. State-agnostic.
 */
export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "info" | "success" | "warning" | "danger" | "accent";
  className?: string;
}) {
  const variants = {
    neutral: "bg-charcoal-100 text-charcoal-700",
    info: "bg-blue-100 text-blue-700",
    success: "bg-pine-500 text-white",
    warning: "bg-gold-400 text-charcoal-900",
    danger: "bg-redrock-500 text-white",
    accent: "bg-redrock-500 text-white",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
