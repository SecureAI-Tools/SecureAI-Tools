"use client";

import { useRouter } from "next/navigation";
import { tw } from "twind";
import { useEffect, useState } from "react";
import { Badge, Button, TextInput } from "flowbite-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { get, patch, ResponseWithHeaders } from "lib/fe/api";
import {
  organizationsIdOrSlugApiPath,
  getOrgMembershipsApiPath,
  orgMembershipApiPath,
} from "lib/fe/api-paths";
import { FE } from "lib/fe/route-utils";
import { OrgMembershipResponse } from "lib/types/api/org-membership.response";
import { RenderCellsFn, Table } from "lib/fe/components/table";
import { FrontendRoutes } from "lib/fe/routes";
import { numberOfPages } from "lib/core/pagination-utils";
import useDebounce from "lib/fe/hooks/use-debounce";
import useTableState, {
  SEARCH_PARAM,
  PAGE_PARAM,
} from "lib/fe/hooks/use-table-state";
import { TokenUser } from "lib/types/core/token-user";
import { ActionMenu } from "lib/fe/components/action-menu";
import { OrgMembershipUpdateRequest } from "lib/types/api/org-membership-update.request";
import { Toasts } from "lib/fe/components/toasts";
import { isAdmin } from "lib/fe/permission-utils";
import useToasts from "lib/fe/hooks/use-toasts";
import { OrgMembershipRole } from "lib/types/core/org-membership-role";
import { OrgMembershipStatus } from "lib/types/core/org-membership-status";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { PageTitle } from "lib/fe/components/page-title";

import {
  Id,
  OrganizationResponse,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_STARTING_PAGE_NUMBER,
  UserResponse,
} from "@repo/core";

const pageSize = PAGINATION_DEFAULT_PAGE_SIZE;
const orgSlugParam = "orgSlug";

const getOrganization = async (slug: string): Promise<OrganizationResponse> => {
  // TODO(TECH-DEBT): Use SWR here instead of direct get()
  return (await get<OrganizationResponse>(organizationsIdOrSlugApiPath(slug)))
    .response;
};

const getOrgMemberships = async (
  orgId: Id<OrganizationResponse>,
  page: number,
  search?: string,
  userId?: string,
): Promise<ResponseWithHeaders<OrgMembershipResponse[]>> => {
  // TODO(TECH-DEBT): Use SWR here instead of direct get()
  return await get<OrgMembershipResponse[]>(
    getOrgMembershipsApiPath(orgId, {
      orderingParams: {
        orderBy: "createdAt",
        order: "asc",
      },
      paginationParams: {
        page: page,
        pageSize: pageSize,
      },
      nameOrEmailLike: search,
      userId: userId,
    }),
  );
};

const updateMembership = async (
  membershipId: Id<OrgMembershipResponse>,
  req: OrgMembershipUpdateRequest,
): Promise<OrgMembershipResponse> => {
  return (
    await patch<OrgMembershipUpdateRequest, OrgMembershipResponse>(
      orgMembershipApiPath(membershipId),
      req,
    )
  ).response;
};

