import { Metadata } from "next";

import ResetPasswordPage from "./reset-password-page";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function Page() {
  return <ResetPasswordPage />;
}
