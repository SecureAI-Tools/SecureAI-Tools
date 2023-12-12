"use client";

import { Button, Label, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { tw } from "twind";
import { HiOutlineExclamation } from "react-icons/hi";
import { StatusCodes } from "http-status-codes";
import { useSession } from "next-auth/react";

import { isEmpty } from "lib/core/string-utils";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import useToasts from "lib/fe/hooks/use-toasts";
import { PasswordUpdateRequest } from "lib/types/api/password-update.request";
import { ResponseWithHeaders, patch } from "lib/fe/api";
import { UserResponse } from "lib/types/api/user.response";
import { userPasswordApiPath } from "lib/fe/api-paths";
import { Id } from "lib/types/core/id";
import { TokenUser } from "lib/types/core/token-user";
import { FetchError } from "lib/fe/types/fetch-error";
import { PageTitle } from "./page-title";

export const ResetPassword = ({
  onResetPasswordSuccess,
}: {
  onResetPasswordSuccess?: () => void;
}) => {
  const { data: session, status: sessionStatus } = useSession();
  const [userId, setUserId] = useState<Id<UserResponse> | undefined>();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [toasts, addToast] = useToasts();

  useEffect(() => {
    if (sessionStatus === "authenticated" && session) {
      const tokenUser = session.user as TokenUser;
      setUserId(Id.from(tokenUser.id));
    }
  }, [session, sessionStatus]);

  return (
    <div className={tw("p-8")}>
      <StudioToasts toasts={toasts} />
      <div className={tw("flex flex-col")}>
        <div>
          <PageTitle title={"Change password"} />
          <form
            className={tw("flex max-w-md flex-col gap-4 mt-4")}
            onSubmit={(e) => {
              e.preventDefault();
              setIsFormSubmitting(true);
              updatePassword(userId!, {
                oldPassword: oldPassword,
                newPassword: newPassword,
              })
                .then((response) => {
                  addToast({
                    type: "success",
                    children: <p>Successfully updated password.</p>,
                  });

                  // Reset state!
                  setOldPassword("");
                  setNewPassword("");
                  setNewPasswordConfirm("");

                  onResetPasswordSuccess?.();
                })
                .catch((e) => {
                  if (e instanceof FetchError) {
                    const fetchError = e as FetchError;
                    if (fetchError.status === StatusCodes.BAD_REQUEST) {
                      addToast({
                        type: "failure",
                        children: <p>Invalid old password.</p>,
                      });
                      return;
                    }
                  }

                  addToast({
                    type: "failure",
                    children: (
                      <p>
                        Something went wrong while trying to update password.
                        Please try again later.
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
                <Label htmlFor="old-password" value="Old password" />
              </div>
              <TextInput
                id="old-password"
                required
                type="password"
                value={oldPassword}
                onChange={(event) => {
                  setOldPassword(event.target.value);
                }}
              />
            </div>
            <div>
              <div className={tw("mb-2 block")}>
                <Label htmlFor="new-password" value="New password" />
              </div>
              <TextInput
                id="new-password"
                required
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                }}
              />
            </div>
            <div>
              <div className={tw("mb-2 block")}>
                <Label
                  htmlFor="new-password-confirm"
                  value="Confirm new password"
                />
              </div>
              <TextInput
                id="new-password-confirm"
                required
                type="password"
                value={newPasswordConfirm}
                onChange={(event) => {
                  setNewPasswordConfirm(event.target.value);
                }}
                helperText={renderPasswordMatchHelperText(
                  newPassword,
                  newPasswordConfirm,
                )}
              />
            </div>
            <Button
              type="submit"
              isProcessing={isFormSubmitting}
              disabled={
                isEmpty(oldPassword) ||
                isEmpty(newPassword) ||
                isEmpty(newPasswordConfirm) ||
                newPassword !== newPasswordConfirm
              }
            >
              Submit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const renderPasswordMatchHelperText = (
  newPassword: string,
  newPasswordConfirm: string,
) => {
  if (
    newPassword === newPasswordConfirm ||
    isEmpty(newPasswordConfirm) ||
    isEmpty(newPassword)
  ) {
    return null;
  }

  return (
    <span className={tw("text-red-700")}>
      <HiOutlineExclamation className={tw("w-5 h-5 inline")} /> New passswords
      should match.
    </span>
  );
};

const updatePassword = async (
  userId: Id<UserResponse>,
  req: PasswordUpdateRequest,
): Promise<ResponseWithHeaders<UserResponse>> => {
  return await patch<PasswordUpdateRequest, UserResponse>(
    userPasswordApiPath(userId),
    req,
  );
};
