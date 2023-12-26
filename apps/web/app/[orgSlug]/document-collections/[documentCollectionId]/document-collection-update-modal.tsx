import { useState } from "react";
import { tw } from "twind";
import { Button, Label, Modal, TextInput, Textarea } from "flowbite-react";

import { updateDocumentCollection } from "lib/fe/document-utils";

import {
  Id,
  DocumentCollectionResponse,
  isEmpty,
  DEFAULT_DOCUMENT_COLLECTION_NAME,
} from "@repo/core";

const DocumentCollectionUpdateModal = ({
  show,
  documentCollection,
  onSuccess,
  onError,
  onClose,
}: {
  show: boolean;
  documentCollection: DocumentCollectionResponse;
  onSuccess: () => void;
  onError: (e: unknown) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState<string>(
    documentCollection.name ?? DEFAULT_DOCUMENT_COLLECTION_NAME,
  );
  const [description, setDescription] = useState<string>(
    documentCollection.description ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateDocumentCollection(Id.from(documentCollection.id), {
        name: name,
        description: description,
      });
      setIsSubmitting(false);
      onSuccess();
    } catch (e) {
      console.error("couldn't update collection", e);
      setIsSubmitting(false);
      onError(e);
    }
  };

  return (
    <>
      <Modal
        show={show}
        size="2xl"
        position="center"
        dismissible
        onClose={onClose}
      >
        <Modal.Header>Edit document collection</Modal.Header>
        <Modal.Body>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                handleSubmit();
              }}
              className={tw(
                "stretch mx-2 flex flex-col gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl",
              )}
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
              <Button
                type="submit"
                isProcessing={isSubmitting}
                disabled={isEmpty(name)}
              >
                Submit
              </Button>
            </form>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DocumentCollectionUpdateModal;
