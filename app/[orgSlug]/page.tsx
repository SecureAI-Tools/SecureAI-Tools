import { tw } from "twind";
import { Metadata } from "next";

import NewChat from "lib/fe/components/new-chat";
import { Sidebar } from "lib/fe/components/side-bar";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { SectionTitle } from "lib/fe/components/section-title";

export const metadata: Metadata = {
  title: "Home | SecureAI Tools",
};

const OrgIndexPage = ({ params }: { params: { orgSlug: string } }) => {
  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={params.orgSlug} />
        <div className={tw("flex flex-row grow m-8 items-center")}>
          <div className={tw("flex flex-col grow m-8 items-center")}>
            <SectionTitle title={"New Chat"} />
            <div className={tw("mt-8 max-w-lg w-full")}>
              <NewChat orgIdOrSlug={params.orgSlug} />
            </div>
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default OrgIndexPage;
