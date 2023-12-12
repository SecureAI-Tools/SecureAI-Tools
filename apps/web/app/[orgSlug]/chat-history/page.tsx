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
        <Sidebar orgSlug={params.orgSlug} activeItem="chat-history" />
        <div
          className={tw(
            "flex flex-col ml-8 grow w-full overflow-scroll max-h-screen",
          )}
        >
          <div className={tw("mt-8")}>
            <PageTitle title="Chat History" />
          </div>
          <div className={tw("max-w-xl mt-8")}>
            <ChatHistory orgSlug={params.orgSlug} />
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default Page;
