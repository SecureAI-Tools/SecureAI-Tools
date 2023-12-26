import { Button, Modal, Spinner } from "flowbite-react";
import { ReactNode, useState } from "react";
import { tw } from "twind";
import { HiOutlineExclamation } from "react-icons/hi";

import { modelsPullApiPath } from "lib/fe/api-paths";
import { PullModelProgressResponse } from "lib/types/api/model-pull-progress.response";
import ModelDownloadProgressBar from "lib/fe/components/org-settings/model-download-progress-bar";
import { Link } from "lib/fe/components/link";

interface PullProgressState {
  [key: string]: PullModelProgressResponse;
}

type DownloadState = "not-started" | "in-progress" | "succeeded" | "failed";

export const ModelDownloadModal = ({
  show,
  modelName,
  orgSlug,
  onSuccess,
  onFailure,
  onSuccessContinue,
  onFailureContinue,
}: {
  show: boolean;
  modelName: string;
  orgSlug: string;
  onSuccess: () => void;
  onFailure: () => void;
  onSuccessContinue: () => void;
  onFailureContinue: () => void;
}) => {
  const [pullProgressState, setPullProgressState] =
    useState<PullProgressState | null>(null);
  const [downloadState, setDownloadState] =
    useState<DownloadState>("not-started");
  const [downloadErrors, setDownloadErrors] = useState<string[]>([]);

  const startPull = () => {
    setDownloadState("in-progress");
    pullModel(orgSlug, modelName)
      .then(async (reader) => {
        const textDecoder = new TextDecoder();

        let done, value;
        while (!done) {
          ({ value, done } = await reader.read());
          if (done) {
            console.log("done pulling the model");
            setDownloadState("succeeded");
            onSuccess();
            return;
          }
          const decodedChunk = textDecoder.decode(value);

          const progressResponses = parseProgressResponses(decodedChunk);
          const errors = progressResponses
            .filter((r) => r.error !== undefined)
            .map((e) => e.error!);
          if (errors.length > 0) {
            // Some error occured
            setDownloadState("failed");
            onFailure();
            setDownloadErrors(errors);
            return;
          }

          if (progressResponses.length > 0) {
            setPullProgressState((currentState) => {
              const newState: PullProgressState = {
                ...(currentState ?? {}),
              };
              progressResponses.forEach((pr) => {
                if (pr.digest) {
                  newState[pr.digest] = pr;
                }
              });

              return newState;
            });
          }
        }
      })
      .catch((e) => {
        setDownloadState("failed");
        onFailure();
      });
  };

  const renderDownloadNotStarted = (): ReactNode => {
    return (
      <>
        <div className={tw("mb-4 text-xl text-gray-900 dark:text-white")}>
          Download needed.
        </div>
        <div className={tw("mb-4 text-md text-gray-900 dark:text-white")}>
          Server needs to download{" "}
          <Link href={getModelLibraryLink(modelName)} target="_blank">
            {modelName}
          </Link>{" "}
          model first.
          <br />
          Click below to start download.
        </div>
        <Button
          onClick={() => {
            startPull();
          }}
        >
          Continue
        </Button>
      </>
    );
  };

  const renderDownloadInProgress = (): ReactNode => {
    return (
      <>
        <div className={tw("mb-4 text-xl text-gray-900 dark:text-white")}>
          Downloading{" "}
          <Link href={getModelLibraryLink(modelName)} target="_blank">
            {modelName}
          </Link>{" "}
          <Spinner size="sm" className={tw("ml-2")} />
        </div>
        <div className="items-center justify-center mt-2">
          {pullProgressState
            ? Object.keys(pullProgressState).map((key) => {
                return (
                  <div key={key} className="mt-4">
                    <ModelDownloadProgressBar
                      key={key}
                      progress={pullProgressState[key]!}
                    />
                  </div>
                );
              })
            : null}
        </div>
      </>
    );
  };

  const renderDownloadSucceeded = (): ReactNode => {
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
          Model <code>{modelName}</code> successfully downloaded
        </div>
        <Button onClick={onSuccessContinue}>Continue</Button>
      </>
    );
  };

  const renderDownloadFailed = (): ReactNode => {
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
          Download failed!
        </div>
        <div className={tw("mb-4 text-md text-gray-900 dark:text-white")}>
          {downloadErrors.filter((e) => e.includes("model not found")).length >
          0 ? (
            <p className={tw("mb-2")}>
              Model name <code>{modelName}</code> seems to be invalid.
              <br />
              Make sure to use one of the valid names from{" "}
              <Link href="https://ollama.ai/library" target="_blank">
                Ollama library
              </Link>
              .
            </p>
          ) : null}
        </div>
        <div className={tw("mb-8 text-md text-gray-900 dark:text-white")}>
          Raw Errors:
          {downloadErrors.map((e) => {
            return <pre>{e}</pre>;
          })}
        </div>
        <Button onClick={onFailureContinue}>Continue</Button>
      </>
    );
  };

  let modalBody: ReactNode = null;
  switch (downloadState) {
    case "not-started":
      modalBody = renderDownloadNotStarted();
      break;
    case "in-progress":
      modalBody = renderDownloadInProgress();
      break;
    case "succeeded":
      modalBody = renderDownloadSucceeded();
      break;
    case "failed":
      modalBody = renderDownloadFailed();
      break;
  }

  return (
    <Modal show={show} dismissible={false}>
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

const pullModel = async (
  orgSlug: string,
  modelName: string,
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  const resp = await fetch(modelsPullApiPath(orgSlug), {
    method: "POST",
    body: JSON.stringify({
      name: modelName,
    }),
  });
  return resp!.body!.getReader();
};

const parseProgressResponses = (chunk: string): PullModelProgressResponse[] => {
  // HTTP streaming by itself does not have any guarantees around chunk boundaries. So chunks need to be
  // delineated with custom delimiter. Ollama follows the new-line delimiter.
  //
  // https://github.com/jmorganca/ollama/blob/c5664c1fef35844bef5868b8e5dd16556c8306f6/server/routes.go#L605
  // https://discord.com/channels/1128867683291627614/1128867684130508875/1156838261919076352
  const lines = chunk
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && l.length > 0);

  return lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch (error) {
        console.log(`could not parse streamed chunk line ${l}`, error);
      }
      return null;
    })
    .filter((r) => r); // filter out null values
};

const getModelLibraryLink = (modelTag: string): string => {
  return `https://ollama.ai/library/${modelTag}`;
};
