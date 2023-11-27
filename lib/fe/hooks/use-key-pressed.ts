import { useCallback, useEffect } from "react";

export default function useKeyPress({
  targetKey,
  onKeyPress,
}: {
  targetKey: KeyboardEvent["key"];
  onKeyPress: () => void;
}) {
  const downHandler = useCallback(
    ({ key }: { key: string }) => {
      if (key === targetKey) {
        onKeyPress();
      }
    },
    [targetKey],
  );

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    window.addEventListener("keydown", downHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [downHandler]);
}

function hasWindow(): boolean {
  return typeof window === "object";
}
