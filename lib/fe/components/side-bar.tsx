"use client";

import { Avatar, Dropdown, Sidebar as FlowbiteSidebar } from "flowbite-react";
import {
  HiArrowRight,
  HiArrowLeft,
  HiChatAlt2,
  HiPlus,
  HiOutlineCog,
} from "react-icons/hi";
import { tw } from "twind";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { FrontendRoutes } from "lib/fe/routes";
import { TokenUser } from "lib/types/core/token-user";
import { clip } from "lib/core/string-utils";
import { getInitials } from "lib/core/name-utils";

type ActiveItem = 'new-chat' | 'chat-history';

export function Sidebar({
  orgSlug,
  activeItem
}: {
  orgSlug: string,
  activeItem?: ActiveItem,
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const user: TokenUser | undefined =
    session && sessionStatus === "authenticated"
      ? (session.user as TokenUser)
      : undefined;
  return (
    <FlowbiteSidebar className={tw("h-screen border-r", collapsed ? "" : "w-80")} collapsed={collapsed}>
      <FlowbiteSidebar.Logo
        href="#"
        img="/logo.png"
        imgAlt="SecureAI Tools logo"
        className={tw("mt-8")}
        onClick={(e) => { e.preventDefault() }}
      >
        <Dropdown
          label={
            <>SecureAI Tools</>
          }
          className={tw("z-50")}
          placement="bottom"
          inline
        >
          <Dropdown.Item
            as="a"
            href={FrontendRoutes.getOrgSettingsRoute(orgSlug)}
          >
            Organization settings
          </Dropdown.Item>
          <Dropdown.Item
            as="a"
            href={FrontendRoutes.getOrgUsersRoute(orgSlug)}
          >
            Organization users
          </Dropdown.Item>
        </Dropdown>
      </FlowbiteSidebar.Logo>
      <FlowbiteSidebar.Items>
        <FlowbiteSidebar.ItemGroup>
          <FlowbiteSidebar.Item
            href={FrontendRoutes.getOrgHomeRoute(orgSlug)}
            icon={HiPlus}
            className={tw("mt-4")}
            active={activeItem === 'new-chat'}
          >
            New Chat
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item
            href={FrontendRoutes.getChatHistoryRoute(orgSlug)}
            icon={HiChatAlt2}
            className={tw("mt-2")}
            active={activeItem === 'chat-history'}
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
                <div className={tw("flex flex-row items-center")}>
                  {user?.firstName} {user?.lastName}
                  <Link
                    href={`${FrontendRoutes.USER_SETTINGS}?src=side-bar`}
                    className={tw("ml-1")}
                  >
                    <HiOutlineCog className={tw("h-4 w-4")} />
                  </Link>
                </div>
                <div className={tw("text-xs text-gray-500 dark:text-gray-400")}>
                  {clip(user?.email ?? "", 24)}
                </div>
              </div>
            )}
          </Avatar>
        </FlowbiteSidebar.ItemGroup>
      </FlowbiteSidebar.Items>
    </FlowbiteSidebar>
  );
}
