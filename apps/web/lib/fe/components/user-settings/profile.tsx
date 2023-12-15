import { useSession } from "next-auth/react";
import { tw } from "twind";
import { Button, Label, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";

import { userApiPath } from "lib/fe/api-paths";
import { patch, ResponseWithHeaders } from "lib/fe/api";
import { TokenUser } from "lib/types/core/token-user";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import useToasts from "lib/fe/hooks/use-toasts";
import { UserUpdateRequest } from "lib/types/api/user-update-request";

import { Id } from "@repo/core/src/types/id";
import { UserResponse } from "@repo/core/src/types/user.response";

const UserProfileSettings = () => {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [toasts, addToast] = useToasts();

  useEffect(() => {
    // Set state on first load only. On user focus also it sometimes refetches session, don't update then!
    // if (session && sessionStatus === 'authenticated' && isEmpty(firstName) && isEmpty(lastName) && isEmpty(email)) {
    if (session && sessionStatus === "authenticated") {
      const user = session.user as TokenUser;
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
    }
  }, [session, sessionStatus]);

  return (
    <div className={tw("px-4")}>
      <StudioToasts toasts={toasts} />
      <form
        className={tw("flex max-w-md flex-col gap-4")}
        onSubmit={(e) => {
          e.preventDefault();
          setIsFormSubmitting(true);
          updateUser(Id.from((session!.user as TokenUser).id), {
            firstName,
            lastName,
          })
            .then(({ response }) => {
              addToast({
                type: "success",
                children: <p>Successfully updated profile.</p>,
              });
              updateSession();
            })
            .catch((e) => {
              addToast({
                type: "failure",
                children: (
                  <p>
                    Something went wrong while trying to update profile. Please
                    try again later.
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
            <Label htmlFor="first-name" value="First Name" />
          </div>
          <TextInput
            id="first-name"
            placeholder="Bruce"
            required
            type="text"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
            }}
          />
        </div>
        <div>
          <div className={tw("mb-2 block")}>
            <Label htmlFor="last-name" value="Last Name" />
          </div>
          <TextInput
            id="last-name"
            placeholder="Bruce"
            required
            type="text"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
            }}
          />
        </div>
        <div>
          <div className={tw("mb-2 block")}>
            <Label htmlFor="email" value="Email" />
          </div>
          <TextInput
            id="email"
            placeholder="Bruce"
            required
            type="text"
            value={email}
            disabled
          />
        </div>
        <Button type="submit" isProcessing={isFormSubmitting}>
          Submit
        </Button>
      </form>
    </div>
  );
};

export default UserProfileSettings;

const updateUser = async (
  userId: Id<UserResponse>,
  req: UserUpdateRequest,
): Promise<ResponseWithHeaders<UserResponse>> => {
  return await patch<UserUpdateRequest, UserResponse>(userApiPath(userId), req);
};
