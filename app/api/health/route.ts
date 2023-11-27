import { NextRequest, NextResponse } from "next/server";

import { HealthResponse } from "lib/types/api/health.response";

export async function GET(req: NextRequest) {
  const response: HealthResponse = {
    version: process.env.APP_VERSION ?? "-",
  };
  return NextResponse.json(response);
}
