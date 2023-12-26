import { tw } from "twind/css";
import { default as NextLink } from "next/link";
import { ComponentProps } from "react";

// Own Link component with default anchor styling.
export const Link = (props: ComponentProps<typeof NextLink>) => {
  return (
    <NextLink
      className={tw(
        "underline text-blue-600 hover:text-blue-800 visited:text-purple-600",
      )}
      {...props}
    >
      {props.children}
    </NextLink>
  );
};
