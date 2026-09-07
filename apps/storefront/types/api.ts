import type {AuthUser} from "@rad/types";

export type SessionPayload = { user: AuthUser | null };
export type LoginInput = { email: string; password: string };
export type RegisterInput = { name: string; email: string; password: string };
export type PlaceOrderInput = {
  name?: string;
  city?: string;
  phone?: string;
  address?: string;
};
