"use client";

import { useSession } from "next-auth/react";
import { tw } from "twind";
import useSWR from "swr";
import { Button, Label, Select, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";

import {
  getOrgMembershipsApiPath,
  modelProvidersApiPath,
  organizationsIdOrSlugApiPath,
  organizationsIdOrSlugModelsApiPath,
} from "lib/fe/api-paths";
import { createFetcher, get, patch, ResponseWithHeaders } from "lib/fe/api";
import { TokenUser } from "lib/types/core/token-user";
import { OrgMembershipResponse } from "lib/types/api/org-membership.response";
import { OrganizationUpdateRequest } from "lib/types/api/organization-update.request";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import { isAdmin } from "lib/fe/permission-utils";
import useToasts from "lib/fe/hooks/use-toasts";
import { ModelsResponse } from "lib/types/api/models.response";
import { ModelDownloadModal } from "lib/fe/components/org-settings/model-download-modal";
import { renderErrors } from "lib/fe/components/generic-error";
import { Link } from "lib/fe/components/link";
import { ModelProviderResponse } from "lib/types/api/mode-provider.response";
import { ModelType, OrganizationResponse, Id, toModelType, modelTypeToReadableName } from "@repo/core";

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
  const [modelType, setModelType] = useState<ModelType | undefined>(undefined);
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

  const { data: modelProvidersResponse, error: fetchModelProvidersError } =
    useSWR(modelProvidersApiPath(), createFetcher<ModelProviderResponse[]>());

  useEffect(() => {
    if (!fetchOrganizationResponse) {
      return;
    }

    setModelName(fetchOrganizationResponse.response.defaultModel);
    setModelType(
      fetchOrganizationResponse.response.defaultModelType ?? ModelType.OLLAMA,
    );
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
      defaultModelType: modelType,
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

    if (modelType !== ModelType.OLLAMA) {
      updateOrganizationDefaultModel();
      return;
    }

    // Ollama model type. Continue with download if need be!
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

  if (
    fetchOrganizationError ||
    fetchOrgMembershipError ||
    fetchModelProvidersError
  ) {
    return renderErrors(
      fetchOrganizationError,
      fetchOrgMembershipError,
      fetchModelProvidersError,
    );
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
              htmlFor="model-type"
              value="Large Language Model (LLM) Type"
            />
          </div>
          <Select
            id="model-type"
            required
            onChange={(e) => {
              setModelType(toModelType(e.target.value));
            }}
            value={modelType}
          >
            {modelProvidersResponse?.response.map((config, i) => {
              return (
                <option key={config.type} value={config.type}>
                  {modelTypeToReadableName(config.type)}
                </option>
              );
            })}
          </Select>
        </div>
        <div>
          <div className={tw("mb-2 block")}>
            <Label
              htmlFor="model-name"
              value="Large Language Model (LLM) Name"
            />
          </div>
          <TextInput
            id="model-name"
            placeholder={getModelNamePlaceholder(modelType)}
            required
            type="text"
            value={modelName}
            onChange={(event) => {
              setModelName(event.target.value.toLowerCase());
            }}
            disabled={!isOrgAdmin}
            helperText={renderModelNameHelpText(modelType)}
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

const renderModelNameHelpText = (type: ModelType | undefined) => {
  switch (type) {
    case ModelType.OLLAMA:
      return (
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
      );
    case ModelType.OPENAI:
      return (
        <span>
          <Link
            href="https://platform.openai.com/docs/models/overview"
            target="_blank"
          >
            OpenAI compatible
          </Link>{" "}
          model name.
        </span>
      );
    default:
      return null;
  }
};

const getModelNamePlaceholder = (
  type: ModelType | undefined,
): string | undefined => {
  switch (type) {
    case ModelType.OLLAMA:
      return "mistral";
    case ModelType.OPENAI:
      return "gpt-3.5-turbo";
    default:
      return undefined;
  }
};
