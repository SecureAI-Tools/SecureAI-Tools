"use client";

import { tw } from "twind";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Id } from "lib/types/core/id";
import { Sidebar } from "lib/fe/components/side-bar";
import { Chat } from "lib/fe/components/chat";

const ChatPage = ({ orgSlug, chatId }: { orgSlug: string; chatId: string }) => {
  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        <Chat chatId={Id.from(chatId)} />
      </div>
    </AppsLoggedInLayout>
  );
};

export default ChatPage;
