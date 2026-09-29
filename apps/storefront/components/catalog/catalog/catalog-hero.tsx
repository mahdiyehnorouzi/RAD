import { bannerTear, shopBannerSrc } from "../const";
import { CatalogTear } from "./catalog-tear";

/** Full-bleed plaster banner: the mug on the reading side, title beside it, a red thread under the line. */
export function CatalogHero({ intro }: { intro: React.ReactNode }) {
  return (
    <header className="plp-banner">
      <img
        className="plp-banner-photo"
        src={shopBannerSrc}
        alt=""
        fetchPriority="high"
        decoding="async"
      />
      <div className="plp-banner-copy">
        {intro}
        <svg
          className="plp-banner-thread"
          viewBox="0 0 340 124"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            pathLength={1}
            d="M-6 111c22-5 44-6 70-3 30 3 56 2 82-3 16-3 30-2 42 1"
          />
          <path
            pathLength={1}
            d="M204 132c8-22 26-36 52-48 24-11 50-18 64-34 5-6 9-12 12-18"
          />
        </svg>
      </div>
      <CatalogTear shape={bannerTear} className="plp-banner-edge" />
    </header>
  );
}
