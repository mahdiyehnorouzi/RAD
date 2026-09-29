"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { orderMedia } from "../const";
import { StudioIcon, readingArrow } from "../studio-icon";
import { designerCopy } from "./const";

export function SentNotice({
  commissionId,
  onAnother,
}: {
  commissionId: string;
  onAnother: () => void;
}) {
  const { locale, href } = useLocale();
  const c = designerCopy[locale];
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="sent-notice" role="status">
      <figure className="sent-notice-photo" aria-hidden="true">
        <Image {...orderMedia.arch} alt="" sizes="(min-width: 700px) 42rem, 100vw" />
      </figure>
      <span className="sent-notice-mark" aria-hidden="true">
        <StudioIcon name="check_circle" size={60} />
      </span>
      <h3 ref={heading} tabIndex={-1}>
        {c.sentTitle}
      </h3>
      <p>{c.sentBody}</p>
      <div className="sent-notice-actions">
        <Link className="cs-btn cs-btn-solid" href={href(`/making/${commissionId}`)}>
          <span>{c.sentFollow}</span>
          <StudioIcon name={readingArrow(locale, "forward")} size={20} />
        </Link>
        <button type="button" className="cs-btn cs-btn-paper" onClick={onAnother}>
          <StudioIcon name="plus" size={18} />
          <span>{c.sentAnother}</span>
        </button>
        <Link className="sent-notice-home" href={href("/")}>
          <StudioIcon name="home" size={18} />
          <span>{c.sentHome}</span>
        </Link>
      </div>
    </div>
  );
}
