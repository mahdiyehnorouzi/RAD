"use client";

import { useEffect, useState } from "react";

export function useHeaderMotion(menuOpen: boolean) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const hero = document.getElementById("home-hero");
      const pastHero = hero ? y > hero.offsetHeight - 72 : y > 88;
      setCompact(menuOpen ? false : pastHero);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [menuOpen]);

  return { compact };
}
