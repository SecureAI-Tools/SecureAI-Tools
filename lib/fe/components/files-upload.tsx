import { Spinner } from "flowbite-react";
import { tw } from "twind";
import { HiOutlineCloudUpload } from "react-icons/hi";

export type OnFiledSelectedFn = (files: File[]) => void;
export type onClickFn = (event: React.MouseEvent<HTMLInputElement>) => void;

// TODO: Support drag-&-drop!
export const FilesUpload = ({
  cta,
  help,
  onFilesSelected,
  onClick,
  accept,
  disabled,
  multiple,
  spinner,
}: {
  cta: React.ReactNode;
  help: React.ReactNode;
  onFilesSelected: OnFiledSelectedFn;
  onClick?: onClickFn | undefined;
  accept?: string | undefined;
  disabled?: boolean | undefined;
  spinner?: boolean | undefined;
  multiple?: boolean | undefined;
}) => {
  return (
    <label
      htmlFor="dropzone-file"
      className={tw(
        "flex flex-col items-center justify-center w-full h-full border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600",
      )}
    >
      <div>
        {spinner ? (
          <Spinner size="xl" />
        ) : (
          <div className={tw("flex flex-row items-center")}>
            <HiOutlineCloudUpload className={tw("h-12 w-12")} />
            <div className={tw("ml-4 flex flex-col items-center")}>
              <div className={tw("text-sm text-gray-500 dark:text-gray-400")}>
                {cta}
              </div>
              <div className={tw("text-xs text-gray-500 dark:text-gray-400")}>
                {help}
              </div>
            </div>
          </div>
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
  );
};
