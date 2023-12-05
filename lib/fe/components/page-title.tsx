"use client";

import { tw } from "twind";

// TODO: Use this on all pages!
export const PageTitle = ({ title }: { title: string }) => {
  return <h1 className={tw("text-5xl")}>{title}</h1>;
};
