import { Spinner } from "flowbite-react";
import { tw } from "twind";

export type OnFiledSelectedFn = (files: File[]) => void;
export type onClickFn = (event: React.MouseEvent<HTMLInputElement>) => void;

export const FilesUpload = ({
  helpText,
  onFilesSelected,
  onClick,
  accept,
  disabled,
  multiple,
  spinner,
}: {
  helpText: string;
  onFilesSelected: OnFiledSelectedFn;
  onClick?: onClickFn | undefined;
  accept?: string | undefined;
  disabled?: boolean | undefined;
  spinner?: boolean | undefined;
  multiple?: boolean | undefined;
}) => {
  return (
    <div
      className={tw(
        "flex items-center justify-center xl:w-[1024px] lg:w-[800px] md:w-[400px]",
      )}
    >
      <label
        htmlFor="dropzone-file"
        className={tw(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600",
        )}
      >
        <div
          className={tw("flex flex-col items-center justify-center pt-5 pb-6")}
        >
          {spinner ? (
            <Spinner size="xl" />
          ) : (
            <>
              <svg
                className={tw("w-8 h-8 mb-4 text-gray-500 dark:text-gray-400")}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p
                className={tw("mb-2 text-sm text-gray-500 dark:text-gray-400")}
              >
                <span className={tw("font-semibold")}>Click to upload</span> or
                drag and drop
              </p>
              <p className={tw("text-xs text-gray-500 dark:text-gray-400")}>
                {helpText}
              </p>
            </>
          )}
        </div>
        <input
          id="dropzone-file"
          type="file"
          className={tw("hidden")}
          multiple={multiple}
          accept={accept}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onFilesSelected(Array.from(event.target.files ?? []));
          }}
          onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
            // clear out previous selection
            (event.target as HTMLInputElement).value = "";
            onClick?.(event);
          }}
          disabled={disabled}
        />
      </label>
    </div>
  );
};
