import { PAGINATION_STARTING_PAGE_NUMBER, PAGINATION_DEFAULT_PAGE_SIZE } from "@repo/core";

export type OrderBy = "createdAt" | "updatedAt";
export type OrderDirection = "asc" | "desc";

export interface OrderingParams {
  orderBy: OrderBy;
  order: OrderDirection;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export const DEFAULT_ORDERING: OrderingParams = {
  orderBy: "createdAt",
  order: "asc",
};

export const DEFAULT_PAGINATION: PaginationParams = {
  page: PAGINATION_STARTING_PAGE_NUMBER,
  pageSize: PAGINATION_DEFAULT_PAGE_SIZE,
};
