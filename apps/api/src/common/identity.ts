export type AuthUser = {
  id: string;
  name: string;
  email: string;
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
  email: string;
  role: string;
  adminRole?: string | null;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AuthUser["role"],
    adminRole: (user.adminRole as AuthUser["adminRole"]) ?? null,
  };
}
