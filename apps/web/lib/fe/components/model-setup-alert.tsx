import { Alert, Button } from "flowbite-react";
import { HiExclamation } from "react-icons/hi";
import { tw } from "twind";

import { FrontendRoutes } from "lib/fe/routes";

export const ModelSetupAlert = ({ orgSlug }: { orgSlug: string }) => {
  const additionalContent = (
    <>
      <div className={tw("mb-4 mt-2 text-sm dark:text-cyan-800")}>
        The AI model needs to be set up before you can use it. Please set up the
        AI model to continue
      </div>
      <Button
        href={`${FrontendRoutes.getOnboardingAIRoute(orgSlug)}?src=new-chat`}
        className={tw("w-fit")}
      >
        Finish set up
      </Button>
    </>
  );

  return (
    <>
      <Alert
        additionalContent={additionalContent}
        color="red"
        icon={HiExclamation}
        className={tw("mt-2 p-6")}
      >
        <span className="font-bold text-base">Set up AI model</span>
      </Alert>
    </>
  );
};
