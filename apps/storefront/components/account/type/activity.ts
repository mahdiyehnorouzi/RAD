export type AccountActivityKind = "collection" | "custom";

export type AccountActivityItem = {
  id: string;
  kind: AccountActivityKind;
  title: string;
  status: string;
  href: string;
  at: number;
};
