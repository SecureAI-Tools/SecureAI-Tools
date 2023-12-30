export enum MimeType {
  PDF = "application/pdf"
}

const reverseMap = new Map<string, MimeType>();
Object.keys(MimeType).forEach((s: string) => {
  const e = (<any>MimeType)[s];
  reverseMap.set(e.toString(), e);
});

export const toMimeType = (s: string): MimeType => {
  const result = reverseMap.get(s);
  if (!result) {
    throw new Error(`unsupported MimeType ${s}`)
  }

  return result;
}
