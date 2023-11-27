import { Metadata } from "next";

import { OrganizationSettingsPage } from "./organization-settings-page";

export const metadata: Metadata = {
  title: "Organization settings",
};

export default function Page({ params }: { params: { orgSlug: string } }) {
  return <OrganizationSettingsPage params={params} />;
}
