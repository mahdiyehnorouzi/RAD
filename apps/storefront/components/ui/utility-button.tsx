import Link from "next/link";

export function UtilityLink({
  href,
  label,
  children,
  className = "",
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`relative inline-flex h-11 min-w-11 items-center justify-center text-rad-ink ${className}`}
      aria-label={label}
    >
      {children}
    </Link>
  );
}

export function UtilityButton({
  label,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-11 min-w-11 items-center justify-center border-0 bg-transparent text-rad-ink ${className}`}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}

export function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <i className="not-italic">
      {children}
    </i>
  );
}
