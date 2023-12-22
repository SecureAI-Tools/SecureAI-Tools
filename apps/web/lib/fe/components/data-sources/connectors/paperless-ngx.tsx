import { Alert, Button, Label, TextInput } from "flowbite-react";
import { useState } from "react";
import { tw } from "twind";
import { HiOutlineExclamation } from "react-icons/hi";
import { StatusCodes } from "http-status-codes";
import { useRouter } from "next/navigation";

import { Link } from "lib/fe/components/link";
import {
  checkDataSourceConnection,
  createDataSourceConnection,
} from "lib/fe/data-source-utils";
import useToasts from "lib/fe/hooks/use-toasts";
import { Toasts } from "lib/fe/components/toasts";
import { FrontendRoutes } from "lib/fe/routes";
import { SuccessModal } from "lib/fe/components/success-modal";
import { DataSourceConnectionCheckResponse } from "lib/types/api/data-source-connection-check.response";

import { DataSource, Id, UserResponse, isEmpty } from "@repo/core";

export const PaperlessNgxConnector = ({
  orgSlug,
  userId,
}: {
  orgSlug: string;
  userId: Id<UserResponse>;
}) => {
  const [authTokenInput, setAuthTokenInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [connectionCheckResponse, setConnectionCheckResponse] = useState<
    DataSourceConnectionCheckResponse | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toasts, addToast] = useToasts();
  const router = useRouter();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setConnectionCheckResponse(undefined);

    try {
      const checkResponse = await checkDataSourceConnection(orgSlug, {
        baseUrl: urlInput,
        token: authTokenInput,
        dataSource: DataSource.PAPERLESS_NGX,
      });

      if (checkResponse.ok) {
        // Create data source connection
        const connection = await createDataSourceConnection(orgSlug, {
          dataSource: DataSource.PAPERLESS_NGX,
          baseUrl: urlInput,
          accessToken: authTokenInput,
        });
        setShowSuccessModal(true);
      } else {
        setConnectionCheckResponse(checkResponse);
      }
      setIsSubmitting(false);
    } catch (e) {
      console.error("could not create document collection", e);
      addToast({
        type: "failure",
        children: <p>Something went wrong. Please try again later.</p>,
      });
      setIsSubmitting(false);
      return;
    }
  };

  return (
    <div>
      <Toasts toasts={toasts} />
      {connectionCheckResponse?.ok === false ? (
        <div>
          <Alert color="failure" icon={HiOutlineExclamation}>
            <div className="font-medium">Connectivity check failed.</div>
            {renderConnectivityCheckError(connectionCheckResponse)}
          </Alert>
        </div>
      ) : null}
      <form
        className={tw("flex max-w-4xl flex-col gap-4 w-full mt-2")}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div>
          <div className={tw("mb-2 block")}>
            <Label
              htmlFor="instance-url"
              value="Instance URL"
              className={tw("text-xl")}
            />
          </div>
          <TextInput
            id="instance-url"
            placeholder="URL of Paperless-ngx instance"
            required
            type="url"
            value={urlInput}
            onChange={(event) => {
              setUrlInput(event.target.value);
            }}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <div className={tw("mb-2 block")}>
            <Label
              htmlFor="auth-token"
              value="API Auth Token"
              className={tw("text-xl")}
            />
          </div>
          <TextInput
            id="auth-token"
            placeholder="API Auth Token from Paperless-ngx instance"
            required
            type="text"
            value={authTokenInput}
            onChange={(event) => {
              setAuthTokenInput(event.target.value);
            }}
            disabled={isSubmitting}
            helperText={
              <span>
                Get API token from Paperless-ngx by opening the "My Profile"
                link in the user dropdown found in the web UI and clicking the
                circular arrow button. &nbsp;
                <Link
                  href="https://docs.paperless-ngx.com/api/#authorization:~:text=You%20can%20create%20(or%20re,endpoint%20to%20acquire%20authentication%20tokens.&text=Tokens%20can%20also%20be%20managed%20in%20the%20Django%20admin."
                  target="_blank"
                >
                  More info
                </Link>
              </span>
            }
          />
        </div>
        <Button
          type="submit"
          isProcessing={isSubmitting}
          disabled={isEmpty(authTokenInput) || isEmpty(urlInput)}
        >
          Submit
        </Button>
      </form>
      <SuccessModal
        show={showSuccessModal}
        dismissible={false}
        msg={
          <p>
            Successfully connected to Paperless-ngx. Now you can select files
            from Paperless-ngx when needed
          </p>
        }
        onButtonClick={() => {
          router.push(FrontendRoutes.getDataSourcesRoute(orgSlug));
        }}
      />
    </div>
  );
};

function renderConnectivityCheckError(
  connectionCheckResponse: DataSourceConnectionCheckResponse,
) {
  let errorMessage = "";

  const { ok, status, error } = connectionCheckResponse;
  if (status === StatusCodes.UNAUTHORIZED || status === StatusCodes.FORBIDDEN) {
    errorMessage =
      "Invalid auth token. Make sure to provide a valid API auth token from Paperless-ngx";
  } else {
    errorMessage = error ?? "Something went wrong";
  }

  return <div>{errorMessage}</div>;
}
