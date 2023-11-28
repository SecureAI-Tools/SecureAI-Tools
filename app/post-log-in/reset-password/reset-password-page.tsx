"use client";

import { useRouter } from "next/navigation";
import { tw } from "twind";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { ResetPassword } from "lib/fe/components/reset-password";
import { FrontendRoutes } from "lib/fe/routes";

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-col items-center")}>
        <ResetPassword
          onResetPasswordSuccess={() => {
            router.replace(FrontendRoutes.APP_HOME);
          }}
        />
      </div>
    </AppsLoggedInLayout>
  );
}
