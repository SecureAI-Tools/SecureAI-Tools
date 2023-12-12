import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { ModelProviderResponse } from "lib/types/api/mode-provider.response";
import { NextResponseErrors } from "lib/api/core/utils";
import { ModelProviderService } from "lib/api/services/model-provider-service";
import { ModelType } from "lib/types/core/model-type";
import { getWebLogger } from "lib/api/core/logger";

const logger = getWebLogger();
const modelProviderService = new ModelProviderService();

export async function GET(req: NextRequest) {
  const [authenticated, _] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  try {
    const modelProviderConfigs = modelProviderService.getConfigs();

    const modelTypes = modelProviderConfigs.map((c) => c.type);
    if (
      process.env.INFERENCE_SERVER &&
      modelTypes.findIndex((t) => t === ModelType.OLLAMA) < 0
    ) {
      // Add OLLAMA if INFERENCE_SERVER env config if provided and it's not already specifed in model-configs!
      modelTypes.push(ModelType.OLLAMA);
    }
    modelTypes.sort();

    const modelProviders: ModelProviderResponse[] = modelTypes.map((type) => {
      return {
        type: type,
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
