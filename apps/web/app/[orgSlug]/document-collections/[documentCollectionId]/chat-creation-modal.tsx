import { useState } from "react";
import { tw } from "twind";
import { Button, Modal } from "flowbite-react";

import ChatInput from "lib/fe/components/chat-input";
import { ChatType } from "lib/types/core/chat-type";
import { useRouter } from "next/navigation";
import { FrontendRoutes } from "lib/fe/routes";
import { postChat, postChatMessage } from "lib/fe/chat-utils";
import useToasts from "lib/fe/hooks/use-toasts";
import { StudioToasts } from "lib/fe/components/studio-toasts";

import { DocumentCollectionResponse } from "@repo/core/src/types/document-collection.response";
import { Id } from "@repo/core/src/types/id";
import { isEmpty } from "@repo/core/src/utils/string-utils";

const ChatCreationModal = ({
  show,
  documentCollectionId,
  orgSlug,
  onClose,
}: {
  show: boolean;
  documentCollectionId: Id<DocumentCollectionResponse>;
  orgSlug: string;
  onClose: () => void;
}) => {
  const [input, setInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();
  const [toasts, addToast] = useToasts();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const chatResponse = await postChat(orgSlug, {
        type: ChatType.CHAT_WITH_DOCS,
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
        `${FrontendRoutes.getChatRoute(
          orgSlug,
          chatId,
        )}?src=doc-collection-new-chat`,
      );
    } catch (e) {
      console.error("couldn't create chat", e);
      addToast({
        type: "failure",
        children: <p>Something went wrong. Please try again later.</p>,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <StudioToasts toasts={toasts} />
      <Modal
        show={show}
        size="2xl"
        position="center"
        dismissible
        onClose={onClose}
      >
        <Modal.Header>Start a new chat</Modal.Header>
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
              <ChatInput
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                }}
                onEnter={handleSubmit}
                disabled={isSubmitting}
                placeholder="Type something and hit Enter to start a new chat..."
                rows={3}
              />
              <Button
                type="submit"
                isProcessing={isSubmitting}
                disabled={isEmpty(input)}
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

export default ChatCreationModal;
function setState<T>(arg0: string): [any, any] {
  throw new Error("Function not implemented.");
}
