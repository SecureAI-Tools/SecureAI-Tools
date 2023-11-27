import { NextResponse } from "next/server";

import { InstanceConfigResponse } from "lib/types/api/instance-config.response";

export async function GET() {
  const response: InstanceConfigResponse = {
    analytics: process.env.INSTANCE_CONFIG_ANALYTICS ?? "enabled",
  };
  return NextResponse.json(response);
}
