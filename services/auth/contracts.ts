import type { AuthUser } from "@rad/types";

export interface SignInInput { email: string; password: string; }
export interface AuthResult { user: AuthUser; sessionToken: string; }
export interface AuthGateway {
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
}

// Passwords must be hashed by a server-side identity provider and never stored in localStorage.