export const OrganizationUsersPage = ({
  params,
}: {
  params: { orgSlug: string };
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const [organization, setOrganization] = useState<
    OrganizationResponse | undefined
  >(undefined);
  const [orgMemberships, setOrgMemberships] = useState<
    OrgMembershipResponse[] | undefined
  >(undefined);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [tableState, setTableState] = useTableState();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQueryInput, setSearchQueryInput] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQueryInput);
  const [isOrgAdmin, setIsOrgAdmin] = useState<boolean>(false);
  const [toasts, addToast] = useToasts();

  const { orgSlug } = params;

  useEffect(() => {
    if (!orgSlug || sessionStatus !== "authenticated") {
      // not ready yet!
      return;
    }

    // Get organization
    getOrganization(orgSlug)
      .then((org) => {
        setOrganization(org);

        getCurrentUsersMembership(Id.from(org.id));
      })
      .catch((e) => console.log("error", e));

    setSearchQueryInput(searchParams?.get(SEARCH_PARAM) ?? "");
  }, [searchParams, sessionStatus]);

  useEffect(() => {
    if (tableState.filter.searchQuery == debouncedSearchQuery) {
      return;
    }

    setTableState((old) => ({
      ...old,
      filter: {
        searchQuery: debouncedSearchQuery,
      },
    }));
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (!orgSlug || !organization) {
      // not ready yet!
      return;
    }

    fetchCurrentPage();
    FE.updateSearchParams({
      params: {
        [PAGE_PARAM]: tableState.pagination.currentPage.toString(),
        [SEARCH_PARAM]: tableState.filter.searchQuery,
      },
      ignoreKeys: [orgSlugParam],
      router,
      searchParams,
      pathname,
    });
  }, [tableState, organization]);

  const getCurrentUsersMembership = (orgId: Id<OrganizationResponse>) => {
    if (!session) {
      return;
    }
    const currentUserId = (session.user as TokenUser).id;
    getOrgMemberships(
      orgId,
      /* page */ PAGINATION_STARTING_PAGE_NUMBER,
      /* search */ undefined,
      currentUserId,
    ).then(({ response: memberships }) => {
      setIsOrgAdmin(isAdmin(memberships));
    });
  };

  const fetchCurrentPage = () => {
    fetchOrgMembershipPage(
      Id.from(organization!.id),
      tableState.filter.searchQuery,
      tableState.pagination.currentPage,
    );
  };

  const fetchOrgMembershipPage = (
    orgId: Id<OrganizationResponse>,
    search: string,
    page: number,
  ) => {
    setIsTableLoading(true);

    getOrgMemberships(orgId, page, search)
      .then((responseWithHeaders) => {
        if (responseWithHeaders.headers.pagination?.totalCount) {
          setTotalCount(responseWithHeaders.headers.pagination.totalCount);
        }
        setOrgMemberships(responseWithHeaders.response);
        setIsTableLoading(false);
      })
      .catch((e) => {
        console.log("error", e);
        setIsTableLoading(false);
      });
  };

  const onPageChange = (newPage: number) => {
    setTableState((old) => ({
      ...old,
      pagination: {
        currentPage: newPage,
      },
    }));
  };

  const renderCells: RenderCellsFn<OrgMembershipResponse> = ({ item }) => [
    <div
      className={tw(
        "flex items-center text-gray-900 whitespace-nowrap dark:text-white",
      )}
    >
      <div>
        <div className={tw("flex flex-row")}>
          <div className={tw("text-base font-semibold")}>
            {fullName(item.user)}
          </div>
          {item.role === OrgMembershipRole.ADMIN ? (
            <Badge color="info" className={tw("ml-2")}>
              Admin
            </Badge>
          ) : null}
        </div>
        <div className={tw("font-normal text-gray-500")}>
          {item.user?.email ?? ""}
        </div>
      </div>
    </div>,
    <div>
      <div className={tw("flex items-center")}>
        <div
          className={tw(
            "h-2.5 w-2.5 rounded-full mr-2 border-2",
            getStatusBadgeColor(item.status),
          )}
        ></div>
        {getReadableStatus(item.status)}
      </div>
    </div>,
    <div>
      <ActionMenu
        actions={[
          {
            label:
              item.role === OrgMembershipRole.USER
                ? "Make Admin"
                : "Remove Admin",
            onClick: () => {
              updateMembership(Id.from(item.id), {
                role:
                  item.role === OrgMembershipRole.USER
                    ? OrgMembershipRole.ADMIN
                    : OrgMembershipRole.USER,
              })
                .then((_) => {
                  addToast({
                    type: "success",
                    children: (
                      <p>Successfully updated {fullName(item.user)}'s role</p>
                    ),
                  });

                  // Refetch current page to relfect updated values!
                  fetchCurrentPage();
                })
                .catch((e) => {
                  console.log(
                    "something went wrong while trying to update role!",
                    e,
                  );
                  addToast({
                    type: "failure",
                    children: (
                      <p>Something went wrong! Please try again later</p>
                    ),
                  });
                });
            },
            disabled: !isOrgAdmin,
          },
          {
            label:
              item.status === OrgMembershipStatus.ACTIVE
                ? "Deactivate"
                : "Reactivate",
            onClick: () => {
              updateMembership(Id.from(item.id), {
                status:
                  item.status === OrgMembershipStatus.ACTIVE
                    ? OrgMembershipStatus.INACTIVE
                    : OrgMembershipStatus.ACTIVE,
              })
                .then((_) => {
                  addToast({
                    type: "success",
                    children: (
                      <p>Successfully updated {fullName(item.user)}'s status</p>
                    ),
                  });

                  // Refetch current page to relfect updated values!
                  fetchCurrentPage();
                })
                .catch((e) => {
                  console.log(
                    "something went wrong while trying to update status!",
                    e,
                  );
                  addToast({
                    type: "failure",
                    children: (
                      <p>Something went wrong! Please try again later</p>
                    ),
                  });
                });
            },
            disabled: !isOrgAdmin,
          },
        ]}
        key={`${item.id}.actions`}
      />
    </div>,
  ];

  return (
    <AppsLoggedInLayout>
      <div className={tw("items-center justify-center w-full p-8")}>
        <Toasts toasts={toasts} />
        <div className={tw("flow-root w-full align-middle")}>
          <div className={tw("float-left h-full align-middle")}>
            <PageTitle>
              {organization ? `Users of ${organization!.name}` : ""}
            </PageTitle>
          </div>
          {isOrgAdmin ? (
            <div className={tw("float-right")}>
              <Button
                color="gray"
                pill
                href={FrontendRoutes.getOrgAddUsersRoute(orgSlug)}
              >
                Add Users
              </Button>
            </div>
          ) : null}
        </div>

        <div className={tw("mt-2")}>
          <div className={tw("max-w-md mb-4")}>
            <TextInput
              id="search"
              placeholder="Search users by name or email"
              value={searchQueryInput}
              onChange={(event) => {
                setSearchQueryInput(event.target.value);
              }}
              className={tw("mb-2")}
            />
          </div>
          <Table
            loading={isTableLoading}
            data={orgMemberships}
            columns={["Name", "Status", "Actions"]}
            renderCells={renderCells}
            page={tableState.pagination.currentPage}
            totalPages={numberOfPages(totalCount, pageSize)}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

const getStatusBadgeColor = (status: OrgMembershipStatus): string => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500 border-green-500";
    case "INACTIVE":
      return "bg-transparent border-gray-400";
    default:
      return "";
  }
};

const getReadableStatus = (status: OrgMembershipStatus): string => {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "INACTIVE":
      return "Inactive";
    default:
      return "-";
  }
};

const fullName = (user: UserResponse | undefined): string =>
  user ? `${user.firstName} ${user.lastName}` : "";
