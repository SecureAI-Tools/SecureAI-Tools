import { Pagination, Spinner, Table } from "flowbite-react";
import { tw } from "twind";

export type RenderCellsFn<T extends unknown> = ({
  item,
}: {
  item: T;
}) => React.ReactNode[];
export type OnPageChangeFn = (page: number) => void;

export const StudioTable = <T extends unknown>({
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
  columns: string[];

  // Rendering
  loading: boolean | undefined;
  renderCells: RenderCellsFn<T>;

  // Pagination
  page: number;
  totalPages: number;
  onPageChange: OnPageChangeFn;
}) => {
  const renderSpinner = () => (
    <Table.Row>
      <Table.Cell colSpan={columns.length}>
        <div className={tw("flex items-center justify-center")}>
          <div>
            <Spinner size="xl" />
          </div>
        </div>
      </Table.Cell>
    </Table.Row>
  );

  const renderRows = () =>
    data?.map((row, rowIdx) => (
      <Table.Row
        className={tw("bg-white dark:border-gray-700 dark:bg-gray-800")}
        key={`${page}.${rowIdx}`}
      >
        {...renderCells({ item: row }).map((cell, cellIdx) => (
          <Table.Cell
            className={tw("px-6 py-4")}
            key={`${page}.${rowIdx}.${cellIdx}`}
          >
            {cell}
          </Table.Cell>
        ))}
      </Table.Row>
    ));

  return (
    <>
      <Table hoverable>
        <Table.Head className={tw("bg-gray-50")}>
          {columns.map((col, idx) => (
            <Table.HeadCell key={`${col}.${idx}`} className={tw("px-6 py-4")}>
              {col}
            </Table.HeadCell>
          ))}
        </Table.Head>
        <Table.Body className={tw("divide-y")}>
          {loading ? renderSpinner() : renderRows()}
        </Table.Body>
      </Table>
      <div className={tw("float-root")}>
        <div className={tw("float-right mt-3")}>
          <div className={tw("flex flex-col items-center")}>
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
