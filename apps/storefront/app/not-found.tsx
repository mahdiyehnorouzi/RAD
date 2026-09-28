import type { Metadata } from "next";
import { NotFoundState } from "@/components/states";
import { notFoundMetadata } from "@/lib/seo";

export const metadata: Metadata = notFoundMetadata();

export default function NotFound() {
  return <NotFoundState />;
}
