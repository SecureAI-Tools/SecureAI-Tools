import { Alert, Button, FileInput, Label, Modal } from "flowbite-react";
import { useState } from "react";
import { tw } from "twind";
import { useRouter } from "next/navigation";
import { HiOutlineExclamation } from "react-icons/hi";

import { DataSource, Id, IdType, dataSourceToReadableName, isEmpty } from "@repo/core";

import { FrontendRoutes } from "lib/fe/routes";
import { SuccessModal } from "lib/fe/components/success-modal";
import { postOrgDataSourceCredentialApiPath } from "lib/fe/api-paths";
import { post } from "lib/fe/api";
import { Link } from "lib/fe/components/link";
import useToasts from "lib/fe/hooks/use-toasts";
import { Toasts } from "lib/fe/components/toasts";
import { OrgDataSourceOAuthCredentialResponse } from "lib/types/api/org-data-source-oauth-credential.response";
import { OrgDataSourceOAuthCredentialCreateRequest } from "lib/types/api/org-data-source-oauth-credential-create.request";

export const GoogleDriveConfigure = ({
  orgSlug,
  userId,
}: {
  orgSlug: string;
  userId: Id<IdType.User>;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [toasts, addToast] = useToasts();
  const router = useRouter();

  const onFileRead = async (content: string) => {
    setIsSubmitting(true);

    try {
      const parsedCredentials = JSON.parse(content);
      
      // Validate the file
      const keys = Object.keys(parsedCredentials);
      if (keys.length !== 1) {
        // Show error
        const keysMsg = keys.length > 1 ? `(${keys.join(', ')})` : "";
        setError(`Invalid credentials file. Expected credentials for one client. Selected file has ${keys.length} client credentials ${keysMsg}`);
        setIsSubmitting(false);
        return;
      }
      const credential = parsedCredentials[keys[0]!];

      // Validate the credential
      const clientId = credential["client_id"];
      const clientSecret = credential["client_secret"];
      if (isEmpty(clientId) || isEmpty(clientSecret)) {
        setError("Invalid credentials file. Missing fields: [client_id, client_secret]");
        setIsSubmitting(false);
        return;
      }

      const response = await post<OrgDataSourceOAuthCredentialCreateRequest, OrgDataSourceOAuthCredentialResponse>(
        postOrgDataSourceCredentialApiPath(orgSlug, DataSource.GOOGLE_DRIVE),
        {
          clientId: clientId,
          clientSecret: clientSecret,
          raw: parsedCredentials,
        },
      );

      setShowSuccessModal(true);
    } catch (e) {
      console.error("could not create configuration", e);
      addToast({
        type: "failure",
        children: <p>Something went wrong. Please try again later.</p>,
      });
      setIsSubmitting(false);
      return;
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      return;
    }

    var reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        onFileRead(reader.result as string);
      },
      false,
    );
    reader.readAsText(selectedFile, "UTF-8");
  };

  return (
    <div>
      <Toasts toasts={toasts} />
      <div className={tw("flex flex-col items-center")}>
        {error ? (
          <Alert color="failure" icon={HiOutlineExclamation}>
            <div className={tw("font-medium")}>Something went wrong!</div>
            <div className={tw("mt-2")}>{error}</div>
          </Alert>
        ) : null}
        <form
          className={tw("flex max-w-4xl flex-col gap-4 w-full")}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
            return false;
          }}
        >
          <div>
            <div className={tw("mb-2 block")}>
              <Label
                htmlFor="file"
                value="Upload app credentials file"
                className={tw("text-xl")}
              />
            </div>
            <FileInput
              id="file"
              accept=".json"
              multiple={false}
              helperText={
                <span>
                  Please follow&nbsp;
                  <Link
                    href="https://github.com/SecureAI-Tools/SecureAI-Tools/blob/main/docs/google-drive-configure.md"
                    target="_blank"
                  >
                    these instructions
                  </Link>
                  &nbsp;to obtain your organization's internal Google OAuth app credentials, and then upload the json file here.
                </span>
              }
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (event.target.files === null || event.target.files.length < 1) {
                  return;
                }
                setSelectedFile(event.target.files[0]);
              }}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              isProcessing={isSubmitting}
              disabled={selectedFile === undefined || isSubmitting}
              className={tw("mt-4 w-full")}
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
      <SuccessModal
        show={showSuccessModal}
        dismissible={false}
        msg={
          <div>
            <div className={tw("font-semibold")}>
              Successfully configured Google Drive.
            </div>
            <div className={tw("font-normal")}>
              Now every organization member can connect their account to pull documents from {dataSourceToReadableName(DataSource.GOOGLE_DRIVE)} as needed.
            </div>
          </div>
        }
        onButtonClick={() => {
          router.push(FrontendRoutes.getDataSourcesRoute(orgSlug));
        }}
      />
    </div>
  );
};
