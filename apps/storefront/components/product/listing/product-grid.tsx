export function ProductGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`product-grid ${className}`.trim()}>{children}</div>;
}
