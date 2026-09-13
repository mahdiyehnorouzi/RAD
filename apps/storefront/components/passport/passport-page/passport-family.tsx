"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { familyForCode, familyMembers, formatPassportCode, formatPassportName } from "@/lib/passport";
import type { RadPassport } from "../type";

export function PassportFamily({ passport }: { passport: RadPassport }) {
  const { locale, t, number, href } = useLocale();
  const family = familyForCode(passport.code);
  const members = familyMembers(passport.code);
  if (!family || members.length < 2) return null;

  return (
    <section className="passport-family">
      <span className="eyebrow">{t("familyEyebrow")}</span>
      <h2>{family.name[locale]}</h2>
      <p>{t("familyBody")}</p>
      <ol>
        {members.map((member, index) => {
          const link = family.links.find((item) => item.to === member.code);
          return (
            <li key={member.code}>
              {index > 0 && link ? <small>{link.note[locale]}</small> : null}
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
