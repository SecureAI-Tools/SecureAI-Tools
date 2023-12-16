import { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@repo/database";
import { sendBadRequestError } from "./utils";

import { getFirst, ErrorResponse, Id, PAGINATION_STARTING_PAGE_NUMBER, PAGINATION_DEFAULT_PAGE_SIZE, ResponseHeaders, HEADER_PAGINATION_TOTAL_COUNT } from "@repo/core";

export namespace API {
  export function getFirstQueryParam(
    req: NextApiRequest,
    key: string,
  ): string | undefined {
    return getFirst(req.query[key]);
  }

  export function getOrderByParam(req: NextApiRequest): string | undefined {
    return getFirst(req.query["orderBy"]);
  }

  export function getOrderParam(req: NextApiRequest): string | undefined {
    return getFirst(req.query["order"]);
  }

  export function getQueryParams(req: NextApiRequest, key: string): string[] {
    return getAll(req.query[key]);
  }

  export function getAll(
    singleOrMultiValues: string | string[] | undefined,
  ): string[] {
    if (Array.isArray(singleOrMultiValues) && singleOrMultiValues.length > 0) {
      return singleOrMultiValues;
    } else if (typeof singleOrMultiValues == "string") {
      return [singleOrMultiValues];
    }

    return [];
  }

  export function get<T>(
    type: { new (): T },
    req: NextApiRequest,
    res: NextApiResponse<any | ErrorResponse>,
  ): T | undefined {
    try {
      return Object.assign(new type() as object, req.body) as T;
    } catch (error) {
      console.log("could not parse request: ", error);
      sendBadRequestError(res, "invalid request body");
      return undefined;
    }
  }

  export function validateAndGetPathInput<T, R>(
    param: string,
    req: NextApiRequest,
    res: NextApiResponse<R | ErrorResponse>,
    ctor: new () => T,
  ): Id<T> | undefined;
  export function validateAndGetPathInput<T>(
    param: string,
    req: NextApiRequest,
    res: NextApiResponse<T | ErrorResponse>,
    ctor: new () => T,
  ): Id<T> | undefined {
    const inputValue = getFirstQueryParam(req, param);

    if (inputValue) {
      return Id.from(inputValue);
    }

    sendBadRequestError(res, "Must specify a valid token parameter");

    return undefined;
  }

  export class PaginationParams {
    page!: number;
    pageSize!: number;

    constructor(p: number | undefined, ps: number | undefined) {
      this.page = p && !isNaN(p) && p > 0 ? p : PAGINATION_STARTING_PAGE_NUMBER;
      this.pageSize =
        ps && !isNaN(ps) && ps > 0 ? ps : PAGINATION_DEFAULT_PAGE_SIZE;
    }

    static from(searchParams: URLSearchParams): PaginationParams {
      const page = parseInt(searchParams.get("page") ?? "-1");
      const pageSize = parseInt(searchParams.get("pageSize") ?? "-1");
      return new PaginationParams(page, pageSize);
    }

    skip(): number {
      return (this.page - PAGINATION_STARTING_PAGE_NUMBER) * this.pageSize;
    }

    take(): number {
      return this.pageSize;
    }
  }

  export function getPaginationParams(req: NextApiRequest): PaginationParams {
    const pageStr = getFirstQueryParam(req, "page");
    const page = pageStr ? parseInt(pageStr) : undefined;

    const pageSizeStr = getFirstQueryParam(req, "pageSize");
    const pageSize = pageSizeStr ? parseInt(pageSizeStr) : undefined;

    return new PaginationParams(page, pageSize);
  }

  export interface OrderByInput {
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
  }

  export function searchParamsToOrderByInput(
    searchParams: URLSearchParams,
  ): OrderByInput {
    return getOrderingParamsHelper(
      searchParams.get("orderBy"),
      searchParams.get("order"),
    );
  }

  export function getOrderingParams(req: NextApiRequest): OrderByInput {
    return getOrderingParamsHelper(getOrderByParam(req), getOrderParam(req));
  }

  function getOrderingParamsHelper(
    orderByParam?: string | null,
    orderParam?: string | null,
  ): OrderByInput {
    if (orderByParam === "updatedAt") {
      return {
        updatedAt: getOrder(orderParam),
      };
    }

    return {
      createdAt: getOrder(orderParam),
    };
  }

  export function setResponseHeaders(
    res: NextApiResponse,
    headers: ResponseHeaders,
  ) {
    if (headers.pagination?.totalCount) {
      res.setHeader(
        HEADER_PAGINATION_TOTAL_COUNT,
        headers.pagination.totalCount,
      );
    }
  }

  export function createResponseHeaders(headers: ResponseHeaders): HeadersInit {
    const result: HeadersInit = [];
    if (headers.pagination?.totalCount) {
      result.push([
        HEADER_PAGINATION_TOTAL_COUNT,
        headers.pagination.totalCount.toString(),
      ]);
    }

    return result;
  }

  const ORDER_TO_PRISMA_ORDER_MAP: Map<
    string | undefined | null,
    Prisma.SortOrder
  > = new Map([
    ["asc", "asc"],
    ["desc", "desc"],
    [undefined, "desc"],
    [null, "desc"],
  ]);
  function getOrder(orderParam: string | undefined | null): Prisma.SortOrder {
    return ORDER_TO_PRISMA_ORDER_MAP.get(orderParam) ?? "desc";
  }
}
