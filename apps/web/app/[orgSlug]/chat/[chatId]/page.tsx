import ChatPage from "./chat-page";

const Page = ({ params }: { params: { orgSlug: string; chatId: string } }) => {
  return <ChatPage orgSlug={params.orgSlug} chatId={params.chatId} />;
};

export default Page;
