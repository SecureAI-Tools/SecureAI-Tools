import type { GetServerSideProps, NextPage } from "next";
import { getToken } from "next-auth/jwt";
import { tw } from "twind";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Alert, Button, Label, TextInput } from "flowbite-react";
import Image from "next/image";
import { HiOutlineExclamation } from "react-icons/hi";

import Navigation from "lib/fe/components/navigation";
import { Layout } from "lib/fe/components/layout";
import { FrontendRoutes } from "lib/fe/routes";
import { LogInErrorCodes } from "lib/core/auth";
import { FE } from "lib/fe/route-utils";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import useToasts from "lib/fe/hooks/use-toasts";
import { getFirst } from "@repo/core/src/utils/string-utils";

const LogInPage: NextPage = () => {
  const router = useRouter();
  const [inputEmail, setInputEmail] = useState<string>("");
  const [inputPassword, setInputPassword] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, addToast] = useToasts();

  useEffect(() => {
    const emailParam = getFirst(router.query["email"]);
    if (emailParam) {
      setInputEmail(emailParam);
    }

    // AuthJS error code -- https://next-auth.js.org/configuration/pages#sign-in-page
    const errorCodeParam = getFirst(router.query["error"]);
    if (errorCodeParam) {
      setErrorCode(errorCodeParam);
    }

    if (FE.hasQueryParam(router, "logged-out")) {
      setHasLoggedOut(true);
    }
  }, [router.isReady]);

  useEffect(() => {
    if (hasLoggedOut) {
      addToast({
        type: "success",
        children: <p>Successfully logged out</p>,
      });
    }
  }, [hasLoggedOut]);

  return (
    <Layout>
      <Navigation />

      <StudioToasts toasts={toasts} />

      <div className={tw("max-w-xl mx-auto mt-32 py-16 px-14 sm:px-6 lg:px-8")}>
        <div className={tw("flex flex-cols")}>
          <div className={tw("flex items-center mr-5")}>
            <Image
              className={tw("h-20 w-20 mx-auto")}
              src="/logo.png"
              alt="logo"
              width={80}
              height={80}
            />
          </div>
          <div
            className={tw(
              "min-h-[1em] w-px self-stretch bg-gradient-to-tr from-transparent via-gray-500 to-transparent opacity-60 dark:opacity-100",
            )}
          >
            {/* vertical bar separator */}
          </div>
          <div className={tw("ml-5")}>
            <h1 className={tw("text-2xl font-semibold")}>
              Log in to your account
            </h1>
            {errorCode && <LogInError errorCode={errorCode} />}
            <form
              className={tw("flex max-w-md flex-col gap-4 mt-8")}
              onSubmit={(e) => {
                e.preventDefault();

                setIsSubmitting(true);

                signIn("credentials", {
                  username: inputEmail,
                  password: inputPassword,
                  callbackUrl: FrontendRoutes.POST_LOG_IN,
                }).finally(() => {
                  setIsSubmitting(false);
                });
              }}
            >
              <div>
                <div className={tw("mb-2 block")}>
                  <Label htmlFor="email" value="Your email" />
                  <TextInput
                    id="email"
                    placeholder="bruce@wayne-enterprises.com"
                    required
                    type="email"
                    autoComplete="email"
                    className={tw("mb-4")}
                    value={inputEmail}
                    onChange={(e) => {
                      setInputEmail(e.target.value);
                    }}
                  />
                </div>
                <div className={tw("mb-2 block")}>
                  <Label htmlFor="password" value="Password" />
                  <TextInput
                    id="password"
                    required
                    type="password"
                    className={tw("mb-4")}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                    }}
                  />
                </div>
                <div className={tw("flex items-center mt-2")}>
                  <Button
                    type="submit"
                    className={tw("w-full")}
                    isProcessing={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Log In
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default LogInPage;

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

  // Not logged in -- continue with the IndexPage.
  return {
    props: {},
  };
};

const LogInError = ({ errorCode }: { errorCode: string }) => {
  return (
    <div className={tw("mt-8")}>
      <Alert color="failure" icon={HiOutlineExclamation}>
        {errorCode === LogInErrorCodes.CREDENTIALS_SIGNIN ? (
          <>
            <div className="font-medium">Invalid credentials!</div>
          </>
        ) : (
          <>
            <div className="font-medium">Encountered an error!</div>
            Something went wrong. Please try again.
          </>
        )}
      </Alert>
    </div>
  );
};
