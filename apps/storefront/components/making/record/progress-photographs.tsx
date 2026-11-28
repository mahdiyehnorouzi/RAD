"use client";
import "./progress-photographs.css";

import type { MakingCommission, MakingStageId } from "@/components/making/type";
import { photoLabel } from "@/components/making/const";
import { safeAttachmentSrc } from "@/components/making/brief-display";
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
  const photos = commission.updates.filter((item) => {
    if (forStage && item.stageId !== forStage) return false;
    return Boolean(item.image || item.note.fa || item.note.en);
  });
  if (!photos.length) return null;
  return (
    <ul className="making-photos">
      {photos.map((item) => (
        <li key={item.id}>
          {safeAttachmentSrc(item.image) ? (
            <img
              className="making-photo"
              src={safeAttachmentSrc(item.image) ?? undefined}
              alt={copy(item.imageAlt ?? item.note, locale)}
            />
          ) : null}
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
