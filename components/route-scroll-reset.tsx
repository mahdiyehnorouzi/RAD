"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function RouteScrollReset() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    previous.current = pathname;
  }, [pathname]);
  return null;
}
