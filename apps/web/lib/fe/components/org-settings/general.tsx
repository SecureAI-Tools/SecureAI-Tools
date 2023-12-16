import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { tw } from "twind";
import useSWR from "swr";
import { HiOutlineCheck, HiOutlineExclamation } from "react-icons/hi";
import { Button, Label, Spinner, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";

import {
  getOrgMembershipsApiPath,
  organizationsIdOrSlugApiPath,
} from "lib/fe/api-paths";
import { createFetcher, get, patch, ResponseWithHeaders } from "lib/fe/api";
import { TokenUser } from "lib/types/core/token-user";
import { renderErrors } from "lib/fe/components/generic-error";
import { OrgMembershipResponse } from "lib/types/api/org-membership.response";
import { FrontendRoutes } from "lib/fe/routes";
import useDebounce from "lib/fe/hooks/use-debounce";
import { FetchError } from "lib/fe/types/fetch-error";
import { slugFrom } from "lib/core/slug-utils";
import { OrganizationUpdateRequest } from "lib/types/api/organization-update.request";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import { isAdmin } from "lib/fe/permission-utils";
import useToasts from "lib/fe/hooks/use-toasts";

import { OrganizationResponse, Id, isEmpty } from "@repo/core";

type SlugAvailability = "available" | "unavailable" | "unknown" | "loading";

const OrgGeneralSettings = ({ orgSlug }: { orgSlug: string }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [organizationName, setOrganizationName] = useState("");
  const [isOrgAdmin, setIsOrgAdmin] = useState<boolean>(false);
  const [slugAvailability, setSlugAvailability] =
    useState<SlugAvailability>("unknown");
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const debouncedOrganizationName = useDebounce(organizationName, 1000);
  const [toasts, addToast] = useToasts();

  // Fetch organization
  const { data: fetchOrganizationResponse, error: fetchOrganizationError } =
    useSWR(
      organizationsIdOrSlugApiPath(orgSlug),
      createFetcher<OrganizationResponse>(),
    );

  // Fetch current user's membership to organization
  const shouldFetchOrgMembership = fetchOrganizationResponse !== undefined;
  const { data: fetchOrgMembershipResponse, error: fetchOrgMembershipError } =
    useSWR(
      shouldFetchOrgMembership
        ? getOrgMembershipsApiPath(
            Id.from(fetchOrganizationResponse.response.id),
            { userId: (session!.user as TokenUser).id },
          )
        : null,
      createFetcher<OrgMembershipResponse[]>(),
    );

  useEffect(() => {
    if (!fetchOrganizationResponse) {
      return;
    }

    setOrganizationName(fetchOrganizationResponse.response.name);
  }, [fetchOrganizationResponse]);

  useEffect(() => {
    if (!fetchOrgMembershipResponse) {
      return;
    }

    setIsOrgAdmin(isAdmin(fetchOrgMembershipResponse.response));
  }, [fetchOrgMembershipResponse]);

  useEffect(() => {
    const newSlug = slugFrom(debouncedOrganizationName);

    if (
      !fetchOrganizationResponse ||
      isEmpty(newSlug) ||
      newSlug === fetchOrganizationResponse.response.slug
    ) {
      // no need to look it up
      setSlugAvailability("unknown");
      return;
    }

    // Look up organization by slug
    setSlugAvailability("loading");
    // TODO(TECH-DEBT): Use SWR here instead of direct get()
    get<OrganizationResponse>(organizationsIdOrSlugApiPath(newSlug))
      .then(({ response: organization }) => {
        // there is an org with that slug -- it's unavailable!
        setSlugAvailability("unavailable");
      })
      .catch((e) => {
        const fetchError = e as FetchError;
        if (fetchError.status === 404) {
          // no org with that slug -- it's available!
          setSlugAvailability("available");
        } else {
          setSlugAvailability("unknown");
        }
      });
  }, [debouncedOrganizationName]);

  if (fetchOrganizationError || fetchOrgMembershipError) {
    return renderErrors(fetchOrganizationError, fetchOrgMembershipError);
  }

  return (
    <div className={tw("px-4")}>
      <StudioToasts toasts={toasts} />
      <form
        className={tw("flex max-w-md flex-col gap-4")}
        onSubmit={(e) => {
          e.preventDefault();
          setIsFormSubmitting(true);
          updateOrganization(fetchOrganizationResponse!.response.id, {
            name: organizationName,
            slug: slugFrom(organizationName),
          })
            .then(({ response: updatedOrganization }) => {
              addToast({
                type: "success",
                children: (
                  <p>
                    Successfully updated organization name from{" "}
                    <span className={tw("italic")}>
                      {fetchOrganizationResponse?.response.name}
                    </span>{" "}
                    to{" "}
                    <span className={tw("italic")}>
                      {updatedOrganization?.name}
                    </span>
                    .
                  </p>
                ),
              });

              router.push(
                `${FrontendRoutes.getOrgSettingsRoute(
                  updatedOrganization!.slug,
                )}?tab=general`,
              );
            })
            .catch((e) => {
              addToast({
                type: "failure",
                children: (
                  <p>
                    Something went wrong while trying to update{" "}
                    <span className={tw("italic")}>
                      {fetchOrganizationResponse?.response.name}
                    </span>
                    . Please try again later.
                  </p>
                ),
              });
            })
            .finally(() => {
              setIsFormSubmitting(false);
            });
        }}
      >
        <div>
          <div className={tw("mb-2 block")}>
            <Label htmlFor="org-name" value="Organization Name" />
          </div>
          <TextInput
            id="org-name"
            placeholder="name of the organization"
            required
            type="text"
            value={organizationName}
            onChange={(event) => {
              setOrganizationName(event.target.value);
              setSlugAvailability("loading");
            }}
            disabled={!isOrgAdmin}
          />
        </div>
        <div>
          <div className={tw("mb-2 block")}>
            <Label htmlFor="org-url" value="Organization URL" />
          </div>
          <TextInput
            id="org-url"
            required
            type="text"
            value={getOrgUrl(slugFrom(organizationName))}
            disabled
            helperText={renderSlugAvailability(
              organizationName,
              slugAvailability,
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={slugAvailability !== "available" || !isOrgAdmin}
          isProcessing={isFormSubmitting}
        >
          Submit
        </Button>
      </form>
    </div>
  );
};

export default OrgGeneralSettings;

const getOrgUrl = (orgSlug: string) =>
  `${
    typeof window === "object" ? window.location.origin : ""
  }${FrontendRoutes.getOrgHomeRoute(orgSlug)}`;

const renderSlugAvailability = (
  orgName: string,
  availability: SlugAvailability,
) => {
  switch (availability) {
    case "unknown":
      return null;
    case "loading":
      return <Spinner size="xs" />;
    case "available":
      return (
        <span className={tw("text-green-700")}>
          <HiOutlineCheck className={tw("w-5 h-5 inline")} /> Available
        </span>
      );
    case "unavailable":
      return (
        <span className={tw("text-red-700")}>
          <HiOutlineExclamation className={tw("w-5 h-5 inline")} /> Unavailable.
          The name "{orgName}" is taken by another organization. Please use a
          different name.
        </span>
      );
  }
};

const updateOrganization = async (
  orgId: string,
  req: OrganizationUpdateRequest,
): Promise<ResponseWithHeaders<OrganizationResponse>> => {
  return await patch<OrganizationUpdateRequest, OrganizationResponse>(
    organizationsIdOrSlugApiPath(orgId),
    req,
  );
};
