import type {
  GetServerSideProps,
  GetServerSidePropsResult,
  NextPage,
} from "next";
import { Alert, Card } from "flowbite-react";
import { tw } from "twind";
import { HiOutlineExclamation } from "react-icons/hi";
import { useSession } from "next-auth/react";

import LoggedInLayout from "lib/fe/components/logged-in-layout";
import { FrontendRoutes } from "lib/fe/routes";
import { isAuthenticatedWithRedirect } from "lib/ssr/auth";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { PageTitle } from "lib/fe/components/page-title";
import { OrgMembershipStatus } from "lib/types/core/org-membership-status";

import { OrganizationResponse } from "@repo/core";

interface Props {
  organizations: OrganizationResponse[];
}

const AppHomePage: NextPage<Props> = ({ organizations }: Props) => {
  const { data: session, status } = useSession();

  const renderOrganizationSelector = () => (
    <>
      <PageTitle title="Select organization" />
      {organizations.map((org) => (
        <Card
          className={tw("max-w-sm w-96 mt-4")}
          href={FrontendRoutes.getOrgHomeRoute(org.slug)}
          key={org.id}
        >
          {/* TODO: Show organization logos if/when the system supports them! */}
          <h5
            className={tw(
              "text-2xl font-bold tracking-tight text-gray-900 dark:text-white",
            )}
          >
            <p>{org.name}</p>
          </h5>
        </Card>
      ))}
    </>
  );

  const renderNoOrganizationMessage = () => (
    <Alert
      color="failure"
      icon={HiOutlineExclamation}
      className={tw("p-8 max-w-2xl")}
    >
      <div className={tw("p-3")}>
        <h1 className={tw("text-lg font-bold mb-3")}>No organizations!</h1>
        <div>
          Your account ({session?.user?.email}) is not a member of any
          organizations. Please contact your organization administrator and ask
          them to add you to the organization or activate your membership.
        </div>
      </div>
    </Alert>
  );

  return (
    <LoggedInLayout>
      <div
        className={tw("flex flex-col items-center justify-center w-full p-8")}
      >
        {organizations.length > 0
          ? renderOrganizationSelector()
          : renderNoOrganizationMessage()}
      </div>
    </LoggedInLayout>
  );
};

export default AppHomePage;

export const getServerSideProps: GetServerSideProps = async (
  context,
): Promise<GetServerSidePropsResult<Props>> => {
  const [unauthenticatedResponse, userId] =
    await isAuthenticatedWithRedirect<Props>(context);
  if (unauthenticatedResponse) {
    return unauthenticatedResponse;
  }

  // Find all organizations that current use has access to
  const orgMembershipService = new OrgMembershipService();

  const orgMemberships = await orgMembershipService.getAllIncludingOrganization(
    {
      where: {
        userId: userId!.toString(),
        status: OrgMembershipStatus.ACTIVE,
      },
      orderBy: {
        org: {
          name: "asc",
        },
      },
    },
  );

  if (orgMemberships.length === 1) {
    // User has access to only one organization. Case for almost all self-managed deployments
    return {
      redirect: {
        permanent: false,
        destination: FrontendRoutes.getOrgHomeRoute(orgMemberships[0]!.org.slug),
      },
    };
  }

  return {
    props: {
      organizations: orgMemberships.map((om) =>
        OrganizationResponse.fromEntity(om.org),
      ),
    },
  };
};
