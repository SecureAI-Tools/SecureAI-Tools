"use client";

import { Analytics } from "lib/fe/analytics";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { TokenUser } from "lib/types/core/token-user";
import { FrontendRoutes } from "lib/fe/routes";
import { userForcePasswordResetApiPath } from "lib/fe/api-paths";
import { Id } from "lib/types/core/id";
import { createFetcher } from "lib/fe/api";
import { PasswordForceResetResponse } from "lib/types/api/password-force-reset.response";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";

// Intermediate page after successful log-in. This allows us to force password-reset.
export default function PostLogInPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const shouldFetchForcePasswordResetStatus =
    sessionStatus === "authenticated" && session;
  const {
    data: passwordForceResetResponse,
    error: shouldFetchForcePasswordResetStatusError,
  } = useSWR(
    shouldFetchForcePasswordResetStatus
      ? userForcePasswordResetApiPath(Id.from((session.user as TokenUser).id))
      : null,
    createFetcher<PasswordForceResetResponse>(),
  );

  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      session &&
      passwordForceResetResponse
    ) {
      const tokenUser = session.user as TokenUser;
      Analytics.identify({
        userId: tokenUser.id,
        traits: {
          userId: tokenUser.id,
        },
        callback: () => {
          // Navigate to next page
          router.replace(
            passwordForceResetResponse.response.forceReset
              ? FrontendRoutes.POST_LOG_IN_RESET_PASSWORD
              : FrontendRoutes.APP_HOME,
          );
        },
      });
    }
  }, [session, sessionStatus, passwordForceResetResponse]);

  return (
    <AppsLoggedInLayout>
      <div>
        <p>Loading...</p>
      </div>
    </AppsLoggedInLayout>
  );
}
