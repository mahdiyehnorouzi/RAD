"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import {
  familyForCode,
  familyMembers,
  formatPassportCode,
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
    <section className="passport-family" aria-labelledby="passport-family-title">
      <header className="passport-head">
        <h2 id="passport-family-title">{family.name[locale]}</h2>
        <p>{t("familyBody")}</p>
      </header>
      <ol>
        {members.map((member, index) => {
          const note =
            index > 0 && member.inspiredBy && codes.has(member.inspiredBy)
              ? member.inspiredNote
              : undefined;
          const self = member.code === passport.code;
          const body = (
            <>
              <span className="passport-family-code">
                {formatPassportCode(member.code, locale, number)}
              </span>
              <b>{member.name[locale]}</b>
              {note ? <small>{note[locale]}</small> : null}
            </>
          );
          return (
            <li key={member.code}>
              {self ? (
                <span className="passport-family-tag is-self" aria-current="page">
                  {body}
                </span>
              ) : (
                <Link className="passport-family-tag" href={href(`/passport/${member.code}`)}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
