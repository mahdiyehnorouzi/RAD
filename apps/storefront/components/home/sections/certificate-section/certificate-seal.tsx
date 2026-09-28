/** The RAD stamp inked onto the card, as the brass stamp in the photograph would leave it. */
export function CertificateSeal() {
  return (
    <img
      className="certificate-seal"
      src="/marks/rad-stamp.webp"
      alt=""
      width={360}
      height={356}
      loading="lazy"
      decoding="async"
      aria-hidden="true"
    />
  );
}
