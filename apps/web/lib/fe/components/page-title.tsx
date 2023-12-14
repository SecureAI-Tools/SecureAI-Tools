"use client";

import { tw } from "twind";

// TODO: Use this on all pages!
// TODO: Convert to children pattern!
export const PageTitle = ({ title }: { title: React.ReactNode }) => {
  return <h1 className={tw("text-5xl")}>{title}</h1>;
};
