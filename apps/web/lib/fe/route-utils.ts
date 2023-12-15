import { NextRouter } from "next/router";
import { ReadonlyURLSearchParams } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getFirst } from "@repo/core/src/utils/string-utils";

export namespace FE {
  export const hasQueryParam = (router: NextRouter, key: string) =>
    key in router.query;

  export function getFirstQueryParam(
    router: NextRouter,
    key: string,
  ): string | undefined {
    return getFirst(router.query[key]);
  }

  // Updates search params with new values with shallow navigation
  //
  // https://github.com/vercel/next.js/discussions/47583#discussioncomment-5449707
  export function updateSearchParams({
    params,
    ignoreKeys,
    router,
    searchParams,
    pathname,
    type,
  }: {
    params: { [key: string]: string };
    ignoreKeys: string[];
    router: NextRouter | AppRouterInstance;
    searchParams: ReadonlyURLSearchParams | null;
    pathname: string | null;
    type?: "push" | "replace";
  }): void {
    if (!searchParams || !pathname) {
      return;
    }

    const current = new URLSearchParams(Array.from(searchParams.entries()));

    // Set new key values
    Object.entries(params).map(([key, value]) => {
      current.set(key, value);
    });

    // ignore keys
    ignoreKeys.forEach((ignoreKey) => current.delete(ignoreKey));

    // cast to string
    const search = current.toString();
    // or const query = `${'?'.repeat(search.length && 1)}${search}`;
    const query = search ? `?${search}` : "";

    if (type === "replace") {
      router.replace(`${pathname}${query}`, undefined, { shallow: true });
    } else {
      router.push(`${pathname}${query}`, undefined, { shallow: true });
    }
  }
}
