import Link from "next/link";

export interface RadBannerProps { message: string; action: string; href: string; }
export function RadBanner({ message, action, href }: RadBannerProps) {
  return <aside className="flex min-h-10 items-center justify-center gap-4 bg-rad-mineral px-4 py-2 text-center text-sm text-rad-paper"><span>{message}</span><Link className="border-b border-rad-paper font-medium" href={href}>{action}</Link></aside>;
}
