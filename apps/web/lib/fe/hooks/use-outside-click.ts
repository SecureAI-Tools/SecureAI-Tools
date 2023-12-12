import { MutableRefObject, useEffect } from "react";

// Hook to get a callback when user clicked outside the ref.
//
// Based on https://stackoverflow.com/a/42234988
export default function useOutsideClick<HTMLElement>({
  ref,
  onClickOutside,
}: {
  ref: MutableRefObject<HTMLElement>;
  onClickOutside: () => void;
}) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !(ref.current as unknown as Node).contains(event.target as Node)
      ) {
        // Clicked outside given ref
        onClickOutside();
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Unbind the event listener on clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
}
