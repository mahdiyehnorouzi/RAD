"use client";

import { useCommerce } from "@/components/commerce/commerce-provider";
import { LoginForm } from "./login-form";
import { ProfileView } from "./profile-view";

export function AccountPage() {
  const { user } = useCommerce();
  return user ? <ProfileView /> : <LoginForm />;
}
