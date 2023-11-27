export interface ResponseHeaders {
  pagination?: PaginationResponseHeaders;
}

export interface PaginationResponseHeaders {
  totalCount: number | null;
}
