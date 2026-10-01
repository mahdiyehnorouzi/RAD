"use client";

import { useLocale } from "@/components/i18n";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ORDER_MAKES } from "./const";
import { useDesigner, CustomDesigner } from "./custom-designer";
import styles from "./custom-order/custom-order.module.css";

export function CustomOrderStart() {
  const { locale } = useLocale();
  const designer = useDesigner();
  const searchParams = useSearchParams();

  useEffect(() => {
    const form = searchParams.get("form");
    const make = ORDER_MAKES.find((item) => item.form === form);
    if (make) designer.preselect(make.form, make.use);
  }, [designer.preselect, searchParams]);

  return (
    <main className={`${styles.customOrder} ${styles.startPage}`}>
      <section id="your-idea" className={`${styles.csBand} ${styles.plaster}`}>
        <div className={styles.csSection}>
          <div className={styles.csFlowSheet}>
            <header className={styles.csHead}>
              <p className={styles.csKicker}>
                {locale === "fa"
                  ? "سفارش اختصاصی · قدم اول"
                  : "CUSTOM ORDER · STEP ONE"}
              </p>
              <h1>
                {locale === "fa"
                  ? "ایده‌ات را تعریف کن"
                  : "Tell us what you have in mind"}
              </h1>
              <p>
                {locale === "fa"
                  ? "عکس، طرح، ویس یا چند خط توضیح؛ از همین‌جا شروع می‌کنیم."
                  : "A photo, sketch, voice note, or a few lines is enough to begin."}
              </p>
            </header>
            <CustomDesigner designer={designer} />
          </div>
        </div>
      </section>
    </main>
  );
}
