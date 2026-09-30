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
