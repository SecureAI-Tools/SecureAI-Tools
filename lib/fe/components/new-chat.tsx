"use client";

import { Spinner } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tw } from "twind";
import Image from "next/image";

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

export default function NewChat({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, addToast] = useToasts();

  const handleSubmit = () => {
    setIsSubmitting(true);

    postChat(orgSlug, {})
      .then((response) => {
        router.push(
          `${FrontendRoutes.getChatRoute(
            orgSlug,
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
      <div className={tw("flex flex-col w-full h-screen")}>
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
              <div className={tw("flex w-full items-center")}>
                <ChatInput
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  onEnter={handleSubmit}
                  disabled={isSubmitting}
                  placeholder="Type something to start a new chat..."
                />
              </div>
              <div className={tw("m-auto pl-2")}>
                <Spinner
                  aria-label="generating response..."
                  size="lg"
                  className={tw(isSubmitting ? "visible" : "invisible")}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
