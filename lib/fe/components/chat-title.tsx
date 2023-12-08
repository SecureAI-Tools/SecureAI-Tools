import { HiArrowLeft, HiPencil, HiCheck, HiX } from "react-icons/hi";
import { tw } from "twind";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "flowbite-react";
import { useEffect, useState } from "react";

import { patch, ResponseWithHeaders } from "lib/fe/api";
import { DEFAULT_CHAT_TITLE } from "lib/core/constants";
import { ChatUpdateRequest } from "lib/types/api/chat-update.request";
import { ChatResponse } from "lib/types/api/chat.response";
import { chatApiPath } from "lib/fe/api-paths";
import { Id } from "lib/types/core/id";
import { ModelType, modelTypeToReadableName } from "lib/types/core/model-type";

const DefaultChatTitle = () => (
  <div className={tw("italic text-gray-600")}>{DEFAULT_CHAT_TITLE}</div>
);

export const ChatTitle = ({
  title,
  chatId,
  isGenerating,
  modelType,
  model,
}: {
  title: string | undefined;
  chatId: Id<ChatResponse>;
  isGenerating: boolean;
  modelType: ModelType;
  model: string;
}) => {
  const router = useRouter();

  const [isEditing, setEditing] = useState<boolean>(false);
  const [currentTitle, setCurrentTitle] = useState<string | undefined>(title);
  const [titleInput, setTitleInput] = useState<string | undefined>(title);

  useEffect(() => {
    setCurrentTitle(title);
    setTitleInput(title);
  }, [title]);

  const startEditing = () => {
    setTitleInput(currentTitle);
    setEditing(true);
  };

  const saveTitle = () => {
    const originalTitle = currentTitle;
    updateChat(chatId, { title: titleInput }).catch((err) => {
      console.log("could not update chat title ", err);
      setCurrentTitle(originalTitle);
      // TODO: Show error to the user as toast or something!
    });
    setCurrentTitle(titleInput);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  return (
    <div
      className={tw(
        "group w-full text-token-text-primary border-b border-black/10 dark:border-gray-900/50 bg-gray-50 dark:bg-[#444654]",
      )}
    >
      <div className={tw("p-4 justify-center text-base m-auto")}>
        <div
          className={tw(
            "flex flex-1 align-middle items-center text-base mx-auto md:max-w-2xl lg:max-w-[38rem] xl:max-w-3xl",
          )}
        >
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }}
          >
            <HiArrowLeft />
          </Link>
          <div className={tw("ml-4 flex flex-col")}>
            {isEditing ? (
              <div className={tw("flex flex-row items-center")}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveTitle();
                  }}
                >
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className={tw("p-0")}
                    size={Math.min(titleInput?.length ?? 0, 50)}
                  />
                  <button type="submit" className={tw("ml-2")}>
                    <HiCheck />
                  </button>
                  <button onClick={cancelEdit} className={tw("ml-2")}>
                    <HiX />
                  </button>
                </form>
              </div>
            ) : (
              <div className={tw("flex flex-row items-center")}>
                <span>
                  {currentTitle ? currentTitle : <DefaultChatTitle />}
                </span>
                {isGenerating ? (
                  <Spinner size="xs" className={tw("ml-2")} />
                ) : (
                  <button onClick={startEditing} className={tw("ml-2")}>
                    <HiPencil />
                  </button>
                )}
              </div>
            )}
            <div className={tw("text-xs font-normal mt-1 ml-0.5")}>
              {model} ({modelTypeToReadableName(modelType)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const updateChat = async (
  chatId: Id<ChatResponse>,
  req: ChatUpdateRequest,
): Promise<ResponseWithHeaders<ChatResponse>> => {
  return await patch<ChatUpdateRequest, ChatResponse>(chatApiPath(chatId), req);
};
