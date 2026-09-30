import { notFound } from "next/navigation";

/** Unknown paths render `[locale]/not-found` inside the localized root layout. */
export default function MissingPage() {
  notFound();
}
