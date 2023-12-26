import { Button, Modal } from "flowbite-react";
import { tw } from "twind";

export const SuccessModal = ({
  show,
  dismissible,
  msg,
  buttonLabel = "Continue",
  onButtonClick,
}: {
  show: boolean;
  dismissible?: boolean;
  msg: React.ReactNode;
  buttonLabel?: string;
  onButtonClick: () => void;
}) => {
  return (
    <Modal show={show} dismissible={dismissible}>
      <Modal.Body>
        <div className={tw("relative p-4 text-center sm:p-5")}>
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
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span className={tw("sr-only")}>Success</span>
          </div>
          <div
            className={tw(
              "mb-4 text-lg font-semibold text-gray-900 dark:text-white",
            )}
          >
            {msg}
          </div>
          <div className={tw("flex items-center justify-center")}>
            <Button onClick={onButtonClick}>{buttonLabel}</Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
