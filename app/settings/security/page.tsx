import { Metadata } from "next";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { ResetPassword } from "lib/fe/components/reset-password";

export const metadata: Metadata = {
  title: "Account security",
};

export default function Page() {
  return (
    <AppsLoggedInLayout>
      <ResetPassword />
    </AppsLoggedInLayout>
  );
}
