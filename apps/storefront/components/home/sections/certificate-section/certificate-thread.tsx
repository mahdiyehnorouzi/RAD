/** The red thread tied through the card: a bead at the top, and a tail that runs on down to the footer. */
export function CertificateThread() {
  return (
    <>
      <svg className="certificate-thread-tie" viewBox="0 0 24 44" aria-hidden="true" focusable="false">
        <path className="certificate-thread-shade" d="M9 0C9 12 15 20 13 33" />
        <path className="certificate-thread-line" d="M9 0C9 12 15 20 13 33" />
        <circle className="certificate-bead-shade" cx="14" cy="37.5" r="4.6" />
        <circle className="certificate-bead" cx="13" cy="35" r="4.6" />
        <circle className="certificate-bead-shine" cx="11.5" cy="33.4" r="1.4" />
      </svg>
      <svg
        className="certificate-thread-tail"
        viewBox="0 0 60 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="certificate-thread-shade" d="M4 0C6 22 26 34 34 56C42 78 44 90 52 100" />
        <path className="certificate-thread-line" d="M4 0C6 22 26 34 34 56C42 78 44 90 52 100" />
      </svg>
    </>
  );
}
