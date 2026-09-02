export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`mb-5 block text-eyebrow font-normal tracking-[0.12em] text-rad-clay ${className}`}
    >
      {children}
    </span>
  );
}

export function PageSection({
  children,
  className = "",
  id,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section id={id} className={`px-page py-section ${className}`} {...props}>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-12">
      <h2 className="text-h3 font-normal">{title}</h2>
      {body ? (
        <p className="max-w-xl text-prose text-rad-muted">{body}</p>
      ) : null}
      {children}
    </div>
  );
}
