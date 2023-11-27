"use client";

import { Avatar, Sidebar as FlowbiteSidebar } from "flowbite-react";
import { HiArrowRight, HiArrowLeft, HiChatAlt2, HiHome } from "react-icons/hi";
import { tw } from "twind";
import { useState } from "react";
import { useSession } from "next-auth/react";

import { FrontendRoutes } from "lib/fe/routes";
import { TokenUser } from "lib/types/core/token-user";
import { clip } from "lib/core/string-utils";
import { getInitials } from "lib/core/name-utils";

export function Sidebar({ orgSlug }: { orgSlug: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const user: TokenUser | undefined =
    session && sessionStatus === "authenticated"
      ? (session.user as TokenUser)
      : undefined;
  return (
    <FlowbiteSidebar className={tw("h-screen")} collapsed={collapsed}>
      <FlowbiteSidebar.Logo
        href={FrontendRoutes.APP_HOME}
        img="/logo.png"
        imgAlt="SecureAI Tools logo"
        className={tw("mt-8")}
      >
        SecureAI Tools
      </FlowbiteSidebar.Logo>
      <FlowbiteSidebar.Items>
        <FlowbiteSidebar.ItemGroup>
          <FlowbiteSidebar.Item
            href={FrontendRoutes.getOrgHomeRoute(orgSlug)}
            icon={HiHome}
            className={tw("mt-4")}
          >
            Home
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item
            href={FrontendRoutes.getChatHistoryRoute(orgSlug)}
            icon={HiChatAlt2}
            className={tw("mt-2")}
          >
            Chat History
          </FlowbiteSidebar.Item>
        </FlowbiteSidebar.ItemGroup>
        <FlowbiteSidebar.ItemGroup
          className={tw("absolute bottom-0 pb-8 border-t-0")}
        >
          <FlowbiteSidebar.Item
            href="#"
            icon={collapsed ? HiArrowRight : HiArrowLeft}
            onClick={() => {
              setCollapsed((oldValue) => {
                return !oldValue;
              });
            }}
            className={tw("mb-2")}
          >
            {collapsed ? "Expand" : "Collapse"}
          </FlowbiteSidebar.Item>
          <Avatar
            placeholderInitials={getInitials(user)}
            rounded
            className={tw("ml-1")}
          >
            {collapsed ? null : (
              <div className={tw("font-medium dark:text-white overflow-clip")}>
                <div>
                  {user?.firstName} {user?.lastName}
                </div>
                <div className={tw("text-xs text-gray-500 dark:text-gray-400")}>
                  {clip(user?.email ?? "", 22)}
                </div>
              </div>
            )}
          </Avatar>
        </FlowbiteSidebar.ItemGroup>
      </FlowbiteSidebar.Items>
    </FlowbiteSidebar>
  );
}
