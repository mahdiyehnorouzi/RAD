export type IdentitySummaryCard =
  "all" | "unassigned" | "assigned" | "printed" | "retired";

export type IdentityRegistryFilter = {
  status: "" | "reserved" | "assigned" | "retired";
  assignment: "" | "unassigned" | "assigned";
  printed: "" | "printed";
};

export function identityFilterForCard(
  card: IdentitySummaryCard,
): IdentityRegistryFilter {
  switch (card) {
    case "all":
      return { status: "", assignment: "", printed: "" };
    case "unassigned":
      return { status: "reserved", assignment: "unassigned", printed: "" };
    case "assigned":
      return { status: "assigned", assignment: "assigned", printed: "" };
    case "printed":
      return { status: "", assignment: "", printed: "printed" };
    case "retired":
      return { status: "retired", assignment: "", printed: "" };
  }
}

export function activeIdentityCard(
  filter: IdentityRegistryFilter & { batchId: string },
): IdentitySummaryCard | null {
  if (filter.batchId) return null;
  const cards: IdentitySummaryCard[] = [
    "all",
    "unassigned",
    "assigned",
    "printed",
    "retired",
  ];
  return (
    cards.find((card) => {
      const next = identityFilterForCard(card);
      return (
        next.status === filter.status &&
        next.assignment === filter.assignment &&
        next.printed === filter.printed
      );
    }) ?? null
  );
}

/** Mirrors `STORY_PUBLISHED` in the identities service. Drafts stay private. */
const PUBLIC_STORY_STATUSES = new Set([
  "ready",
  "available",
  "sold",
  "archived",
]);

export function artworkStoryIsPublic(status: string | undefined) {
  return Boolean(status && PUBLIC_STORY_STATUSES.has(status));
}

export function productEditorHref(
  productId: string,
  focus: "artwork" | "story",
) {
  const params = new URLSearchParams({ edit: productId });
  if (focus === "story") params.set("section", "story");
  return `/products?${params.toString()}`;
}

export function publicPassportUrl(permanentUrl: string, code: string) {
  const origin = new URL(permanentUrl).origin;
  return `${origin}/passport/${code}`;
}
