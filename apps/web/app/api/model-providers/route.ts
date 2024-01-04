import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { ModelProviderResponse } from "lib/types/api/mode-provider.response";
import { getWebLogger } from "lib/api/core/logger";

import { ModelProviderService, NextResponseErrors } from "@repo/backend";

const logger = getWebLogger();
const modelProviderService = new ModelProviderService();

export async function GET(req: NextRequest) {
  const [authenticated, _] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  try {
    const configs = modelProviderService.getConfigs();

    const modelProviders: ModelProviderResponse[] = configs.map((c) => {
      return {
        type: c.type,
        allowedModels: c.allowedModels,
      };
    });
    return NextResponse.json(modelProviders);
  } catch (e) {
    logger.error("could not parse model-provider-configs", { error: e });
    return NextResponseErrors.internalServerError(
      "Invalid model-provider-configs! Make sure to configure valid model-provider-configs json in MODEL_PROVIDER_CONFIGS",
    );
  }
}
