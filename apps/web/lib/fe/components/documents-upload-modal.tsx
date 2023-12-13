import { ReactNode, useEffect, useState } from "react";
import { Button, Modal, Progress, Spinner } from "flowbite-react";
import { HiOutlineExclamation } from "react-icons/hi";
import { tw } from "twind";

import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { Id } from "lib/types/core/id";
import { uploadDocument } from "lib/fe/document-utils";

type UploadState = "in-progress" | "succeeded" | "failed";

export const DocumentsUploadModal = ({
  collectionId,
  files,
  onSuccessContinue,
}: {
  collectionId: Id<DocumentCollectionResponse>;
  files: File[];
  onSuccessContinue: () => void;
}) => {
  const [uploadState, setUploadState] = useState<UploadState>("in-progress");
  const [uploadedCount, setUploadedCount] = useState(0);

  const uploadDocuments = async (startIndex: number) => {
    setUploadState("in-progress");
    try {
      for (let i = startIndex; i < files.length; i++) {
        const file = files[i]!;
        await uploadDocument(collectionId, file);
        setUploadedCount(i + 1);
      }
      setUploadState("succeeded");
    } catch (e) {
      console.error("could not upload document", e);
      setUploadState("failed");
    }
  };

  useEffect(() => {
    uploadDocuments(0);
  }, []);

  const renderUploadInProgress = (): ReactNode => {
    return (
      <div className={tw("flex flex-col items-center")}>
        <div className={tw("mb-4 text-xl text-gray-900 dark:text-white")}>
          Uploading documents
          <Spinner size="sm" className={tw("ml-2")} />
        </div>
        <div className={tw("mt-2 max-w-xs text-gray-900 dark:text-white")}>
          This may take a while. Please do not close the tab until all documents
          have been uploaded.
        </div>
        <div className="items-center justify-center mt-8">
          <Progress
            labelText
            progress={(uploadedCount * 100) / files.length}
            size="md"
            textLabel={`Uploaded ${uploadedCount} of ${files.length}`}
            textLabelPosition="outside"
            className={tw("w-96")}
          />
        </div>
      </div>
    );
  };

  const renderUploadSucceeded = (): ReactNode => {
    return (
      <>
        <div
          className={tw(
            "w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 p-2 flex items-center justify-center mx-auto mb-3.5",
          )}
        >
          <svg
            aria-hidden="true"
            className={tw("w-8 h-8 text-green-500 dark:text-green-400")}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span className={tw("sr-only")}>Success</span>
        </div>
        <div className={tw("mb-4 text-xl text-gray-900 dark:text-white")}>
          Documents successfully uploaded
        </div>
        <Button onClick={onSuccessContinue}>Continue</Button>
      </>
    );
  };

  const renderUploadFailed = (): ReactNode => {
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
          Upload failed!
        </div>
        <div className={tw("mb-4 text-md text-gray-900 dark:text-white")}>
          Something went wrong when uploading documents.
          <br />
          Please click the button below to resume!
        </div>
        <Button
          onClick={() => {
            uploadDocuments(uploadedCount);
          }}
        >
          Retry Upload
        </Button>
      </>
    );
  };

  let modalBody: ReactNode = null;
  switch (uploadState) {
    case "in-progress":
      modalBody = renderUploadInProgress();
      break;
    case "succeeded":
      modalBody = renderUploadSucceeded();
      break;
    case "failed":
      modalBody = renderUploadFailed();
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
