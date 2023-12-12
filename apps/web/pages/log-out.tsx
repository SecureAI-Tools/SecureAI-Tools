import { useEffect } from "react";
import { NextPage } from "next";
import { Spinner } from "flowbite-react";
import { signOut } from "next-auth/react";

import { Layout } from "lib/fe/components/layout";
import { FrontendRoutes } from "lib/fe/routes";
import { Analytics } from "lib/fe/analytics";

const LogOutPage: NextPage = () => {
  useEffect(() => {
    Analytics.reset({
      callback: () => {
        signOut({ callbackUrl: FrontendRoutes.LOG_OUT_SUCCESS });
      },
    });
  }, []);

  return (
    <Layout title="Log Out" description="Log out">
      <Spinner />
      <h6>Logging you out. Hang tight...</h6>
    </Layout>
  );
};

export default LogOutPage;
