"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { useLivePieces } from "@/hooks/use-artworks";
import { findLivePiece } from "@/lib/now";
import { nowCopy } from "../const";
import type { LivePiece } from "../type";
import { LiveHero } from "./live-hero";
import { LiveNotes } from "./live-notes";
import { LiveStages } from "./live-stages";
import "../now.css";
import "./live-page.css";

export function LivePage({ piece: source }: { piece: LivePiece }) {
  const { locale, t, href } = useLocale();
  const c = nowCopy[locale];
  const piece = findLivePiece(useLivePieces(), source.code) ?? source;

  return (
    <article className="live-page">
      <LiveHero piece={piece} />
      <LiveStages piece={piece} />
      <LiveNotes piece={piece} />

      <footer className="live-close">
        <svg
          className="live-thread live-close-thread"
          viewBox="0 0 160 16"
          aria-hidden="true"
          focusable="false"
        >
          <path pathLength={1} d="M2 6C24 3 44 4 66 9C90 14 116 14 136 9C146 6 152 4 158 3" />
        </svg>
        <h2>{c.closeTitle}</h2>
        <p>{c.closeBody}</p>
        <div className="live-close-actions">
          <Link className="live-pill" href={href("/studio")}>
            {c.closeCta}
          </Link>
          <Link className="live-pill is-ghost" href={href("/products")}>
            {t("allWorks")}
          </Link>
        </div>
      </footer>
    </article>
  );
}
