"use client";

import { tw } from "twind/css";
import { useState } from "react";
import { HiOutlineClipboard, HiOutlineClipboardCheck } from "react-icons/hi";
import clipboardCopy from "clipboard-copy";

import { Tooltip } from "lib/fe/components/tooltip";

export const CopyClipboard = ({
  content,
  onCopied,
}: {
  content: string;
  onCopied?: () => void;
}) => {
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);

  if (copiedToClipboard) {
    return (
      <Tooltip tipContent="copied">
        <HiOutlineClipboardCheck />
      </Tooltip>
    );
  }

  return (
    <Tooltip tipContent="copy to clipboard">
      <HiOutlineClipboard
        className={tw("cursor-pointer hover:bg-slate-200 rounded")}
        onClick={() => {
          clipboardCopy(content);

          // Show success icon for a bit and then go back to copy-clipboard icon.
          setCopiedToClipboard(true);
          setTimeout(() => {
            setCopiedToClipboard(false);
          }, 2048);

          onCopied?.();
        }}
      />
    </Tooltip>
  )
};
