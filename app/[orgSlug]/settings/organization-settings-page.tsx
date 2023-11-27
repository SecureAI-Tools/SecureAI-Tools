"use client";

import { Tabs, TabsRef } from "flowbite-react";
import { HiCog, HiChip } from "react-icons/hi";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tw } from "twind";

import { PageTitle } from "lib/fe/components/page-title";
import OrgGeneralSettings from "lib/fe/components/org-settings/general";
import { FE } from "lib/fe/route-utils";
import OrgAISettings from "lib/fe/components/org-settings/ai";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";

const TAB_SEARCH_PARAM_NAME = "tab";

export function OrganizationSettingsPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabsRef = useRef<TabsRef>(null);
  const [_, setActiveTab] = useState(0);

  const setTabFromSearchParams = () => {
    const activeTabName = searchParams?.get(TAB_SEARCH_PARAM_NAME) ?? "general";
    tabsRef.current?.setActiveTab(tabNameToIndex(activeTabName));
  };

  useEffect(() => {
    setTabFromSearchParams();
  }, [searchParams, tabsRef]);

  return (
    <AppsLoggedInLayout
      onAuthenticated={() => {
        setTabFromSearchParams();
      }}
    >
      <div className={tw("p-8")}>
        <PageTitle title="Organization settings" />

        <div className={tw("mt-6 overflow-x-auto max-w-4xl")}>
          <Tabs.Group
            style="fullWidth"
            ref={tabsRef}
            onActiveTabChange={(tab) => {
              setActiveTab(tab);

              FE.updateSearchParams({
                params: {
                  [TAB_SEARCH_PARAM_NAME]: tabIndexToName(tab),
                },
                ignoreKeys: [],
                router,
                searchParams,
                pathname,
                type: "replace",
              });
            }}
          >
            <Tabs.Item title="General" icon={HiCog} active>
              <OrgGeneralSettings orgSlug={params.orgSlug} />
            </Tabs.Item>
            <Tabs.Item title="AI" icon={HiChip}>
              <OrgAISettings orgSlug={params.orgSlug} />
            </Tabs.Item>
          </Tabs.Group>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
}

const TAB_NAMES_LIST = ["general", "ai"];

const tabNameToIndex = (name: string): number => {
  const index = TAB_NAMES_LIST.findIndex((s) => s === name);
  return index > 0 ? index : 0;
};

const tabIndexToName = (idx: number): string => {
  return TAB_NAMES_LIST[idx < TAB_NAMES_LIST.length ? idx : 0];
};
