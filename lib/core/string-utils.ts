export function getFirst(
  singleOrMultiValues: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(singleOrMultiValues) && singleOrMultiValues.length > 0) {
    return singleOrMultiValues[0];
  } else if (typeof singleOrMultiValues == "string") {
    return singleOrMultiValues as string;
  }

  return undefined;
}

export function isEmpty(s: string | undefined | null): boolean {
  return (s?.length ?? 0) < 1;
}

// Clips the strings to first N characters and ellipsis.
// For example,
//   clip("12345", 3) = "123…"
//   clip("12345", 6) = "12345"
export function clip(s: string, n: number): string {
  return s.length > n ? `${s.substring(0, n)}…` : s;
}

export function removeTrailingSlash(s: string | undefined): string | undefined {
  return s?.endsWith("/") ? s.slice(0, -1) : s;
}
