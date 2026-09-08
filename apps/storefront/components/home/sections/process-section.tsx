"use client";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { homeMedia } from "../const";
import "./process-section.css";

export function HomeProcessSection() {
  const { t } = useLocale();
  const steps = [
    [t("homeProcessIndex1"), t("homeProcessStep1"), homeMedia.customOrder[0]],
    [t("homeProcessIndex2"), t("homeProcessStep2"), homeMedia.customOrder[1]],
    [t("homeProcessIndex3"), t("homeProcessStep3"), homeMedia.customOrder[2]],
  ];
  return (
    <section className="section home-process" aria-labelledby="home-process-title">
      <header className="home-process-heading">
        <div>
          <h2 id="home-process-title">{t("processTitle")}</h2>
          <p>{t("personalizedWhat")}</p>
        </div>
        <ButtonLink href="/studio">{t("startCustomDesign")}</ButtonLink>
      </header>
      <ol className="home-process-steps">
        {steps.map(([index, title, image], stepIndex) => (
          <li key={index}>
            <figure>
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 900px) 100vw, 33vw"
                loading={stepIndex === 0 ? "eager" : "lazy"}
              />
            </figure>
            <div className="home-process-step-copy">
              <span>{index}</span>
              <h3>{title}</h3>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
