import { BaseChatModel } from "langchain/dist/chat_models/base";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { Embeddings } from "langchain/dist/embeddings/base";

import { getLogger } from "../logger";
import { ModelProviderConfig, ModelType, toModelType } from "..";
import { removeTrailingSlash } from "../utils/string-utils";


const logger = getLogger("model-provider-service");

export class ModelProviderService {
  // Instantiates a new LangChain chat-model for given type.
  // Defaults to Ollama if modelType is null.
  getChatModel({
    model: modelName,
    modelType: modelTypeStr,
  }: {
    model: string;
    modelType: string | null;
  }): BaseChatModel {
    const modelType = modelTypeStr
      ? toModelType(modelTypeStr)
      : ModelType.OLLAMA;
    const config = this.getConfig(modelType);

    if (!config) {
      throw new Error(`could not get config for model-type = ${modelType}`);
    }

    logger.debug("Instantiating model", { modelType: modelType });

    switch (modelType) {
      case ModelType.OPENAI:
        return new ChatOpenAI({
          openAIApiKey: config.apiKey,
          modelName: modelName,
          streaming: true,
          configuration: {
            baseURL: config.apiBaseUrl,
          },
        });

      case ModelType.OLLAMA:
        return new ChatOllama({
          baseUrl: config.apiBaseUrl,
          model: modelName,
        });

      default:
        throw new Error(`unsupported model type ${modelType}`);
    }
  }

  // Instantiates a new LangChain embedding-model depending on type.
  // Defaults to Ollama if modelType is null.
  getEmbeddingModel({
    model: modelName,
    modelType: modelTypeStr,
  }: {
    model: string;
    modelType: string | null;
  }): Embeddings {
    const modelType = modelTypeStr
      ? toModelType(modelTypeStr)
      : ModelType.OLLAMA;
    const config = this.getConfig(modelType);

    if (!config) {
      throw new Error(`could not get config for model-type = ${modelType}`);
    }

    logger.debug("Instantiating model", { modelType: modelType });

    switch (modelType) {
      case ModelType.OPENAI:
        return new OpenAIEmbeddings({
          openAIApiKey: config.apiKey,
          // Unlike Ollama, OpenAI has different model names for embedding v/s completion.
          // It does not allow completion models for embedding APIs.
          // https://platform.openai.com/docs/guides/embeddings/what-are-embeddings
          //
          // TODO: Make this part of MODEL_PROVIDER_CONFIGS if/when needed!
          modelName: "text-embedding-ada-002",
          configuration: {
            baseURL: config.apiBaseUrl,
          },
        });

      case ModelType.OLLAMA:
        return new OllamaEmbeddings({
          // OllamaEmbeddings does not like extra slash at the end!
          baseUrl: removeTrailingSlash(config.apiBaseUrl),
          model: modelName,
        });

      default:
        throw new Error(`unsupported model type ${modelType}`);
    }
  }

  getConfigs(): ModelProviderConfig[] {
    if (!process.env.MODEL_PROVIDER_CONFIGS) {
      logger.warn(
        "No model-provider-configs found. Make sure to configure valid model-provider-configs json in MODEL_PROVIDER_CONFIGS",
      );
      return [];
    }

    try {
      return JSON.parse(
        process.env.MODEL_PROVIDER_CONFIGS,
      ) as ModelProviderConfig[];
    } catch (e) {
      logger.error("could not parse model-provider-configs", { error: e });
      throw new Error(
        "Invalid model-provider-configs! Make sure to configure valid model-provider-configs json in MODEL_PROVIDER_CONFIGS",
      );
    }
  }

  getConfig(type: ModelType): ModelProviderConfig | undefined {
    // TODO: Optimize this if/when needed!
    const configs = this.getConfigs();

    const config = configs.find((c) => c.type === type.toString());

    // Default for ollama if no config is provided!
    if (type === ModelType.OLLAMA && !config) {
      return {
        type: ModelType.OLLAMA,
        apiBaseUrl: process.env.INFERENCE_SERVER!,
      };
    }

    return config;
  }
}
