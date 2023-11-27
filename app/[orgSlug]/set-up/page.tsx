import { Metadata } from "next";

import { OrganizationSetupPage } from "./organization-set-up-page";

export const metadata: Metadata = {
  title: "Organization setup",
};

export default function Page({ params }: { params: { orgSlug: string } }) {
  return <OrganizationSetupPage params={params} />;
}
