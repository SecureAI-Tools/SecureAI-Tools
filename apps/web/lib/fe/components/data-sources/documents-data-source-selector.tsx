"use client";

import { tw } from "twind";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "flowbite-react";
import useSWR from "swr";

import {
  DataSourceRecord,
  getDataSourceRecords,
} from "lib/fe/data-source-utils";
import { getDataSourcesApiPath, getOrganizationsIdOrSlugDataSourceConnectionsApiPath } from "lib/fe/api-paths";
import { TokenUser } from "lib/types/core/token-user";
import { createFetcher } from "lib/fe/api";
import { DataSourceIcon } from "lib/fe/components/data-sources/data-source-icon";
import { Tooltip } from "lib/fe/components/tooltip";
import { FrontendRoutes } from "lib/fe/routes";
import { DocumentsSelectorModal } from "lib/fe/components/data-sources/documents-selector-modal";
import { SelectedDocument } from "lib/fe/types/selected-document";
import { DataSourcesResponse } from "lib/types/api/data-sources.response";

import {
  DataSource,
  DataSourceConnectionResponse,
  Id,
  PAGINATION_STARTING_PAGE_NUMBER,
  dataSourceToReadableName,
  toMimeType,
} from "@repo/core";

export const DocumentsDataSourceSelector = ({
  orgSlug,
  selectedDocuments,
  onDocumentsSelected,
}: {
  orgSlug: string;
  selectedDocuments: Map<DataSource, SelectedDocument[]>;
  onDocumentsSelected: (
    dataSource: DataSource,
    newSelection: SelectedDocument[],
  ) => void;
}) => {
  const { data: session, status: sessionStatus } = useSession();
  const [dataSourceRecords, setDataSourceRecords] = useState<
    DataSourceRecord[] | undefined
  >(undefined);

  const shouldFetchDataSources =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourcesResponse,
    error: dataSourcesFetchError,
  } = useSWR(
    shouldFetchDataSources
      ? getDataSourcesApiPath()
      : null,
    createFetcher<DataSourcesResponse>(),
  );

  // Fetch ALL connections
  const shouldFetchDataSourceConnections =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourceConnectionsResponse,
    error: dataSourceConnectionsFetchError,
  } = useSWR(
    shouldFetchDataSourceConnections
      ? getOrganizationsIdOrSlugDataSourceConnectionsApiPath({
          orgIdOrSlug: orgSlug,
          userId: Id.from((session.user as TokenUser).id),
          ordering: {
            orderBy: "createdAt",
            order: "desc",
          },
          pagination: {
            page: PAGINATION_STARTING_PAGE_NUMBER,
            // Hackity hack: It'll be a while before exceeding 1024 active connections per org-membership! ;)
            pageSize: 1024,
          },
        })
      : null,
    createFetcher<DataSourceConnectionResponse[]>(),
  );

  useEffect(() => {
    if (!dataSourceConnectionsResponse || !dataSourcesResponse) {
      return;
    }

    const newDataSourceRecords = getDataSourceRecords(
      dataSourceConnectionsResponse.response,
      dataSourcesResponse.response,
    );
    setDataSourceRecords([...newDataSourceRecords]);
  }, [dataSourceConnectionsResponse, dataSourcesResponse]);

  // TODO: Add coming soon ones as well somehow

  return (
    <div className={tw("flex flex-wrap")}>
      {dataSourceRecords ? (
        dataSourceRecords.map((dsr) => {
          return (
            <DataSourceCard
              key={dsr.dataSource}
              dataSourceRecord={dsr}
              orgSlug={orgSlug}
              selectedDocuments={selectedDocuments.get(dsr.dataSource) ?? []}
              onDocumentsSelected={onDocumentsSelected}
            />
          );
        })
      ) : (
        <div className={tw("flex w-full flex-col items-center")}>
          <Spinner size="xl" />
        </div>
      )}
    </div>
  );
};

