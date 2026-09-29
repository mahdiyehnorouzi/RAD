"use client";

import { isGoneStatus } from "@/lib/catalog/product-status";
import { BeforeRad } from "../before-rad";
import type { RadPassport } from "../type";
import { WorkMarks } from "../work-marks";
import { PassportCare } from "./passport-care";
import { PassportClose } from "./passport-close";
import { PassportCover } from "./passport-cover";
import { PassportFamily } from "./passport-family";
import { PassportLife } from "./passport-life";
import { PassportWhere } from "./passport-where";
import "./passport-page.css";

export function PassportPage({
  passport,
  family,
  related,
}: {
  passport: RadPassport;
  /** The family in the order it grew, this work included. */
  family: RadPassport[];
  /** Works closest in feeling, offered once this one is gone. */
  related: RadPassport[];
}) {
  const sold = isGoneStatus(passport.status);

  return (
    <article className="passport-page" aria-labelledby="passport-title">
      <PassportCover passport={passport} sold={sold} />
      <BeforeRad frames={passport.beforeRad} />
      <PassportLife passport={passport} />
      {passport.marks?.length && passport.finalPhotos[0] ? (
        <WorkMarks src={passport.finalPhotos[0].src} marks={passport.marks} />
      ) : null}
      <PassportWhere passport={passport} />
      <div className="passport-keep">
        <PassportFamily passport={passport} members={family} />
        <PassportCare passport={passport} />
      </div>
      <PassportClose
        passport={passport}
        related={sold ? related : []}
        sold={sold}
      />
    </article>
  );
}
