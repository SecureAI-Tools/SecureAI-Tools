import Image from "next/image";

import { MimeType } from "@repo/core";

const ICON_NAME_MAP = new Map<MimeType, string>([
  [MimeType.PDF, "pdf.svg"],
  [MimeType.GOOGLE_DOC, "google_docs.svg"],
  [MimeType.NOTION_PAGE, "notion.svg"],
]);

export const DocumentIcon = ({
  mimeType,
  size = 16
}: {
  mimeType: MimeType,
  size?: number,
}) => {
  const icon = ICON_NAME_MAP.get(mimeType) ?? '';

  return (
    <Image
      src={`/document-icons/${icon}`}
      alt="document logo"
      width={size}
      height={size}
    />
  );
};
