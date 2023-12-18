import { useState } from "react";

import { ToastProps } from "lib/fe/components/toasts";

export type AddToastFn = (toast: ToastProps) => void;

export default function useToasts(
  initialToasts: ToastProps[] = [],
): [ToastProps[], AddToastFn] {
  const [toasts, setToasts] = useState<ToastProps[]>(initialToasts);

  const addToastFn: AddToastFn = (toast: ToastProps) => {
    setToasts((list) => [...list, toast]);
  };

  return [toasts, addToastFn];
}