const DataSourceCard = ({
  dataSourceRecord,
  orgSlug,
  selectedDocuments,
  onDocumentsSelected,
}: {
  dataSourceRecord: DataSourceRecord;
  orgSlug: string;
  selectedDocuments: SelectedDocument[];
  onDocumentsSelected: (
    dataSource: DataSource,
    newSelection: SelectedDocument[],
  ) => void;
}) => {
  const [showModal, setShowModal] = useState(false);
  const { dataSource, connection } = dataSourceRecord;

  if (dataSource === DataSource.UPLOAD) {
    return (
      <UploadCard
        selectedDocuments={selectedDocuments}
        onFilesSelected={(files: File[]) => {
          const newSelection = [
            ...selectedDocuments,
            ...files.map((f) => {
              return {
                dataSource: DataSource.UPLOAD,
                file: f,
                name: f.name,
                mimeType: toMimeType(f.type),
              };
            }),
          ];
          onDocumentsSelected(dataSource, newSelection);
        }}
      />
    );
  }

  const readableName = dataSourceToReadableName(dataSource);

  const tooltTipText = connection
    ? `Select documents from ${readableName}`
    : `Connect to ${readableName} first to select documents`;

  return (
    <div>
      <Tooltip tipContent={tooltTipText}>
        <div
          className={tw(
            "items-center p-3 w-48 rounded-lg border border-gray-200 bg-white shadow-md m-2 cursor-pointer hover:bg-gray-50",
          )}
          onClick={() => {
            setShowModal(true);
          }}
        >
          <div className={tw("flex flex-row items-center")}>
            <DataSourceIcon dataSource={dataSource} />
            <div className={tw("text-base font-normal ml-2")}>
              {readableName}
              <div className={tw("text-xs font-light")}>
                {selectedDocuments.length > 0
                  ? `${selectedDocuments.length} documents selected`
                  : "Select documents"}
              </div>
            </div>
          </div>
        </div>
      </Tooltip>
      {showModal ? (
        connection ? (
          <DocumentsSelectorModal
            dataSource={dataSource}
            dataSourceConnectionId={Id.from(connection.id)}
            selectedDocuments={selectedDocuments}
            show={showModal}
            onClose={() => setShowModal(false)}
            onDocumentsSelected={onDocumentsSelected}
          />
        ) : (
          <ConnectModal
            dataSource={dataSource}
            orgSlug={orgSlug}
            show={showModal}
            onClose={() => setShowModal(false)}
          />
        )
      ) : null}
    </div>
  );
};

const UploadCard = ({
  selectedDocuments,
  onFilesSelected,
}: {
  selectedDocuments: SelectedDocument[];
  onFilesSelected: (files: File[]) => void;
}) => {
  return (
    <div>
      <Tooltip tipContent="Upload documents">
        <label htmlFor="dropzone-file">
          <div
            className={tw(
              "items-center p-3 rounded-lg w-48 border border-gray-200 bg-white shadow-md m-2 cursor-pointer hover:bg-gray-50",
            )}
          >
            <div className={tw("flex flex-row items-center")}>
              <DataSourceIcon dataSource={DataSource.UPLOAD} />
              <div className={tw("text-base font-normal ml-2")}>
                Upload PDFs
                <div className={tw("text-xs font-light")}>
                  {selectedDocuments.length > 0
                    ? `${selectedDocuments.length} documents selected`
                    : "Select documents"}
                </div>
              </div>
            </div>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className={tw("hidden")}
            multiple={true}
            accept=".pdf"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onFilesSelected(Array.from(event.target.files ?? []));
            }}
            onClick={(
              event: React.MouseEvent<HTMLInputElement, MouseEvent>,
            ) => {
              // clear out previous selection
              (event.target as HTMLInputElement).value = "";
            }}
          />
        </label>
      </Tooltip>
    </div>
  );
};

const ConnectModal = ({
  dataSource,
  orgSlug,
  show,
  onClose,
}: {
  dataSource: DataSource;
  orgSlug: string;
  show: boolean;
  onClose?: () => void;
}) => {
  const readableName = dataSourceToReadableName(dataSource);

  return (
    <Modal
      size="lg"
      position="center"
      show={show}
      onClose={onClose}
      dismissible
    >
      <Modal.Header>Connect to {readableName}</Modal.Header>
      <Modal.Body>
        Your account is not connected to {readableName} yet. You first need to
        connect your account to {readableName} to select documents from it. This
        is only required the first time.
        <Button
          href={FrontendRoutes.getConnectDataSourceRoute(orgSlug, dataSource)}
          className={tw("mt-6")}
          target="_blank"
        >
          Connect to {readableName}
        </Button>
      </Modal.Body>
    </Modal>
  );
};
