import { NextResponse } from "next/server";

import { InstanceConfigResponse } from "lib/types/api/instance-config.response";

// Stops pre-render at build time! NextJS framework assumes that build time env vars are
// the same as run time env vars, and so it eagerly pre-renders this route!
export const dynamic = 'force-dynamic';
export async function GET() {
  const response: InstanceConfigResponse = {
    analytics: process.env.INSTANCE_CONFIG_ANALYTICS ?? "enabled",
    instanceId: process.env.INSTANCE_CONFIG_INSTANCE_ID,
  };
  return NextResponse.json(response);
}
