"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function RouteScrollReset() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    previous.current = pathname;
  }, [pathname]);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) void registration.unregister();
    });
    if (typeof caches === "undefined") return;
    void caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key))),
    );
  }, []);
  return null;
}
