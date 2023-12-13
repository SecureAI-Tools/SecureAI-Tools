"use client";

import { tw } from "twind";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";

const DocumentCollectionListPage = ({ orgSlug }: { orgSlug: string }) => {
  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        <div>TODO: Show document collection list here</div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default DocumentCollectionListPage;
