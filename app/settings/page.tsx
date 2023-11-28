import { Metadata } from "next";

import { UserSettingsPage } from "./user-settings-page";

export const metadata: Metadata = {
  title: "User settings",
};

export default function Page() {
  return <UserSettingsPage />;
}
