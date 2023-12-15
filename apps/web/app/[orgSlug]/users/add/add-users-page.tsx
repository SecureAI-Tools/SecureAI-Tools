"use client";

import { useRouter } from "next/navigation";
import { tw } from "twind";
import { useEffect, useState } from "react";
import { Alert } from "flowbite-react";
import { HiInformationCircle } from "react-icons/hi";
import Papa from "papaparse";
import Link from "next/link";

import { get, post } from "lib/fe/api";
import {
  organizationsIdOrSlugApiPath,
  postOrgMembershipsApiPath,
} from "lib/fe/api-paths";
import { OrgMembershipResponse } from "lib/types/api/org-membership.response";
import { FilesUpload } from "lib/fe/components/files-upload";
import { AddUsersRequest } from "lib/types/api/add-users.request";
import { FrontendRoutes } from "lib/fe/routes";
import { SuccessModal } from "lib/fe/components/success-modal";
import {
  OrgMembershipRole,
  toOrgMembershipRole,
} from "lib/types/core/org-membership-role";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";

import { MAX_ADD_USERS_CSV_ROWS } from "@repo/core/constants";
import { Id } from "@repo/core/src/types/id";
import { OrganizationResponse } from "@repo/core/src/types/organization.response";
import { isEmpty } from "@repo/core/src/utils/string-utils";

const getOrganization = async (slug: string): Promise<OrganizationResponse> => {
  // TODO(TECH-DEBT): Use SWR here instead of direct get()
  return (await get<OrganizationResponse>(organizationsIdOrSlugApiPath(slug)))
    .response;
};

const postMemberships = async (
  orgId: Id<OrganizationResponse>,
  inputs: UserInput[],
): Promise<OrgMembershipResponse[]> => {
  return (
    await post<AddUsersRequest, OrgMembershipResponse[]>(
      postOrgMembershipsApiPath(orgId),
      toAddUsersRequest(inputs),
    )
  ).response;
};

export const OrgAddUsersPage = ({
  params,
}: {
  params: { orgSlug: string };
}) => {
  const router = useRouter();
  const [organization, setOrganization] = useState<
    OrganizationResponse | undefined
  >(undefined);
  const [errorText, setErrorText] = useState<string | undefined>(undefined);
  const [isAddingUsers, setIsAddingUsers] = useState<boolean>(false);
  const [hasAddedUsers, setHasAddedUsers] = useState<boolean>(false);

  const { orgSlug } = params;

  useEffect(() => {
    if (!orgSlug) {
      // not ready yet!
      return;
    }

    getOrganization(orgSlug)
      .then((org) => {
        setOrganization(org);
      })
      .catch((e) => console.log("error", e));
  }, [router]);

  const handleFilesSelected = (files: File[]) => {
    if (files.length < 1) {
      console.log("eh! got no files");
      return;
    }

    setIsAddingUsers(true);

    const file = files[0];
    Papa.parse(file!, {
      header: true,
      complete: function (results) {
        if (results.data.length > MAX_ADD_USERS_CSV_ROWS) {
          setErrorText(
            `Please limit number of rows to ${MAX_ADD_USERS_CSV_ROWS}`,
          );
          setIsAddingUsers(false);
          return;
        }

        const userInputs = toUserInputs(
          results.data as { [index: string]: string }[],
        );
        const invalidUserInputs = userInputs.filter(
          (ui) =>
            isEmpty(ui.email) ||
            isEmpty(ui.firstName) ||
            isEmpty(ui.lastName) ||
            !ui.role,
        );
        if (invalidUserInputs.length > 0) {
          setIsAddingUsers(false);
          setErrorText(
            `Found ${invalidUserInputs.length} invalid rows. Please fix invalid inputs and try again`,
          );
          console.log("invalid inputs = ", invalidUserInputs);
          return;
        }

        postMemberships(Id.from(organization!.id), userInputs)
          .then((createdOrgMemberships) => {
            console.log("createdOrgMemberships = ", createdOrgMemberships);
            setIsAddingUsers(false);
            setHasAddedUsers(true);
          })
          .catch((e) => {
            setIsAddingUsers(false);
            console.log("something went wrong while adding users", e);
          });
      },
    });
  };

  const renderFileUploader = () => (
    <div>
      <h1 className={tw("flex items-center justify-center text-2xl")}>
        {organization ? `Add users to ${organization!.name}` : ""}
      </h1>
      <div>
        <div className={tw("flex justify-center text-sm mt-2")}>
          Create a spreadsheet of new users (
          <Link
            href="https://docs.google.com/spreadsheets/d/12Xyu8HLB9TJFlY7Ec8wNVyovQI1JurdbhqfwHZArNgA/edit"
            target="_blank"
            className={tw("underline")}
          >
            sample sheet
          </Link>
          ), and upload the CSV file below.
        </div>
        <div>
          {errorText ? (
            <Alert
              color="failure"
              icon={HiInformationCircle}
              className={tw("mt-2")}
              onDismiss={() => setErrorText(undefined)}
            >
              {errorText}
            </Alert>
          ) : null}
          <div
            className={tw(
              "mt-4 flex items-center justify-center h-80 xl:w-[1024px] lg:w-[800px] md:w-[400px]",
            )}
          >
            <FilesUpload
              cta={
                <p>
                  <span className={tw("font-semibold")}>Click to upload</span>
                </p>
              }
              help={`Select CSV (max ${MAX_ADD_USERS_CSV_ROWS} rows)`}
              onFilesSelected={handleFilesSelected}
              accept=".csv"
              onClick={() => {
                setErrorText(undefined);
              }}
              disabled={!organization || isAddingUsers}
              spinner={isAddingUsers}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessModal = () => (
    <SuccessModal
      show={hasAddedUsers}
      dismissible={false}
      msg={<p>Successfully added users to {organization?.name}.</p>}
      onButtonClick={() => {
        router.push(FrontendRoutes.getOrgUsersRoute(organization!.slug));
      }}
    />
  );

  return (
    <AppsLoggedInLayout>
      <div className={tw("items-center justify-center p-8")}>
        <div
          className={tw("flex p-2 align-middle items-center justify-center")}
        >
          <div className={tw("max-w-5xl m-2")}>
            {renderFileUploader()}
            {renderSuccessModal()}
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

interface UserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: OrgMembershipRole;
}

const toUserInputs = (data: { [index: string]: string }[]): UserInput[] => {
  return data.map((d) => {
    const ui: UserInput = {};
    for (const key in d) {
      const normalizedKey = normalizeKey(key);
      const val = d[key];
      switch (normalizedKey) {
        case "first name":
          ui.firstName = val;
          break;
        case "last name":
          ui.lastName = val;
          break;
        case "email":
          ui.email = val;
          break;
        case "password":
          ui.password = val;
          break;
        case "role":
          ui.role = toOrgMembershipRole(val!.toUpperCase());
          break;
      }
    }

    return ui;
  });
};

const normalizeKey = (key: string): string =>
  key
    .toLowerCase()
    .split("(")[0]!
    .replace(/(\r\n|\n|\r)/gm, "");

const toAddUsersRequest = (inputs: UserInput[]): AddUsersRequest => ({
  users: inputs.map((i) => ({
    email: i.email!,
    password: i.password!,
    firstName: i.firstName!,
    lastName: i.lastName!,
    role: i.role!,
  })),
});
