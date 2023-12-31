import {
  Alert,
  Button,
  Checkbox,
  Modal,
  TextInput,
  Tooltip,
} from "flowbite-react";
import { tw } from "twind";
import { ChangeEvent, useEffect, useState } from "react";
import useSWR from "swr";
import { HiOutlineExclamation } from "react-icons/hi";

import useTableState from "lib/fe/hooks/use-table-state";
import { RenderCellsFn, Table } from "lib/fe/components/table";
import { getDataSourceConnetionDocumentsApiPath } from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";
import useDebounce from "lib/fe/hooks/use-debounce";
import { formatDateTime } from "lib/core/date-format";
import { SelectedDocument } from "lib/fe/types/selected-document";
import { DocumentIcon } from "lib/fe/components/document-icon";

import {
  DataSource,
  DataSourceConnectionDocumentResponse,
  Id,
  IdType,
  PAGINATION_STARTING_PAGE_NUMBER,
  dataSourceToReadableName,
} from "@repo/core";

export const DocumentsSelectorModal = ({
  dataSource,
  dataSourceConnectionId,
  selectedDocuments,
  show,
  onDocumentsSelected,
  onClose,
}: {
  dataSource: DataSource;
  dataSourceConnectionId: Id<IdType.DataSourceConnection>;
  selectedDocuments: SelectedDocument[];
  show: boolean;
  onDocumentsSelected: (
    dataSource: DataSource,
    newSelection: SelectedDocument[],
  ) => void;
  onClose: () => void;
}) => {
  const [tableState, setTableState] = useTableState();
  const [currentlySelectedDocuments, setCurrentlySelectedDocuments] =
    useState<SelectedDocument[]>(selectedDocuments);
  const [searchQueryInput, setSearchQueryInput] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQueryInput);

  const {
    data: dataSourceDocumentsResponse,
    error: dataSourceDocumentsFetchError,
    isLoading: isDataSourceDocumentsResponseLoading,
    mutate: mutateDataSourceDocumentsResponse,
  } = useSWR(
    getDataSourceConnetionDocumentsApiPath({
      connectionId: dataSourceConnectionId,
      query: tableState.filter.searchQuery,
      pagination: {
        // Hackity hack!
        // TODO: Convert this into proper infinite scroll (that's the only one that works with Google Drive API)!
        page: 1,
        // 999 because Google Drive has max limit of 1000!
        pageSize: 999,
      },
    }),
    createFetcher<DataSourceConnectionDocumentResponse[]>(),
  );

  useEffect(() => {
    if (tableState.filter.searchQuery == debouncedSearchQuery) {
      return;
    }

    setTableState((old) => ({
      ...old,
      pagination: {
        currentPage: PAGINATION_STARTING_PAGE_NUMBER,
      },
      filter: {
        searchQuery: debouncedSearchQuery,
      },
    }));
  }, [debouncedSearchQuery]);

  const onPageChange = (newPage: number) => {
    setTableState((old) => ({
      ...old,
      pagination: {
        currentPage: newPage,
      },
    }));
  };

  const selectedExternalIds = new Set(
    currentlySelectedDocuments.map((d) => d.externalId!),
  );
  const renderCells: RenderCellsFn<DataSourceConnectionDocumentResponse> = ({
    item,
  }) => {
    return [
      <div>
        <Checkbox
          onChange={(e) => {
            const checked = e.currentTarget.checked;
            if (checked) {
              // Add document to selection
              setCurrentlySelectedDocuments((old) => {
                return [
                  ...old,
                  {
                    dataSource: dataSource,
                    externalId: item.externalId,
                    name: item.name,
                    mimeType: item.mimeType,
                    dataSourceConnectionId: dataSourceConnectionId,
                  },
                ];
              });
            } else {
              // Remove document from selection
              setCurrentlySelectedDocuments((old) => {
                return [...old.filter((i) => i.externalId !== item.externalId)];
              });
            }
          }}
          checked={selectedExternalIds.has(item.externalId)}
        />
      </div>,
      <div className={tw("flex flex-row items-center")}>
        <div>
          <DocumentIcon mimeType={item.mimeType} />
        </div>
        <div className={tw("ml-2")}>
          {item.name}
        </div>
      </div>,
      <div>{formatDateTime(item.createdAt)}</div>,
    ];
  };

  const onPageCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!dataSourceDocumentsResponse) {
      return;
    }

    const checked = e.currentTarget.checked;
    if (checked) {
      // Add all documents from current page to selection
      setCurrentlySelectedDocuments((old) => {
        const newItems: SelectedDocument[] = [];
        dataSourceDocumentsResponse.response.forEach((d) => {
          if (!selectedExternalIds.has(d.externalId)) {
            newItems.push({
              dataSource: dataSource,
              externalId: d.externalId,
              name: d.name,
              mimeType: d.mimeType,
              dataSourceConnectionId: dataSourceConnectionId,
            });
          }
        });
        return [...old, ...newItems];
      });
    } else {
      // Remove all documents from current page to selection
      setCurrentlySelectedDocuments((old) => {
        const currentPageExternalIds = new Set(
          dataSourceDocumentsResponse.response.map((d) => d.externalId),
        );
        return [
          ...old.filter((i) => !currentPageExternalIds.has(i.externalId!)),
        ];
      });
    }
  };

  const pageCheckboxChecked =
    (dataSourceDocumentsResponse?.response?.length ?? 0) > 0 &&
    dataSourceDocumentsResponse?.response.every((d) =>
      selectedExternalIds.has(d.externalId),
    );
  const readableName = dataSourceToReadableName(dataSource);
  return (
    <Modal
      size="5xl"
      position="center"
      show={show}
      onClose={onClose}
      dismissible
    >
      <Modal.Header>Select documents from {readableName}</Modal.Header>
      <Modal.Body>
        <div>
          {dataSourceDocumentsFetchError ? (
            <Alert
              color="failure"
              icon={HiOutlineExclamation}
              className={tw("mb-3")}
            >
              <div>
                <h1 className={tw("text font-semibold mb-1")}>
                  Could not get documents!
                </h1>
                <div className={tw("text-xs")}>
                  Encountered an unexpected error while fetching documents from{" "}
                  {readableName}. This could be due to {readableName} being
                  temporarily unavailable.
                </div>
                <Button
                  onClick={() => {
                    mutateDataSourceDocumentsResponse();
                  }}
                  size="xs"
                  className={tw("mt-1")}
                >
                  Try again
                </Button>
              </div>
            </Alert>
          ) : null}
          <div className={tw("mb-4")}>
            <TextInput
              id="search"
              name="search"
              placeholder="Search documents"
              value={searchQueryInput}
              onChange={(event) => {
                setSearchQueryInput(event.target.value);
              }}
              autoComplete="off"
            />
          </div>
          <div className={tw("mt-2 mb-2")}>
            Selected {currentlySelectedDocuments.length} documents
          </div>
          <Table
            loading={isDataSourceDocumentsResponseLoading}
            data={dataSourceDocumentsResponse?.response}
            columns={[
              <Tooltip
                content={
                  pageCheckboxChecked
                    ? "Unselect all documents from current page"
                    : "Select all documents from current page"
                }
                className={tw("normal-case")}
              >
                <Checkbox
                  onChange={onPageCheckboxChange}
                  checked={pageCheckboxChecked}
                />
              </Tooltip>,
              "Document",
              "Created Date",
            ]}
            renderCells={renderCells}
            page={1}
            totalPages={1}
            onPageChange={onPageChange}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => {
            onDocumentsSelected(dataSource, currentlySelectedDocuments);
            onClose();
          }}
        >
          Continue
        </Button>
        <Button onClick={onClose} outline>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
