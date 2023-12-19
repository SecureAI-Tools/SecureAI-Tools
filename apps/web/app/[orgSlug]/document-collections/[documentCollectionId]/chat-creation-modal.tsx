import { useState } from "react";
import { tw } from "twind";
import { Button, Modal } from "flowbite-react";

import ChatInput from "lib/fe/components/chat-input";
import { ChatType } from "lib/types/core/chat-type";
import { postChat, postChatMessage } from "lib/fe/chat-utils";

import { Id, DocumentCollectionResponse, isEmpty } from "@repo/core";
import { ChatResponse } from "lib/types/api/chat.response";

const ChatCreationModal = ({
  show,
  documentCollectionId,
  orgSlug,
  onSuccess,
  onError,
  onClose,
}: {
  show: boolean;
  documentCollectionId: Id<DocumentCollectionResponse>;
  orgSlug: string;
  onSuccess: (chatId: Id<ChatResponse>) => void;
  onError: (e: unknown) => void;
  onClose: () => void;
}) => {
  const [input, setInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const chatResponse = await postChat(orgSlug, {
        type: ChatType.CHAT_WITH_DOCS,
        documentCollectionId: documentCollectionId?.toString(),
      });
      const chatId = Id.from<ChatResponse>(chatResponse.id);

      const chatMessageResponse = await postChatMessage(chatId, {
        message: {
          content: input,
          role: "user",
        },
      });
      onSuccess(chatId);
    } catch (e) {
      console.error("couldn't create chat", e);
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
