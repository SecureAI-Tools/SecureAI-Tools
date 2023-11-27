import { Alert, Button, Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import { tw } from "twind";
import { HiOutlineExclamation } from "react-icons/hi";

export const GenericError = ({ errors }: { errors: unknown[] }) => {
  const router = useRouter();

  console.log("errors: ", errors);

  // TODO: Provide a way to easily copy paste `error` object into clipboard so the debugging info can be shared!
  //       or even provide a way to file a bug report?

  return (
    <Modal show={true} dismissible={false}>
      <Modal.Body>
        <div className={tw("relative p-4 sm:p-5")}>
          <Alert
            color="failure"
            icon={HiOutlineExclamation}
            className={tw("p-8 max-w-2xl")}
          >
            <div className={tw("p-3")}>
              <h1 className={tw("text-lg font-bold mb-3")}>
                Something went wrong!
              </h1>
              <div>
                Something went wrong while trying to load data. Please refresh
                your page to try again; If the problem still persists, please
                contact your organization administrator.
              </div>
            </div>
          </Alert>
          <div className={tw("mt-3")}>
            <Button onClick={() => router.refresh()}>Reload</Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

// Renders errors if any. Returns undefined if no errors to render
export const renderErrors = (...errors: unknown[]): JSX.Element | undefined => {
  const firstRealError = errors.find((e) => e);
  return firstRealError ? <GenericError errors={errors} /> : undefined;
};
