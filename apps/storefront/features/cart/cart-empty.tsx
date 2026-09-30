import type { ReactNode } from "react";
import type { Product } from "@rad/types";
import { EmptyBagState } from "@/components/states";
import styles from "./cart-empty.module.css";

/** The empty bag, shared by the bag page and a checkout that lost its works. */
export function CartEmpty({
  suggestions,
  released,
}: {
  suggestions: Product[];
  released?: ReactNode;
}) {
  return (
    <section className={`${styles.empty} section`}>
      <EmptyBagState
        suggestions={suggestions}
        notice={
          released ? <div className={styles.released}>{released}</div> : null
        }
      />
    </section>
  );
}
