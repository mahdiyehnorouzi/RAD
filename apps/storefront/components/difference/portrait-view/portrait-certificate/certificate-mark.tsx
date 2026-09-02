export function CertificateMark({ code }: { code: string }) {
  return (
    <svg className="difference-qr" viewBox="0 0 72 72" aria-hidden="true">
      <rect width="72" height="72" fill="#f7f2e9" />
      <rect x="4" y="4" width="18" height="18" fill="#18231f" />
      <rect x="50" y="4" width="18" height="18" fill="#18231f" />
      <rect x="4" y="50" width="18" height="18" fill="#18231f" />
      <rect x="10" y="10" width="6" height="6" fill="#f7f2e9" />
      <rect x="56" y="10" width="6" height="6" fill="#f7f2e9" />
      <rect x="10" y="56" width="6" height="6" fill="#f7f2e9" />
      <rect x="30" y="8" width="5" height="5" fill="#18231f" />
      <rect x="40" y="14" width="6" height="6" fill="#8a4938" />
      <rect x="28" y="28" width="16" height="16" fill="#263d34" />
      <rect x="48" y="32" width="8" height="8" fill="#18231f" />
      <rect x="32" y="50" width="6" height="14" fill="#18231f" />
      <rect x="52" y="52" width="10" height="4" fill="#8a4938" />
      <title>{code}</title>
    </svg>
  );
}
