import { tw } from "twind/css";
import { ReactNode } from "react";

export const EmptyState = ({
  title,
  subTitle,
  cta,
}: {
  title: string;
  subTitle: string;
  cta: ReactNode;
}) => {
  return (
    <div className={tw("flex flex-col h-full items-center")}>
      <div className={tw("m-auto text-center max-w-md")}>
        <div className={tw("text-xl font-semibold")}>{title}</div>
        <div className={tw("mt-2 font-normal text-lg")}>{subTitle}</div>
        <div className={tw("flex justify-center items-center mt-4")}>{cta}</div>
      </div>
    </div>
  );
};
