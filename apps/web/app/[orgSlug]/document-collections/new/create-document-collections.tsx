"use client";

import Link from "next/link";
import { tw } from "twind";
import { HiArrowLeft } from "react-icons/hi";
import { useState } from "react";
import { useRouter } from "next/navigation";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { FrontendRoutes } from "lib/fe/routes";
import { PageTitle } from "lib/fe/components/page-title";
import { Toasts } from "lib/fe/components/toasts";
import useToasts from "lib/fe/hooks/use-toasts";
import { Button, Label, TextInput, Textarea } from "flowbite-react";
import { createDocumentCollection } from "lib/fe/document-utils";
import { DocumentsCreationModal } from "lib/fe/components/documents-creation-modal";
import { Sidebar } from "lib/fe/components/side-bar";
import { DocumentsDataSourceSelector } from "lib/fe/components/data-sources/documents-data-source-selector";
import { SelectedDocument } from "lib/fe/types/selected-document";

import { Id, IdType, isEmpty, DataSource } from "@repo/core";

const CreateDocumentCollections = ({ orgSlug }: { orgSlug: string }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentCollectionId, setDocumentCollectionId] = useState<
    Id<IdType.DocumentCollection> | undefined
  >();
  const [selectedDocuments, setSelectedDocuments] = useState<
    Map<DataSource, SelectedDocument[]>
  >(new Map());
  const [toasts, addToast] = useToasts();
  const router = useRouter();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const documentCollection = await createDocumentCollection(orgSlug, {
        name: name,
        description: !isEmpty(description) ? description : undefined,
      });
      setDocumentCollectionId(Id.from(documentCollection.id));
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

  const selectedDocumentsList = Array.from(selectedDocuments.values()).flat();

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        <div className={tw("p-8 w-full")}>
          <Toasts toasts={toasts} />
          <div className={tw("w-full")}>
            <div className={tw("flex flex-row items-center")}>
              <Link
                href={FrontendRoutes.getDocumentCollectionsRoute(orgSlug)}
                className={tw("mr-4")}
              >
                <HiArrowLeft className={tw("h-6 w-6")} />
              </Link>
              <PageTitle>Create document collection</PageTitle>
            </div>
            <div className={tw("mt-8")}>
              <form
                className={tw("flex max-w-4xl flex-col gap-4 w-full")}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <div>
                  <div className={tw("mb-2 block")}>
                    <Label
                      htmlFor="name"
                      value="Name"
                      className={tw("text-xl")}
                    />
                  </div>
                  <TextInput
                    id="name"
                    placeholder="Name of the document collection..."
                    required
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <div className={tw("mb-2 block mt-4")}>
                    <Label
                      htmlFor="description"
                      value="Description"
                      className={tw("text-xl")}
                    />
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Describe document collection (optional) ..."
                    value={description}
                    rows={4}
                    onChange={(event) => {
                      setDescription(event.target.value);
                    }}
                    className={tw("p-4")}
                    disabled={isSubmitting}
                  />
                </div>
                <div className={tw("mt-4 w-full")}>
                  <Label value="Add documents" className={tw("text-xl")} />
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
                  isProcessing={isSubmitting}
                  disabled={isEmpty(name) || selectedDocumentsList.length === 0}
                >
                  Submit
                </Button>
              </form>
            </div>
          </div>
          {documentCollectionId ? (
            <DocumentsCreationModal
              selectedDocuments={selectedDocumentsList}
              collectionId={documentCollectionId}
              onSuccess={() => {
                setIsSubmitting(false);
                router.push(
                  `${FrontendRoutes.getDocumentCollectionRoute(
                    orgSlug,
                    documentCollectionId,
                  )}?src=new-document-collection`,
                );
              }}
            />
          ) : null}
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default CreateDocumentCollections;
