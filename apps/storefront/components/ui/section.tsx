import "./section.css";

export function PageSection({
  children,
  className = "",
  id,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section id={id} className={`section ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`eyebrow ${className}`.trim()}>{children}</span>;
}
