"use client";
import "./progress-photographs.css";

import type { MakingCommission, MakingStageId } from "@/components/making/type";
import { photoLabel } from "@/components/making/const";
import { copy, formatWhen } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function ProgressPhotographs({
  commission,
  forStage,
}: {
  commission: MakingCommission;
  forStage?: MakingStageId;
}) {
  const { locale } = useLocale();
  const photos = commission.updates.filter((item) => !forStage || item.stageId === forStage);
  if (!photos.length) return null;
  return (
    <ul className="making-photos">
      {photos.map((item) => (
        <li key={item.id}>
          <div className={`making-swatch kind-${item.photoKind}`} aria-hidden="true" />
          <small>{copy(photoLabel[item.photoKind], locale)}</small>
          <p>{copy(item.note, locale)}</p>
          <time dateTime={new Date(item.createdAt).toISOString()}>
            {formatWhen(item.createdAt, locale)}
          </time>
        </li>
      ))}
    </ul>
  );
}
