import { TokenUser } from "lib/types/core/token-user";

export function getInitials(user: TokenUser | undefined): string {
  return `${user?.firstName?.charAt(0)?.toUpperCase()}${user?.lastName
    ?.charAt(0)
    ?.toUpperCase()}`;
}

export function stringToColor(s: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < s.length; i += 1) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function getFirstName(fullName: string): string {
  const parts = fullName.split(" ");
  return parts.length > 0 ? parts[0] : fullName;
}
