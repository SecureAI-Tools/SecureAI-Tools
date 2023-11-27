import { useState } from "react";

import { StudioToastProps } from "lib/fe/components/studio-toasts";

export type AddToastFn = (toast: StudioToastProps) => void;

export default function useToasts(
  initialToasts: StudioToastProps[] = [],
): [StudioToastProps[], AddToastFn] {
  const [toasts, setToasts] = useState<StudioToastProps[]>(initialToasts);

  const addToastFn: AddToastFn = (toast: StudioToastProps) => {
    setToasts((list) => [...list, toast]);
  };

  return [toasts, addToastFn];
}
