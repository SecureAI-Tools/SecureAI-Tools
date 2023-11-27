"use client";

import { useRouter } from "next/navigation";
import { Metadata } from "next";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { ResetPassword } from "lib/fe/components/reset-password";
import { FrontendRoutes } from "lib/fe/routes";

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <AppsLoggedInLayout>
      <ResetPassword
        onResetPasswordSuccess={() => {
          router.replace(FrontendRoutes.APP_HOME);
        }}
      />
    </AppsLoggedInLayout>
  );
}
