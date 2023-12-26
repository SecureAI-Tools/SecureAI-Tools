import { InstanceConfigResponse } from "lib/types/api/instance-config.response";
import { instanceConfigApiPath } from "lib/fe/api-paths";
import { get } from "lib/fe/api";

const STORAGE_INSTANCE_CONFIG_KEY = "sait.instance-config";
const INSTANCE_CONFIG_CACHE_VALIDITY_MS = 5 * 60 * 1000;

interface InstanceConfigData {
  config: InstanceConfigResponse;
  // epoch in millis
  createdAt: number;
}

export const getInstanceConfig = async (): Promise<InstanceConfigResponse> => {
  const config = getInstanceConfigFromCache();
  if (config) {
    return config;
  }

  const response = await get<InstanceConfigResponse>(instanceConfigApiPath());
  const fetchedConfig = response.response;

  setInstanceConfigInCache(fetchedConfig);
  return fetchedConfig;
};

const getInstanceConfigFromCache = (): InstanceConfigResponse | undefined => {
  if (!localStorage) {
    return {
      analytics: "enabled",
    };
  }

  const item = localStorage.getItem(STORAGE_INSTANCE_CONFIG_KEY);
  if (!item) {
    return undefined;
  }

  try {
    const instanceConfigData = JSON.parse(item) as InstanceConfigData;
    const now = new Date();
    if (
      now.getTime() - instanceConfigData.createdAt <
      INSTANCE_CONFIG_CACHE_VALIDITY_MS
    ) {
      return instanceConfigData.config;
    }
  } catch (e) {
    console.log("invalid instance config in local storage", e);
  }

  return undefined;
};

const setInstanceConfigInCache = (config: InstanceConfigResponse) => {
  if (!localStorage) {
    return;
  }

  try {
    const data: InstanceConfigData = {
      config: config,
      createdAt: new Date().getTime(),
    };
    localStorage.setItem(STORAGE_INSTANCE_CONFIG_KEY, JSON.stringify(data));
  } catch (e) {
    console.log("couldn't set instance config in local storage", e);
  }
};
