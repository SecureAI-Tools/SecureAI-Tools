"use client";

import { Tooltip as FlowbiteTooltip } from "flowbite-react";

export const Tooltip = ({
  tipContent,
  children,
}: {
  tipContent?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return tipContent ? (
    <FlowbiteTooltip content={tipContent}>{children}</FlowbiteTooltip>
  ) : (
    children
  );
};
