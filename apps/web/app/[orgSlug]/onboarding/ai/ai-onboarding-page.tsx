"use client";

import { useRouter } from "next/navigation";
import { tw } from "twind";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { FrontendRoutes } from "lib/fe/routes";
import OrgAISettings from "lib/fe/components/org-settings/ai";
import { PageTitle } from "lib/fe/components/page-title";

export default function AIOnboardingPage({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-col items-center")}>
        <div>
          <div className={tw("mt-6 mb-6 ml-4")}>
            <PageTitle>Set up AI Model</PageTitle>
          </div>
          <div className={tw("w-96")}>
            <OrgAISettings
              orgSlug={orgSlug}
              onSuccess={() => {
                router.push(FrontendRoutes.APP_HOME);
              }}
            />
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
}
