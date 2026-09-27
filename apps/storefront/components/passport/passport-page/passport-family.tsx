"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import {
  familyForCode,
  familyMembers,
  formatPassportCode,
  formatPassportName,
} from "@/lib/passport";
import type { RadPassport } from "../type";

export function PassportFamily({
  passport,
  passports,
}: {
  passport: RadPassport;
  passports: RadPassport[];
}) {
  const { locale, t, number, href } = useLocale();
  const family = familyForCode(passport.code);
  const members = familyMembers(passports, passport.code);
  if (!family || members.length < 2) return null;
  const codes = new Set(members.map((member) => member.code));

  return (
    <section className="passport-family">
      <span className="eyebrow">{t("familyEyebrow")}</span>
      <h2>{family.name[locale]}</h2>
      <p>{t("familyBody")}</p>
      <ol>
        {members.map((member, index) => {
          const note =
            member.inspiredBy && codes.has(member.inspiredBy)
              ? member.inspiredNote
              : undefined;
          return (
            <li key={member.code}>
              {index > 0 && note ? <small>{note[locale]}</small> : null}
              <Link href={href(`/passport/${member.code}`)}>
                <b>{formatPassportName(member, locale, number)}</b>
                <span>{formatPassportCode(member.code, locale, number)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
