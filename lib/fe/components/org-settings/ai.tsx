"use client";

import { useSession } from "next-auth/react";
import { tw } from "twind";
import useSWR from "swr";
import { Button, Label, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";

import {
  getOrgMembershipsApiPath,
  organizationsIdOrSlugApiPath,
  organizationsIdOrSlugModelsApiPath,
} from "lib/fe/api-paths";
import { createFetcher, get, patch, ResponseWithHeaders } from "lib/fe/api";
import { OrganizationResponse } from "lib/types/api/organization.response";
import { TokenUser } from "lib/types/core/token-user";
import { Id } from "lib/types/core/id";
import { OrgMembershipResponse } from "lib/types/api/org-membership.response";
import { OrganizationUpdateRequest } from "lib/types/api/organization-update.request";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import { isAdmin } from "lib/fe/permission-utils";
import useToasts from "lib/fe/hooks/use-toasts";
import { ModelsResponse } from "lib/types/api/models.response";
import { ModelDownloadModal } from "lib/fe/components/org-settings/model-download-modal";
import { renderErrors } from "lib/fe/components/generic-error";
import { Link } from "lib/fe/components/link";

const OrgAISettings = ({
  orgSlug,
  buttonLabel = "Submit",
  onSuccess,
}: {
  orgSlug: string;
  buttonLabel?: string;
  onSuccess?: () => void;
}) => {
  const { data: session } = useSession();
  const [modelName, setModelName] = useState<string>("");
  const [isOrgAdmin, setIsOrgAdmin] = useState<boolean>(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [toasts, addToast] = useToasts();
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Fetch organization
  const { data: fetchOrganizationResponse, error: fetchOrganizationError } =
    useSWR(
      organizationsIdOrSlugApiPath(orgSlug),
      createFetcher<OrganizationResponse>(),
    );

  // Fetch current user's membership to organization
  const shouldFetchOrgMembership = fetchOrganizationResponse !== undefined;
  const { data: fetchOrgMembershipResponse, error: fetchOrgMembershipError } =
    useSWR(
      shouldFetchOrgMembership
        ? getOrgMembershipsApiPath(
            Id.from(fetchOrganizationResponse.response.id),
            { userId: (session!.user as TokenUser).id },
          )
        : null,
      createFetcher<OrgMembershipResponse[]>(),
    );

  useEffect(() => {
    if (!fetchOrganizationResponse) {
      return;
    }

    setModelName(fetchOrganizationResponse.response.defaultModel);
  }, [fetchOrganizationResponse]);

  useEffect(() => {
    if (!fetchOrgMembershipResponse) {
      return;
    }

    setIsOrgAdmin(isAdmin(fetchOrgMembershipResponse.response));
  }, [fetchOrgMembershipResponse]);

  const showErrorToast = () => {
    addToast({
      type: "failure",
      children: (
        <p>
          Something went wrong while trying to update LLM. Please try again
          later.
        </p>
      ),
    });
  };

  const updateOrganizationDefaultModel = () => {
    setIsFormSubmitting(true);

    updateOrganization(fetchOrganizationResponse!.response.id, {
      defaultModel: modelName,
    })
      .then(({ response: updatedOrganization }) => {
        addToast({
          type: "success",
          children: <p>Successfully updated LLM.</p>,
        });
      })
      .catch((e) => {
        showErrorToast();
      })
      .finally(() => {
        setIsFormSubmitting(false);
      });
  };

  const onFormSubmit = () => {
    setIsFormSubmitting(true);

    get<ModelsResponse>(
      organizationsIdOrSlugModelsApiPath(orgSlug, modelName ?? ""),
    )
      .then(({ response }) => {
        console.log("models response = ", response);
        if (response.models.length <= 0) {
          // model is not available! Start download flow!
          setShowDownloadModal(true);
        } else {
          updateOrganizationDefaultModel();
        }
      })
      .catch((e) => {
        showErrorToast();
        setIsFormSubmitting(false);
      });
  };

  const errorRendered = renderErrors(
    fetchOrganizationError,
    fetchOrgMembershipError,
  );
  if (errorRendered) {
    return errorRendered;
  }

  return (
    <div className={tw("px-4")}>
      <StudioToasts toasts={toasts} />
      <form
        className={tw("flex max-w-md flex-col gap-4")}
        onSubmit={(e) => {
          e.preventDefault();

          onFormSubmit();
        }}
      >
        <div>
          <div className={tw("mb-2 block")}>
            <Label
              htmlFor="model-name"
              value="Large Language Model (LLM) Name"
            />
          </div>
          <TextInput
            id="model-name"
            placeholder="mistral"
            required
            type="text"
            value={modelName}
            onChange={(event) => {
              setModelName(event.target.value);
            }}
            disabled={!isOrgAdmin}
            helperText={
              <span>
                <Link href="https://ollama.ai/library" target="_blank">
                  Ollama compatible
                </Link>{" "}
                model name. If you're unsure, then use{" "}
                <Link href="https://ollama.ai/library/mistral" target="_blank">
                  mistral
                </Link>
                . It is one of the best smaller models.
              </span>
            }
          />
        </div>
        <Button
          type="submit"
          disabled={!isOrgAdmin}
          isProcessing={isFormSubmitting}
        >
          {buttonLabel}
        </Button>
      </form>
      <ModelDownloadModal
        show={showDownloadModal}
        modelName={modelName ?? ""}
        orgSlug={orgSlug}
        key={modelName}
        onSuccess={() => {
          updateOrganizationDefaultModel();
        }}
        onSuccessContinue={() => {
          setShowDownloadModal(false);
          onSuccess?.();
        }}
        onFailure={() => {
          setIsFormSubmitting(false);
        }}
        onFailureContinue={() => {
          setShowDownloadModal(false);
        }}
      />
    </div>
  );
};

export default OrgAISettings;

const updateOrganization = async (
  orgId: string,
  req: OrganizationUpdateRequest,
): Promise<ResponseWithHeaders<OrganizationResponse>> => {
  return await patch<OrganizationUpdateRequest, OrganizationResponse>(
    organizationsIdOrSlugApiPath(orgId),
    req,
  );
};
