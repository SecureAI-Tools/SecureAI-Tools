import { Metadata } from "next";

import AIOnboardingPage from "./ai-onboarding-page";

export const metadata: Metadata = {
  title: "Onboarding > AI Model",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return <AIOnboardingPage orgSlug={params.orgSlug} />;
};
export default Page;
