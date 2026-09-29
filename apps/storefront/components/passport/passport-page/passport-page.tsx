"use client";

import { findPassport } from "@/lib/passport";
import { isGoneStatus } from "@/lib/catalog/product-status";
import { usePassports } from "@/hooks/use-artworks";
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

export function PassportPage({ passport: source }: { passport: RadPassport }) {
  const passports = usePassports();
  const live = findPassport(passports, source.radNumber);
  const passport = live?.status ? live : source;
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
        <PassportFamily passport={passport} passports={passports} />
        <PassportCare passport={passport} />
      </div>
      <PassportClose passport={passport} passports={passports} sold={sold} />
    </article>
  );
}
