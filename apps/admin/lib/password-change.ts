/** Client-side checks that mirror PATCH /auth/password. Empty string means the form may submit. */
export function passwordChangeError(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  if (input.currentPassword.length < 8 || input.newPassword.length < 8) {
    return "رمز عبور باید حداقل ۸ نویسه باشد.";
  }
  if (input.newPassword !== input.confirmPassword) {
    return "تکرار رمز عبور با رمز جدید یکسان نیست.";
  }
  if (input.newPassword === input.currentPassword) {
    return "رمز عبور جدید باید با رمز فعلی متفاوت باشد.";
  }
  return "";
}
