"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderLogo } from "./header-logo";
import { HeaderNav } from "./header-nav";
import { HeaderActions } from "./header-actions";
import {
  openHeaderOverlay,
  useHeaderOverlay,
} from "@/hooks/use-header-overlay";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => close(), [pathname, close]);
  useHeaderOverlay("menu", close);

  return (
    <header className="header">
      <HeaderLogo />
      <HeaderNav open={open} onNavigate={close} />
      <HeaderActions
        menuOpen={open}
        onToggleMenu={() =>
          setOpen((current) => {
            const next = !current;
            if (next) openHeaderOverlay("menu");
            return next;
          })
        }
      />
    </header>
  );
}
