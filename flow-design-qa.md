# Payment and custom-order verification

- Studio: confirmed Start navigates to `/studio/start`; the embedded designer has been removed.
- Custom order: exercised writing → add more → category → size → colors → budget → timing → review. Verified selected values in the review and draft restoration after reload. The image-similarity step is skipped when no reference was supplied.
- Payment: inspected the real payment component with a temporary local order fixture at 390 × 844. Checked separate bank details, receipt upload, missing-receipt validation, and pending-review result. The fixture and temporary provider export were removed.
- Production storefront build passed. All workspace type checks passed. Purchase tests: 12 passed, including optional tracking and duplicate-receipt protection.
- No live order, receipt, or custom request was submitted. Live session/cart calls in the preview encountered API errors, so a production end-to-end submission was not verified. Microphone recording permission was not granted during visual QA.
- Existing catalogue imagery is reused for category illustrations and receipt confirmation; these photographs differ from the supplied montage.
- Deploy the API changes together with the storefront to accept receipts without a tracking number.
