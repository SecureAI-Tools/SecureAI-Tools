"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tw } from "twind";
import Image from "next/image";
import { Button, Dropdown } from "flowbite-react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

import useToasts from "lib/fe/hooks/use-toasts";
import { FrontendRoutes } from "lib/fe/routes";
import ChatInput from "lib/fe/components/chat-input";
import { Toasts } from "lib/fe/components/toasts";
import { ChatType } from "lib/types/core/chat-type";
import {
  createDocument,
  createDocumentCollection,
} from "lib/fe/document-utils";
import { postChat, postChatMessage } from "lib/fe/chat-utils";
import { IndexingMode } from "lib/types/core/indexing-mode";
import {
  getOrgMembershipsApiPath,
  organizationsIdOrSlugApiPath,
  organizationsIdOrSlugModelsApiPath,
} from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";
import { TokenUser } from "lib/types/core/token-user";
import { isAdmin } from "lib/fe/permission-utils";
import { ModelsResponse } from "lib/types/api/models.response";
import { ModelSetupAlert } from "lib/fe/components/model-setup-alert";
import { Tooltip } from "lib/fe/components/tooltip";

import {
  Id,
  DocumentResponse,
  OrganizationResponse,
  ModelType,
  isEmpty,
  modelTypeToReadableName,
  OrgMembershipResponse,
  DataSource,
  IdType,
} from "@repo/core";
import { DocumentsDataSourceSelector } from "./data-sources/documents-data-source-selector";
import { SelectedDocument } from "../types/selected-document";

