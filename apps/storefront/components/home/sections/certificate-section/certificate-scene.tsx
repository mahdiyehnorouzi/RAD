import { getImageProps } from "next/image";
import { certificateScene } from "../../const";

export function CertificateScene({ alt }: { alt: string }) {
  const common = { alt, sizes: "100vw", quality: 80 };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, ...certificateScene.wide });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, ...certificateScene.tall });

  return (
    <picture className="certificate-visual">
      <source media="(min-width: 701px)" srcSet={wide} />
      <img {...rest} alt={alt} loading="lazy" decoding="async" />
    </picture>
  );
}
