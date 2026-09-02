"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/i18n";

export function HeaderLogo() {
  const { t, href } = useLocale();
  return (
    <Link
      href={href("/")}
      className="flex min-w-0 flex-col items-center text-center leading-none"
      aria-label={t("home")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span
        className="block h-[54px] w-[54px] overflow-visible"
        aria-hidden="true"
      >
        <Image
          src="/rad-logo.png"
          alt=""
          width={1254}
          height={1254}
          className="h-full w-full object-contain"
          priority
        />
      </span>
      <span className="mt-1.5 whitespace-nowrap text-[0.42rem] tracking-[0.2em] text-rad-moss">
        {t("logoSubtitle")}
      </span>
    </Link>
  );
}
