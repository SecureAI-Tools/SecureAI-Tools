import { Metadata } from "next";

import { OrgAddUsersPage } from "./add-users-page";

export const metadata: Metadata = {
  title: "Add Users",
};

export default function Page({ params }: { params: { orgSlug: string } }) {
  return <OrgAddUsersPage params={params} />;
}
