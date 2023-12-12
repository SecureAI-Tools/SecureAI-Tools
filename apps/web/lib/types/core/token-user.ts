// User object added to authjs sessions and tokens
export interface TokenUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}
