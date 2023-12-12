import { useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import { useSession } from "next-auth/react";

import { FrontendRoutes } from "lib/fe/routes";
import styles from "lib/../styles/Home.module.css";
import { Layout } from "lib/fe/components/layout";
import { PUBLIC_FACING_NAME } from "lib/core/constants";

// TODO: Remove this once everything has moved to using apps dir routing!
const LoggedInLayout = ({
  children,
  title = PUBLIC_FACING_NAME,
  description = PUBLIC_FACING_NAME,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) => {
  const { data: session, status } = useSession();

  const router = useRouter();
  if (status === "unauthenticated") {
    // User is NOT logged in; Take them to the log in page
    router.push(FrontendRoutes.LOG_IN);
    return <p>Redirecting to log in page</p>;
  }

  return (
    <Layout title={title} description={description}>
      {status === "loading" ? (
        <div className={styles.main}>
          <div className={styles.container}>
            <Spinner size="xl" />
          </div>
        </div>
      ) : (
        children
      )}
    </Layout>
  );
};

export default LoggedInLayout;
