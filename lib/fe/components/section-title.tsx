"use client";

import { tw } from "twind";

export const SectionTitle = ({ title }: { title: string }) => {
  return <h1 className={tw("text-5xl")}>{title}</h1>;
};