export default function NewChat({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<
    Map<DataSource, SelectedDocument[]>
  >(new Map());
  const [toasts, addToast] = useToasts();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const selectedDocumentsList = Array.from(
        selectedDocuments.values(),
      ).flat();

      const chatType: ChatType =
        selectedDocumentsList.length === 0
          ? ChatType.CHAT_WITH_LLM
          : ChatType.CHAT_WITH_DOCS;

      let documentCollectionId: Id<IdType.DocumentCollection> | undefined =
        undefined;
      if (chatType === ChatType.CHAT_WITH_DOCS) {
        const documentCollection = await createDocumentCollection(orgSlug, {});
        documentCollectionId = Id.from(documentCollection.id);
        await createDocuments(documentCollectionId, selectedDocumentsList);
      }

      const chatResponse = await postChat(orgSlug, {
        type: chatType,
        documentCollectionId: documentCollectionId?.toString(),
      });
      const chatId = Id.from(chatResponse.id);

      const chatMessageResponse = await postChatMessage(chatId, {
        message: {
          content: input,
          role: "user",
        },
      });

      router.push(
        `${FrontendRoutes.getChatRoute(orgSlug, chatId)}?src=new-chat`,
      );
    } catch (e) {
      console.log("couldn't create chat/chat-message", e);
      addToast({
        type: "failure",
        children: <p>Something went wrong. Please try again later.</p>,
      });
      setIsSubmitting(false);
    }
  };

  // Fetch organization
  const { data: organizationResponse, error: fetchOrganizationError } = useSWR(
    organizationsIdOrSlugApiPath(orgSlug),
    createFetcher<OrganizationResponse>(),
  );

  // Fetch current user's membership to organization
  const shouldFetchOrgMembership = organizationResponse !== undefined;
  const { data: orgMembershipResponse, error: fetchOrgMembershipError } =
    useSWR(
      shouldFetchOrgMembership
        ? getOrgMembershipsApiPath(Id.from(organizationResponse.response.id), {
            userId: (session!.user as TokenUser).id,
          })
        : null,
      createFetcher<OrgMembershipResponse[]>(),
    );

  // Fetch model info
  const shouldFetchModels =
    orgMembershipResponse !== undefined &&
    isAdmin(orgMembershipResponse.response) &&
    organizationResponse?.response.defaultModelType === ModelType.OLLAMA;
  const { data: modelsResponse, error: fetchModelsError } = useSWR(
    shouldFetchModels
      ? organizationsIdOrSlugModelsApiPath(
          orgSlug,
          organizationResponse.response.defaultModel,
        )
      : null,
    createFetcher<ModelsResponse>(),
  );

  const modelSetupRequired =
    orgMembershipResponse !== undefined &&
    isAdmin(orgMembershipResponse.response) &&
    organizationResponse?.response.defaultModelType === ModelType.OLLAMA &&
    modelsResponse !== undefined &&
    modelsResponse.response.models.length <= 0;

  const modelEditDisabled =
    orgMembershipResponse === undefined ||
    !isAdmin(orgMembershipResponse.response);

  return (
    <>
      <Toasts toasts={toasts} />
      <div className={tw("flex flex-col w-full h-screen")}>
        {modelSetupRequired ? (
          <div className={tw("m-5")}>
            <ModelSetupAlert orgSlug={orgSlug} />
          </div>
        ) : (
          <div className={tw("flex flex-col items-center mt-1.5")}>
            <div className={tw("rounded-lg border bg-gray-50 shadow-sm p-3")}>
              {organizationResponse ? (
                <Dropdown
                  label={
                    <div className={tw("text-sm font-light mr-1")}>
                      {organizationResponse.response.defaultModel} (
                      {modelTypeToReadableName(
                        organizationResponse.response.defaultModelType,
                      )}
                      )
                    </div>
                  }
                  inline
                >
                  <Dropdown.Item
                    disabled={modelEditDisabled}
                    href={
                      modelEditDisabled
                        ? undefined
                        : `${FrontendRoutes.getOrgSettingsRoute(
                            orgSlug,
                          )}?tab=ai`
                    }
                    className={tw(
                      modelEditDisabled ? "cursor-not-allowed" : "",
                    )}
                  >
                    <Tooltip
                      tipContent={
                        modelEditDisabled
                          ? "Ask your organization admin to change AI settings"
                          : undefined
                      }
                    >
                      <div className={tw("text-left")}>
                        <div>Change AI model</div>
                        <div className={tw("text-xs font-light")}>
                          Use a different AI model by changing AI settings
                        </div>
                      </div>
                    </Tooltip>
                  </Dropdown.Item>
                </Dropdown>
              ) : null}
            </div>
          </div>
        )}
        <div className={tw("flex flex-col grow items-center justify-center")}>
          <div className={tw("flex flex-col items-center")}>
            <Image
              className={tw(`h-20 w-20`)}
              src="/logo.png"
              alt="logo"
              width={80}
              height={80}
            />
            <span className={tw("font-semibold text-xl mt-4")}>
              How can I help you today?
            </span>
          </div>
        </div>
        <div
          className={tw(
            "shrink-0 bottom-0 left-0 w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2 md:pl-2 md:w-[calc(100%-.5rem)]",
          )}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();

              handleSubmit();
            }}
            className={tw(
              "stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl",
            )}
          >
            <div className={tw("relative flex h-full flex-1 items-stretch")}>
              <div className={tw("flex flex-col w-full items-center")}>
                <ChatInput
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  onEnter={handleSubmit}
                  disabled={modelSetupRequired || isSubmitting}
                  placeholder="Type something and hit Enter to start a new chat. Optionally attach documents to chat with them..."
                  rows={2}
                />
                <div className={tw("mt-2 w-full")}>
                  <DocumentsDataSourceSelector
                    orgSlug={orgSlug}
                    selectedDocuments={selectedDocuments}
                    onDocumentsSelected={(dataSource, newSelection) => {
                      setSelectedDocuments(
                        new Map(
                          selectedDocuments.set(dataSource, newSelection),
                        ),
                      );
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  className={tw("mt-4 w-full")}
                  isProcessing={isSubmitting}
                  disabled={modelSetupRequired || isEmpty(input)}
                >
                  Submit
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

const createDocuments = async (
  documentCollectionId: Id<IdType.DocumentCollection>,
  selectedDocuments: SelectedDocument[],
): Promise<DocumentResponse[]> => {
  const promises = selectedDocuments.map((sd) => {
    return createDocument(documentCollectionId, sd, IndexingMode.ONLINE);
  });

  return await Promise.all(promises);
};
