import { DOMAIN_NAME } from "./constants";

export function getBasePath(): string {
  switch (process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE) {
    case "staging":
      return `http://staging.${DOMAIN_NAME}`;
    case "development":
      return "http://localhost:3000";
    case "production":
    default:
      return `https://${DOMAIN_NAME}`;
  }
}
