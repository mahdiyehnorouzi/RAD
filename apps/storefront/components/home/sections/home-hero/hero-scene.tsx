import { getImageProps } from "next/image";
import { heroScene } from "@/components/home/const";

/** The plaster wall and travertine plinth; a portrait crop on phones keeps the plinth wide. */
export function HeroScene() {
  const common = { alt: "", sizes: "100vw", quality: 82 };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, ...heroScene.wide });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, ...heroScene.tall });

  return (
    <picture className="hero-scene" aria-hidden="true">
      <source media="(min-width: 701px)" srcSet={wide} />
      <img {...rest} alt="" loading="eager" fetchPriority="high" />
    </picture>
  );
}
