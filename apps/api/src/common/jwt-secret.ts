const DEV_JWT_SECRET = "rad-dev-secret-change-me";
const MIN_PRODUCTION_LENGTH = 32;

/**
 * Anyone who knows the signing secret can mint an admin session, and the dev
 * fallback is public in this repo, so production refuses to start without a real one.
 */
export function jwtSecret(
  secret: string | undefined,
  nodeEnv = process.env.NODE_ENV,
) {
  if (nodeEnv !== "production") return secret || DEV_JWT_SECRET;
  if (
    !secret ||
    secret === DEV_JWT_SECRET ||
    secret.length < MIN_PRODUCTION_LENGTH
  ) {
    throw new Error(
      `JWT_SECRET must be a random value of at least ${MIN_PRODUCTION_LENGTH} characters in production.`,
    );
  }
  return secret;
}
