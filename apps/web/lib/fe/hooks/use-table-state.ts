import { useState, Dispatch, SetStateAction, useEffect } from "react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import { parseInteger } from "lib/core/number-utils";
import { PAGINATION_STARTING_PAGE_NUMBER } from "@repo/core/constants";

export default function useTableState(): [
  TableState,
  Dispatch<SetStateAction<TableState>>,
] {
  const searchParams = useSearchParams();

  const [tableState, setTableState] = useState<TableState>(DEFAULT_TABLE_STATE);

  useEffect(() => {
    setTableState(getInitialTableState(searchParams));
  }, [searchParams]);

  return [tableState, setTableState];
}

export interface TableState {
  filter: {
    searchQuery: string;
  };
  pagination: {
    currentPage: number;
  };
}

const getInitialTableState = (
  searchParams: ReadonlyURLSearchParams | null,
): TableState => {
  return {
    filter: {
      searchQuery: searchParams?.get(SEARCH_PARAM) ?? "",
    },
    pagination: {
      currentPage:
        parseInteger(searchParams?.get(PAGE_PARAM)) ??
        PAGINATION_STARTING_PAGE_NUMBER,
    },
  };
};

const DEFAULT_TABLE_STATE: TableState = {
  filter: {
    searchQuery: "",
  },
  pagination: {
    currentPage: PAGINATION_STARTING_PAGE_NUMBER,
  },
};

export const SEARCH_PARAM = "search";
export const PAGE_PARAM = "page";
