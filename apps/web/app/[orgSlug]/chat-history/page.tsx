import { Metadata } from "next";

import ChatHistory from "lib/fe/components/chat-history";

export const metadata: Metadata = {
  title: "Chat History",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return (
    <ChatHistory orgSlug={params.orgSlug} />
  );
};

export default Page;
