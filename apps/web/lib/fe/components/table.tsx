import { Pagination, Spinner, Table as FlowbiteTable } from "flowbite-react";
import { ReactNode } from "react";
import { tw } from "twind";

export type RenderCellsFn<T extends unknown> = ({
  item,
}: {
  item: T;
}) => React.ReactNode[];
export type OnPageChangeFn = (page: number) => void;

export const Table = <T extends unknown>({
  data,
  columns,
  loading,
  renderCells,
  page,
  totalPages,
  onPageChange,
}: {
  // Data
  data: T[] | undefined;
  columns: ReactNode[];

  // Rendering
  loading: boolean | undefined;
  renderCells: RenderCellsFn<T>;

  // Pagination
  page: number;
  totalPages: number;
  onPageChange: OnPageChangeFn;
}) => {
  const renderSpinner = () => (
    <FlowbiteTable.Row>
      <FlowbiteTable.Cell colSpan={columns.length}>
        <div className={tw("flex items-center justify-center")}>
          <div>
            <Spinner size="xl" />
          </div>
        </div>
      </FlowbiteTable.Cell>
    </FlowbiteTable.Row>
  );

  const renderRows = () =>
    data?.map((row, rowIdx) => (
      <FlowbiteTable.Row
        className={tw("bg-white dark:border-gray-700 dark:bg-gray-800")}
        key={`${page}.${rowIdx}`}
      >
        {...renderCells({ item: row }).map((cell, cellIdx) => (
          <FlowbiteTable.Cell
            className={tw("px-6 py-4")}
            key={`${page}.${rowIdx}.${cellIdx}`}
          >
            {cell}
          </FlowbiteTable.Cell>
        ))}
      </FlowbiteTable.Row>
    ));

  return (
    <>
      <FlowbiteTable hoverable>
        <FlowbiteTable.Head className={tw("bg-gray-50")}>
          {columns.map((col, idx) => (
            <FlowbiteTable.HeadCell
              key={`${col}.${idx}`}
              className={tw("px-6 py-4")}
            >
              {col}
            </FlowbiteTable.HeadCell>
          ))}
        </FlowbiteTable.Head>
        <FlowbiteTable.Body className={tw("divide-y")}>
          {loading ? renderSpinner() : renderRows()}
        </FlowbiteTable.Body>
      </FlowbiteTable>
      <div className={tw("float-root")}>
        <div className={tw("float-right mt-3")}>
          <div className={tw("flex flex-col items-center mb-8")}>
            <p className={tw("text-sm")}>
              Showing page
              <span className={tw("font-semibold")}> {page} </span>
              of
              <span className={tw("font-semibold")}> {totalPages}</span>
            </p>
            <Pagination
              currentPage={page}
              layout="navigation"
              onPageChange={onPageChange}
              showIcons
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>
    </>
  );
};
