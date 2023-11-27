import {
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_STARTING_PAGE_NUMBER,
} from "lib/core/constants";
import { IntRange } from "lib/types/core/numbers";

export type OrderBy = "createdAt" | "updatedAt";
export type OrderDirection = "asc" | "desc";

export interface OrderingParams {
  orderBy: OrderBy;
  order: OrderDirection;
}

export interface PaginationParams {
  page: number;
  pageSize: IntRange<1, 513>;
}

export const DEFAULT_ORDERING: OrderingParams = {
  orderBy: "createdAt",
  order: "asc",
};

export const DEFAULT_PAGINATION: PaginationParams = {
  page: PAGINATION_STARTING_PAGE_NUMBER,
  pageSize: PAGINATION_DEFAULT_PAGE_SIZE,
};
