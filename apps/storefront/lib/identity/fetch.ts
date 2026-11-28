import { parseRadNumber, type PublicRadIdentity } from "@rad/types";
import { api, ApiError } from "@/lib/api/client";

class IdentityUnreachableError extends Error {
  constructor(code: string, cause: unknown) {
    super(`RAD identity API unreachable for "${code}"`, { cause });
    this.name = "IdentityUnreachableError";
  }
}

/** Registry lookup only. A failed API is not treated as a missing number. */
export async function fetchPublicIdentity(
  code: string,
): Promise<PublicRadIdentity | null> {
  const radNumber = parseRadNumber(code);
  if (!radNumber) return null;
  try {
    return await api<PublicRadIdentity>(
      `/identities/${encodeURIComponent(String(radNumber))}`,
      { cache: "no-store" },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw new IdentityUnreachableError(code, error);
  }
}
