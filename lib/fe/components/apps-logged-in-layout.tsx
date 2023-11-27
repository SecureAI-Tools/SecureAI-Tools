"use client";

import { useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { FrontendRoutes } from "lib/fe/routes";
import styles from "lib/../styles/Home.module.css";

// LoggedInLayout but for apps directory
const AppsLoggedInLayout = ({
  children,
  onAuthenticated,
}: {
  children: React.ReactNode;
  onAuthenticated?: () => void;
}) => {
  const { data: session, status } = useSession();

  const router = useRouter();
  if (status === "unauthenticated") {
    // User is NOT logged in; Take them to the log in page
    router.push(FrontendRoutes.LOG_IN);
    return <p>Redirecting to log in page</p>;
  }

  useEffect(() => {
    if (status === "authenticated") {
      onAuthenticated?.();
    }
  }, [status]);

  return (
    <>
      {status === "loading" ? (
        <div className={styles.main}>
          <div className={styles.container}>
            <Spinner size="xl" />
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
};

export default AppsLoggedInLayout;
