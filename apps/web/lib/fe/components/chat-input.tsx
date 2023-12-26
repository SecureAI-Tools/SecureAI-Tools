import { ChangeEvent } from "react";
import { tw } from "twind";

export default function ChatInput({
  value,
  placeholder,
  onEnter,
  rows,
  disabled,
  onChange,
}: {
  value: string;
  placeholder: string;
  onEnter: () => void;
  rows?: number;
  disabled?: boolean | undefined;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div
      className={tw(
        "flex flex-col w-full flex-grow relative border border-black/10 dark:border-gray-900/50 dark:text-white rounded-xl shadow-xs dark:shadow-xs dark:bg-gray-700 bg-white",
      )}
    >
      <textarea
        className={tw(
          "m-0 w-full resize-none border-0 bg-transparent py-[10px] pr-10 focus:ring-0 focus-visible:ring-0 dark:bg-transparent md:py-4 md:pr-12 pl-3 md:pl-4",
          disabled ? "cursor-not-allowed" : "",
        )}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        onKeyUp={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
        }}
        rows={rows ?? 1}
      />
    </div>
  );
}
