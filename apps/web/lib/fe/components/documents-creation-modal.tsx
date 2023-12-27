import { ReactNode, useEffect, useState } from "react";
import { Button, Modal, Progress, Spinner } from "flowbite-react";
import { HiOutlineExclamation } from "react-icons/hi";
import { tw } from "twind";

import { createDocument } from "lib/fe/document-utils";
import { IndexingMode } from "lib/types/core/indexing-mode";
import { SelectedDocument } from "lib/fe/types/selected-document";

import { Id, IdType } from "@repo/core";

export const DocumentsCreationModal = ({
  collectionId,
  selectedDocuments,
  onSuccess,
}: {
  collectionId: Id<IdType.DocumentCollection>;
  selectedDocuments: SelectedDocument[];
  onSuccess: () => void;
}) => {
  const [creationState, setCreationState] = useState<"in-progress" | "failed">("in-progress");
  const [createdCount, setCreatedCount] = useState(0);

  const createDocuments = async (startIndex: number) => {
    setCreationState("in-progress");
    try {
      for (let i = startIndex; i < selectedDocuments.length; i++) {
        const selectedDocument = selectedDocuments[i]!;
        await createDocument(collectionId, selectedDocument, IndexingMode.OFFLINE);
        setCreatedCount(i + 1);
      }
      onSuccess();
    } catch (e) {
      console.error("could not create document", e);
      setCreationState("failed");
    }
  };

  useEffect(() => {
    createDocuments(0);
  }, []);

  const renderInProgress = (): ReactNode => {
    return (
      <div className={tw("flex flex-col items-center")}>
        <div className={tw("mb-4 text-xl text-gray-900 dark:text-white")}>
          Creating documents
          <Spinner size="sm" className={tw("ml-2")} />
        </div>
        <div className={tw("mt-2 max-w-xs text-gray-900 dark:text-white")}>
          This may take a while. Please do not close the tab until all documents
          have been created.
        </div>
        <div className="items-center justify-center mt-8">
          <Progress
            labelText
            progress={(createdCount * 100) / selectedDocuments.length}
            size="md"
            textLabel={`Created ${createdCount} of ${selectedDocuments.length} documents`}
            textLabelPosition="outside"
            className={tw("w-96")}
          />
        </div>
      </div>
    );
  };

  const renderFailed = (): ReactNode => {
    return (
      <>
        <div
          className={tw(
            "w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 p-2 flex items-center justify-center mx-auto mb-3.5",
          )}
        >
          <HiOutlineExclamation />
        </div>
        <div className={tw("mb-4 text-xl text-gray-900 dark:text-white")}>
          Failed to create document!
        </div>
        <div className={tw("mb-4 text-md text-gray-900 dark:text-white")}>
          Something went wrong when creating documents.
          <br />
          Please click the button below to resume!
        </div>
        <Button
          onClick={() => {
            createDocuments(createdCount);
          }}
        >
          Retry
        </Button>
      </>
    );
  };

  let modalBody: ReactNode = null;
  switch (creationState) {
    case "in-progress":
      modalBody = renderInProgress();
      break;
    case "failed":
      modalBody = renderFailed();
      break;
  }

  return (
    <Modal show={true} dismissible={false} position="center">
      <Modal.Body>
        <div className={tw("relative p-4 text-center sm:p-5")}>
          <div className={tw("flex flex-col items-center justify-center")}>
            {modalBody}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
