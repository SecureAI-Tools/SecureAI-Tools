import bytes from "bytes";

export function formatBytes(
  val: number | undefined,
  options?: bytes.BytesOptions,
): string {
  const n = val ?? 0;

  const opts = options ?? {};
  if (!opts.unit) {
    opts.unit = getUnit(n);
  }

  return bytes.format(n, opts);
}

// Returns best suitable unit for bytes
//
// Maxes out at MB because progress in MB looks much quicker -- GB moves too slowly for the UI! Hackity hack!
function getUnit(byts: number): bytes.Unit {
  if (byts < Math.pow(2, 10 * 1)) {
    return "B";
  } else if (byts < Math.pow(2, 10 * 2)) {
    return "KB";
  } else {
    return "MB";
  }
}
