import { useRef, useState } from "react";
import { tw } from "twind";

import useKeyPress from "lib/fe/hooks/use-key-pressed";
import useOutsideClick from "lib/fe/hooks/use-outside-click";

export const ActionMenu = ({
  actions,
}: {
  actions: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }[];
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const wrapperRef = useRef(null);
  useOutsideClick({
    ref: wrapperRef,
    onClickOutside: () => setIsVisible(false),
  });

  useKeyPress({
    targetKey: "Escape",
    onKeyPress: () => setIsVisible(false),
  });

  const toggleVisibility = () =>
    setIsVisible((currentIsVisible) => !currentIsVisible);

  return (
    <div>
      <button
        id="dropdownMenuIconHorizontalButton"
        data-dropdown-toggle="dropdownDotsHorizontal"
        className={tw(
          "inline-flex items-center p-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600",
        )}
        type="button"
        onClick={() => {
          toggleVisibility();
        }}
        disabled={actions.length < 1}
      >
        <svg
          className={tw("w-5 h-5")}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 4 15"
        >
          <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      <div
        id="dropdownDotsHorizontal"
        className={tw([
          "absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600",
          isVisible ? "block" : "hidden",
        ])}
      >
        <ul
          className={tw("py-2 text-sm text-gray-700 dark:text-gray-200")}
          aria-labelledby="dropdownMenuIconHorizontalButton"
          ref={wrapperRef}
        >
          {actions.map((action, idx) => (
            <li key={`${idx}`}>
              <a
                className={tw([
                  "block select-none px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white",
                  action.disabled
                    ? "cursor-not-allowed text-gray-400"
                    : "cursor-pointer",
                ])}
                onClick={(event) => {
                  if (action.disabled) {
                    return;
                  }

                  action.onClick();
                  setIsVisible(false);
                }}
              >
                {action.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
