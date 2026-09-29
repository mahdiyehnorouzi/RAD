const DROP = "M7 0C6 30 15 52 12 76C11 88 10 95 10 100";
const TIE =
  "M232 0C234 10 232 19 224 22C214 26 204 19 209 11C214 3 229 9 225 19C221 29 196 27 166 24C116 20 58 22 12 25";
const FRAY = "M13 24.9C9 24.2 6 22.6 3 20.8M12.5 25.2C9 26.2 6 27.6 2.5 29";

/**
 * The red thread comes down over the torn edge, loops once at the end of the
 * tagline and runs back under it, finishing in a frayed cut end. Drawn
 * left-to-right; RTL mirrors it. On the home page the page's own thread runs
 * on into the drop (`data-thread-join`).
 */
export function FooterThread() {
  return (
    <>
      <svg
        className="footer-thread footer-thread-drop"
        viewBox="0 0 20 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        data-thread-join
      >
        <path className="footer-thread-shade" d={DROP} />
        <path className="footer-thread-line" d={DROP} />
      </svg>
      <svg
        className="footer-thread footer-thread-tie"
        viewBox="0 0 240 32"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="footer-thread-shade" d={TIE} />
        <path className="footer-thread-line" d={TIE} />
        <path className="footer-thread-line footer-thread-fray" d={FRAY} />
      </svg>
    </>
  );
}
