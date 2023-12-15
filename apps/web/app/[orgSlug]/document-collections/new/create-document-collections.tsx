"use client";

import Link from "next/link";
import { tw } from "twind";
import { HiArrowLeft } from "react-icons/hi";
import { useState } from "react";
import { useRouter } from "next/navigation";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { FrontendRoutes } from "lib/fe/routes";
import { PageTitle } from "lib/fe/components/page-title";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import useToasts from "lib/fe/hooks/use-toasts";
import { Button, Label, TextInput, Textarea } from "flowbite-react";
import { FilesUpload } from "lib/fe/components/files-upload";
import { createDocumentCollection } from "lib/fe/document-utils";
import { DocumentsUploadModal } from "lib/fe/components/documents-upload-modal";
import { Sidebar } from "lib/fe/components/side-bar";
import { Id, DocumentCollectionResponse } from "@repo/core";
import { isEmpty } from "lodash";

const CreateDocumentCollections = ({ orgSlug }: { orgSlug: string }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentCollectionId, setDocumentCollectionId] = useState<
    Id<DocumentCollectionResponse> | undefined
  >();
  const [toasts, addToast] = useToasts();
  const router = useRouter();

  const handleFilesSelected = (files: File[]) => {
    if (files.length < 1) {
      console.log("eh! got no files");
      return;
    }

    setSelectedFiles((currentlySelectedFiles) => {
      // TODO: Deduplicate? How to do without full file path?
      return [...currentlySelectedFiles, ...files];
    });
  };

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

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        <div className={tw("p-8 w-full")}>
          <StudioToasts toasts={toasts} />
          <div className={tw("w-full")}>
            <div className={tw("flex flex-row items-center")}>
              <Link
                href={FrontendRoutes.getDocumentCollectionsRoute(orgSlug)}
                className={tw("mr-4")}
              >
                <HiArrowLeft className={tw("h-6 w-6")} />
              </Link>
              <PageTitle title="Create document collection" />
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
                    placeholder="Describe document collection  (optional) ..."
                    value={description}
                    rows={4}
                    onChange={(event) => {
                      setDescription(event.target.value);
                    }}
                    className={tw("p-4")}
                    disabled={isSubmitting}
                  />
                </div>
                <div id="fileUpload" className={tw("mt-4 w-full h-48")}>
                  <FilesUpload
                    cta={<p>Select documents (PDFs)</p>}
                    help={
                      selectedFiles.length === 0 ? (
                        <p>Click to upload</p>
                      ) : (
                        <div
                          className={tw(
                            "flex flex-col items-center max-h-40 overflow-scroll",
                          )}
                        >
                          Selected {selectedFiles.length} files
                          {selectedFiles.map((f, i) => {
                            return <div key={i}>{f.name}</div>;
                          })}
                        </div>
                      )
                    }
                    onFilesSelected={handleFilesSelected}
                    accept=".pdf"
                    disabled={isSubmitting}
                    multiple
                  />
                </div>
                <Button
                  type="submit"
                  isProcessing={isSubmitting}
                  disabled={isEmpty(name) || selectedFiles.length === 0}
                >
                  Submit
                </Button>
              </form>
            </div>
          </div>
          {documentCollectionId ? (
            <DocumentsUploadModal
              files={selectedFiles}
              collectionId={documentCollectionId}
              onSuccessContinue={() => {
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
