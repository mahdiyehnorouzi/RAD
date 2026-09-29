import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n";
import { normalizeQuery, type SearchHit } from "@/lib/catalog/search";

const DEBOUNCE_MS = 150;

/** Searches the catalog on the server; the browser never holds the full list. */
export function useSearchWorks(query: string) {
  const { locale } = useLocale();
  const normalizedQuery = normalizeQuery(query, locale);
  const [answer, setAnswer] = useState<{ key: string; results: SearchHit[] }>();
  const key = `${locale}:${normalizedQuery}`;

  useEffect(() => {
    if (!normalizedQuery) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: normalizedQuery, locale });
      fetch(`/api/search?${params}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { results: [] }))
        .then((payload: { results?: SearchHit[] }) =>
          setAnswer({ key, results: payload.results ?? [] }),
        )
        .catch(() => {
          if (!controller.signal.aborted) setAnswer({ key, results: [] });
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, locale, normalizedQuery]);

  const settled = answer?.key === key;
  return {
    normalizedQuery,
    results: settled ? answer.results : [],
    searching: Boolean(normalizedQuery) && !settled,
  };
}
