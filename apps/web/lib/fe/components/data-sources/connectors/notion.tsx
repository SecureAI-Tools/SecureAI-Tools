import { Alert, Button, Spinner } from "flowbite-react";
import { useEffect, useState } from "react";
import { tw } from "twind";
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiOutlineExclamation } from "react-icons/hi";

import { DataSource, Id, IdType, OAuthAuthorizeUrlResponse, isEmpty } from "@repo/core";

import { FrontendRoutes } from "lib/fe/routes";
import { SuccessModal } from "lib/fe/components/success-modal";
import { getDataSourceAuthorizeUrlApiPath } from "lib/fe/api-paths";
import { get } from "lib/fe/api";
import { createDataSourceConnection } from "lib/fe/data-source-utils";

export const NotionConnector = ({
  orgSlug,
  userId,
}: {
  orgSlug: string;
  userId: Id<IdType.User>;
}) => {
  const [currentState, setCurrentState] = useState<"loading" | "error" | "success">("loading");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startOAuthFlow = async () => {
    const callbackUri = getCallbackUri();

    try {
      const { response } = await get<OAuthAuthorizeUrlResponse>(getDataSourceAuthorizeUrlApiPath({
        orgIdOrSlug: orgSlug,
        dataSource: DataSource.NOTION,
        redirectUri: callbackUri,
        scopes: [],
      }));
      // Redirect to authorize url
      router.push(response.authorizeUrl);
    } catch (e) {
      console.log("could not get authorize url", e);
      setCurrentState("error")
    }

  }

  useEffect(() => {
    if (!window || !pathname || !searchParams) {
      return;
    }

    if (isRedirectBackFromProvider(searchParams)) {
      const errorCode = getErrorParam(searchParams);
      const authorizationCode = getAuthorizationCodeParam(searchParams);

      if (!isEmpty(errorCode)) {
        setCurrentState('error');
      } else {
        // Create data source connection based on authorizationCode
        createDataSourceConnection(orgSlug, {
          dataSource: DataSource.NOTION,
          baseUrl: "https://notion.so/",
          authorizationCode: authorizationCode!,
          redirectUri: getCallbackUri(),
        }).then((resp) => {
          setCurrentState("success")
        }).catch((e) => {
          console.error("something went wrong when trying to create data source connection", e);
          setCurrentState("error");
        });
      }
    } else {
      startOAuthFlow();
    }
  }, [pathname, searchParams]);

  const renderCurrentState = () => {
    if (currentState === "loading") {
      return (
        <>
          <Spinner size="xl" />
          <div className={tw("mt-4")}>Redirecting to Notion...</div>
        </>
      );
    }

    if (currentState === "error") {
      return (
        <>
          <Alert color="failure" icon={HiOutlineExclamation}>
            <div className={tw("font-medium")}>Something went wrong!</div>
            <div className={tw("mt-2")}>Something went wrong when trying to connect to Notion. Please try again.</div>
            <Button
              onClick={() => {
                startOAuthFlow();
              }}
              className={tw("mt-2")}
            >
              Retry
            </Button>
          </Alert>
        </>
      );
    }
  }

  return (
    <div>
      <div className={tw("flex flex-col items-center")}>
        {renderCurrentState()}
      </div>
      <SuccessModal
        show={currentState === "success"}
        dismissible={false}
        msg={
          <p>
            Successfully connected to Notion. Now you can select files
            from Notion when needed
          </p>
        }
        onButtonClick={() => {
          router.push(FrontendRoutes.getDataSourcesRoute(orgSlug));
        }}
      />
    </div>
  );
};

function isRedirectBackFromProvider(searchParams: ReadonlyURLSearchParams): boolean {
  return !isEmpty(getErrorParam(searchParams)) || !isEmpty(getAuthorizationCodeParam(searchParams));
}

function getErrorParam(searchParams: ReadonlyURLSearchParams): string | null {
  return searchParams.get("error");
}

function getAuthorizationCodeParam(searchParams: ReadonlyURLSearchParams): string | null {
  return searchParams.get("code");
}

function getCallbackUri(): string {
  return `${window.location.protocol}//${window.location.host}${FrontendRoutes.getDataSourcesOAuthCallbackRoute(DataSource.NOTION)}`
}
