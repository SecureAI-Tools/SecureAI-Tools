import { tw } from "twind";
import { Metadata } from "next";

import NewChat from "lib/fe/components/new-chat";
import { Sidebar } from "lib/fe/components/side-bar";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";

export const metadata: Metadata = {
  title: "Home | SecureAI Tools",
};

const OrgIndexPage = ({ params }: { params: { orgSlug: string } }) => {
  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={params.orgSlug} activeItem="new-chat" />
        <NewChat orgSlug={params.orgSlug} />
      </div>
    </AppsLoggedInLayout>
  );
};

export default OrgIndexPage;
