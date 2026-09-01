import { ResetPasswordPage } from "../../components/reset-password-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordPage email={params.email ?? ""} />;
}
