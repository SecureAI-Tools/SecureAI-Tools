export class AuthResponse {
  auth!: Auth;
  accountCreated!: boolean;
}

export class Auth {
  token!: string;
  userId!: string;
}
