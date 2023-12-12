import type { GetServerSideProps, NextPage } from "next";
import { getToken } from "next-auth/jwt";

import { Layout } from "lib/fe/components/layout";
import { FrontendRoutes } from "lib/fe/routes";

const IndexPage: NextPage = () => {
  return <Layout>Loading...</Layout>;
};
export default IndexPage;

export const getServerSideProps: GetServerSideProps = async (
  context,
): Promise<any> => {
  const token = await getToken({ req: context.req });

  if (token != null) {
    // Logged in -- redirect to app-home
    return {
      redirect: {
        permanent: false,
        destination: FrontendRoutes.APP_HOME,
      },
      props: {},
    };
  }

  return {
    redirect: {
      permanent: false,
      destination: FrontendRoutes.LOG_IN,
    },
    props: {},
  };
};
