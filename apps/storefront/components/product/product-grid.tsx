export function ProductGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 items-stretch gap-[clamp(2rem,4vw,4rem)] md:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {children}
    </div>
  );
}
