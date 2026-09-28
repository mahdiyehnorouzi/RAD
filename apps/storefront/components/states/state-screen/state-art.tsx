import Image from "next/image";
import type { ReactNode } from "react";
import { STATE_ART, STATE_ART_SIZE } from "../const";
import type { StateArtKind, StateLayout } from "../type";

export function StateArt({
  kind,
  layout,
  badge,
}: {
  kind: StateArtKind;
  layout: StateLayout;
  badge?: ReactNode;
}) {
  return (
    <div className="state-art" aria-hidden="true">
      <Image
        src={STATE_ART[kind]}
        alt=""
        width={STATE_ART_SIZE}
        height={STATE_ART_SIZE}
        preload={layout === "split"}
        sizes={
          layout === "split"
            ? "(max-width: 760px) 16rem, 34rem"
            : "(max-width: 760px) 12rem, 15rem"
        }
      />
      {badge ? <span className="state-art-badge">{badge}</span> : null}
    </div>
  );
}
