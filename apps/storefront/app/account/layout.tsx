import type { Metadata } from "next";
import { MakingProvider } from "@/hooks/use-making-workspace";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MakingProvider>{children}</MakingProvider>;
}
