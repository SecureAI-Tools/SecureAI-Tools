import { tw } from "twind";
import { Metadata } from "next";

import ChatHistory from "lib/fe/components/chat-history";
import { Sidebar } from "lib/fe/components/side-bar";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { PageTitle } from "lib/fe/components/page-title";

export const metadata: Metadata = {
  title: "Chat History",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={params.orgSlug} />
        <div className={tw("flex flex-col m-8 grow")}>
          <PageTitle title="Chat History" />
          <div className={tw("max-w-xl mt-8")}>
            <ChatHistory orgSlug={params.orgSlug} />
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default Page;
