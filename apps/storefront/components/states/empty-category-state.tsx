import type { ReactNode } from "react";
import { StateScreen } from "./state-screen";

/** Nothing on the shelf here: a category, a filter set, or the whole collection between seasons. */
export function EmptyCategoryState({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: ReactNode;
}) {
  return (
    <StateScreen
      art="empty-category"
      title={title}
      body={<p>{body}</p>}
      actions={actions}
    />
  );
}
