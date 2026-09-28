"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { designerCopy } from "./const";

export function SentNotice({
  commissionId,
  onAnother,
}: {
  commissionId: string;
  onAnother: () => void;
}) {
  const { locale } = useLocale();
  const c = designerCopy[locale];
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="sent-notice" role="status">
      <span className="sent-notice-mark" aria-hidden="true">
        1/1
      </span>
      <h3 ref={heading} tabIndex={-1}>
        {c.sentTitle}
      </h3>
      <p>{c.sentBody}</p>
      <div className="sent-notice-actions">
        <ButtonLink href={`/making/${commissionId}`} light>
          {c.sentFollow}
        </ButtonLink>
        <button type="button" className="text-button" onClick={onAnother}>
          {c.sentAnother}
        </button>
      </div>
    </div>
  );
}
