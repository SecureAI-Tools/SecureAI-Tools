"use client";

import { tw } from "twind";

export const PageTitle = ({ children }: { children: React.ReactNode }) => {
  return <h1 className={tw("text-5xl")}>{children}</h1>;
};
