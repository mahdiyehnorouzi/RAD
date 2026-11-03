export type AuthUser = {
  id: string;
  name: string;
  /** Null for a phone-only (SMS OTP) account that has never set an email. */
  email: string | null;
  /**
   * Canonical Iranian mobile, or null when the customer has not saved one.
   * Contact info only — not a sign-in identifier. `User.verifiedPhone`
   * (OTP-verified) is the sign-in identifier and is never exposed here.
   */
  phone: string | null;
  role: "customer" | "artist" | "admin";
  adminRole?: "owner" | "manager" | "editor" | "viewer" | null;
};

export type Actor = {
  user: AuthUser | null;
  guestId: string;
};

export function ownerKey(actor: Actor) {
  return actor.user ? `user:${actor.user.id}` : `guest:${actor.guestId}`;
}

export function toAuthUser(user: {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  role: string;
  adminRole?: string | null;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role as AuthUser["role"],
    adminRole: (user.adminRole as AuthUser["adminRole"]) ?? null,
  };
}
