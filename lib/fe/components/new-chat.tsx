"use client";

import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tw } from "twind";

import { post } from "lib/fe/api";
import { organizationsIdOrSlugChatApiPath } from "lib/fe/api-paths";
import useToasts from "lib/fe/hooks/use-toasts";
import { FrontendRoutes } from "lib/fe/routes";
import ChatInput from "lib/fe/components/chat-input";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import { ChatCreateRequest } from "lib/types/api/chat-create.request";
import { ChatResponse } from "lib/types/api/chat.response";
import { Id } from "lib/types/core/id";

const postChat = async (
  orgIdOrSlug: string,
  req: ChatCreateRequest,
): Promise<ChatResponse> => {
  return (
    await post<ChatCreateRequest, ChatResponse>(
      organizationsIdOrSlugChatApiPath(orgIdOrSlug),
      req,
    )
  ).response;
};

export default function NewChat({ orgIdOrSlug }: { orgIdOrSlug: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, addToast] = useToasts();

  const handleSubmit = () => {
    setIsSubmitting(true);

    postChat(orgIdOrSlug, {})
      .then((response) => {
        router.push(
          `${FrontendRoutes.getChatRoute(
            Id.from(response.id),
          )}?append=${encodeURIComponent(input)}`,
        );
      })
      .catch((e) => {
        addToast({
          type: "failure",
          children: <p>Something went wrong. Please try again later.</p>,
        });
      });
  };

  return (
    <>
      <StudioToasts toasts={toasts} />
      <form
        onSubmit={(e) => {
          e.preventDefault();

          handleSubmit();
        }}
      >
        <ChatInput
          value={input}
          placeholder="Type something to start a new chat..."
          disabled={isSubmitting}
          rows={3}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onEnter={handleSubmit}
        />

        <div className={tw("flex items-center mt-2")}>
          <Button
            type="submit"
            className={tw("w-full")}
            isProcessing={isSubmitting}
            disabled={input.length < 1 || isSubmitting}
          >
            Submit
          </Button>
        </div>
      </form>
    </>
  );
}
