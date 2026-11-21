import {
  formatRadCode,
  parseRadNumber,
  type PublicRadIdentity,
} from "@rad/types";

type IdentityLookup =
  | { kind: "unreachable" }
  | { kind: "missing" }
  | { kind: "found"; identity: PublicRadIdentity };

type IdentityPlan =
  | { status: 307; location: string }
  | { status: 404 }
  | { status: 503 }
  | { status: 200; identity: PublicRadIdentity };

/**
 * Printed QR destinations stay on `/r/NNN`. A published story is a temporary
 * redirect to the existing passport. Anything else stays on this URL.
 */
export function planIdentityRequest(input: {
  code: string;
  search: string;
  lookup: IdentityLookup;
}): IdentityPlan {
  const radNumber = /^\d+$/.test(input.code)
    ? parseRadNumber(input.code)
    : null;
  if (!radNumber) return { status: 404 };
  const canonical = formatRadCode(radNumber);
  if (input.code !== canonical) {
    return { status: 307, location: `/r/${canonical}${input.search}` };
  }
  if (input.lookup.kind === "unreachable") return { status: 503 };
  if (input.lookup.kind === "missing") return { status: 404 };
  const identity = input.lookup.identity;
  if (identity.radNumber !== radNumber || identity.code !== canonical) {
    return { status: 404 };
  }
  if (identity.storyPublished && identity.passportPath) {
    return {
      status: 307,
      location: `${identity.passportPath}${input.search}`,
    };
  }
  return { status: 200, identity };
}
