"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { LEGACY_FORM_IDS } from "./custom-designer/const/order-options";
import { ORDER_MAKES } from "./const";
import { useDesigner, CustomDesigner } from "./custom-designer";

export function CustomOrderStart() {
  const designer = useDesigner();
  const searchParams = useSearchParams();

  useEffect(() => {
    const form = searchParams.get("form");
    const make = ORDER_MAKES.find((item) => item.form === form);
    if (make)
      designer.preselect(LEGACY_FORM_IDS[make.form] ?? make.form, make.use);
  }, [designer.preselect, searchParams]);

  return (
    <div className="custom-order-route">
      <CustomDesigner designer={designer} />
    </div>
  );
}
