"use client";

import { tw } from "twind";
import { useRouter } from "next/navigation";

import { PageTitle } from "lib/fe/components/page-title";
import OrgAISettings from "lib/fe/components/org-settings/ai";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { FrontendRoutes } from "lib/fe/routes";
import { Analytics } from "lib/fe/analytics";

export function OrganizationSetupPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const router = useRouter();

  return (
    <AppsLoggedInLayout>
      <div className={tw("p-8")}>
        <PageTitle title={"Organization set-up"} />
        <div className={tw("mt-8")}>
          <OrgAISettings
            orgSlug={params.orgSlug}
            onSuccess={() => {
              Analytics.track({
                event: Analytics.Event.OrgSetupCompleted,
                callback: () => {
                  router.push(FrontendRoutes.APP_HOME);
                },
              });
            }}
          />
        </div>
      </div>
    </AppsLoggedInLayout>
  );
}
