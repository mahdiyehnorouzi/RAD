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
    <i className="absolute -top-0.5 end-0 not-italic rounded-full bg-rad-clay px-1.5 py-px text-[0.65rem] text-white">
      {children}
    </i>
  );
}
