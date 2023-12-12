export const numberOfPages = (totalCount: number, pageSize: number): number =>
  Math.ceil(totalCount / pageSize);
