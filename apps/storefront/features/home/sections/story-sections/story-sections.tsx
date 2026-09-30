"use client";
import { useLocale } from "@/components/i18n";
import styles from "./story-sections.module.css";

export function ProcessSection({ asPage = false }: { asPage?: boolean }) {
  const { t } = useLocale();
  const Title = asPage ? "h1" : "h2";
  const steps = [
    [t("processStep1"), t("step1Title"), t("step1Body")],
    [t("processStep2"), t("step2Title"), t("step2Body")],
    [t("processStep3"), t("step3Title"), t("step3Body")],
    [t("processStep4"), t("step4Title"), t("step4Body")],
    [t("processStep5"), t("step5Title"), t("step5Body")],
    [t("processStep6"), t("step6Title"), t("step6Body")],
  ];
  return (
    <section className={`section ${styles.process}`}>
      <header className="section-heading">
        <div>
          <span className="eyebrow">
            {t(asPage ? "makingNav" : "processEyebrow")}
          </span>
          <Title>{t(asPage ? "makingProcessTitle" : "processTitle")}</Title>
          <p className={styles.processDefinition}>{t("personalizedWhat")}</p>
          <p className={styles.processLead}>{t("processLead")}</p>
        </div>
      </header>
      <div className={`${styles.steps} ${styles.processSteps}`}>
        {steps.map((x) => (
          <article key={x[0]}>
            <span>{x[0]}</span>
            <h3>{x[1]}</h3>
            <p>{x[2]}</p>
          </article>
        ))}
      </div>
      <aside className={styles.zundNote}>
        <h3>{t("zundTitle")}</h3>
        <p>{t("zundBody")}</p>
      </aside>
    </section>
  );
}
