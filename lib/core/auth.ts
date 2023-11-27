export const AUTH_KEY = "AUTH_RESP";

// Log in error codes on top of Next Auth's error codes https://next-auth.js.org/configuration/pages#error-page
export namespace LogInErrorCodes {
  // Standard error codes from next-auth
  export const CREDENTIALS_SIGNIN = "CredentialsSignin";

  // Custom error codes below. Must start with "SAIT." to distinguish from default error codes
}
