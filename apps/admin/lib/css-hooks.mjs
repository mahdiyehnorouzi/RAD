/**
 * Node's test runner loads specs with the plain ESM loader, which has no
 * notion of `.css` imports (Next.js/webpack handle that at build time, not
 * here). Admin components import component-scoped CSS as a side effect
 * (see `@rad/ui`'s `button.tsx`), so any spec that renders one through
 * `test-dom.ts` needs those imports stubbed out instead of crashing.
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    return {
      format: "module",
      source: "export default {};",
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
