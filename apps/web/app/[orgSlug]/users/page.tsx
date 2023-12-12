import { Metadata } from "next";

import { OrganizationUsersPage } from "./organization-users-page";

export const metadata: Metadata = {
  title: "Organization Users",
};

export default function Page({ params }: { params: { orgSlug: string } }) {
  return <OrganizationUsersPage params={params} />;
}
