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

import { FrontendRoutes } from "lib/fe/routes";
import { TokenUser } from "lib/types/core/token-user";
import { clip } from "lib/core/string-utils";
import { getInitials } from "lib/core/name-utils";

type ActiveItem = "new-chat" | "chat-history";

export function Sidebar({
  orgSlug,
  activeItem,
}: {
  orgSlug: string;
  activeItem?: ActiveItem;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const user: TokenUser | undefined =
    session && sessionStatus === "authenticated"
      ? (session.user as TokenUser)
      : undefined;
  return (
    <FlowbiteSidebar
      className={tw("h-screen border-r", collapsed ? "" : "w-80")}
      collapsed={collapsed}
    >
      <FlowbiteSidebar.Logo
        href={FrontendRoutes.APP_HOME}
        img="/logo.png"
        imgAlt="SecureAI Tools logo"
        className={tw("mt-8")}
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        SecureAI Tools
      </FlowbiteSidebar.Logo>
      <FlowbiteSidebar.Items>
        <FlowbiteSidebar.ItemGroup>
          <FlowbiteSidebar.Item
            href={FrontendRoutes.getOrgHomeRoute(orgSlug)}
            icon={HiPlus}
            className={tw("mt-4")}
            active={activeItem === "new-chat"}
          >
            New Chat
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item
            href={FrontendRoutes.getChatHistoryRoute(orgSlug)}
            icon={HiChatAlt2}
            className={tw("mt-2")}
            active={activeItem === "chat-history"}
          >
            Chat History
          </FlowbiteSidebar.Item>
        </FlowbiteSidebar.ItemGroup>
        <FlowbiteSidebar.ItemGroup
          className={tw("absolute bottom-0 mb-12 border-t-0")}
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
                  <Dropdown
                    label=""
                    dismissOnClick={false}
                    renderTrigger={() => (
                      <HiOutlineCog
                        className={tw("ml-1 h-4 w-4 cursor-pointer")}
                      />
                    )}
                    className={tw("z-50")}
                    placement="top"
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
                    <Dropdown.Item as="a" href={FrontendRoutes.USER_SETTINGS}>
                      User settings
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="a" href={FrontendRoutes.LOG_OUT}>
                      Log out
                    </Dropdown.Item>
                  </Dropdown>
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
