export const parseInteger = (h: string | null | undefined): number | null => {
  if (!h) {
    return null;
  }

  const i = parseInt(h);
  if (isNaN(i)) {
    return null;
  }

  return i;
};
