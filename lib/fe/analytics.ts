import mixpanelPlugin from "@analytics/mixpanel";
import AnalyticsConstructor, { AnalyticsInstance, PageData } from "analytics";

import { getInstanceConfig } from "lib/fe/instance-config";

let analytics: AnalyticsInstance | undefined = undefined;
async function init(): Promise<AnalyticsInstance | undefined> {
  const instanceConfig = await getInstanceConfig();
  if (
    !process.env.NEXT_PUBLIC_ANALYTICS_TOKEN ||
    instanceConfig.analytics !== "enabled"
  ) {
    return undefined;
  }

  if (!analytics) {
    analytics = AnalyticsConstructor({
      app: "web",
      plugins: [
        mixpanelPlugin({
          token: process.env.NEXT_PUBLIC_ANALYTICS_TOKEN,
          options: {
            debug: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true" ?? false,
          },
        }),
      ],
    });
  }

  return analytics;
}

export namespace Analytics {
  export async function identify({
    userId,
    traits,
    options,
    callback,
  }: {
    userId: string;
    traits?: any;
    options?: any;
    callback?: (...params: any[]) => any;
  }): Promise<any> {
    const analyticsInstance = await init();
    return analyticsInstance
      ? analyticsInstance.identify(userId, traits, options, callback)
      : callback?.();
  }

  export async function track({
    event,
    payload,
    options,
    callback,
  }: {
    event: Event;
    payload?: any;
    options?: any;
    callback?: (...params: any[]) => any;
  }): Promise<any> {
    const analyticsInstance = await init();
    return analyticsInstance
      ? analyticsInstance.track(event, payload, options, callback)
      : callback?.();
  }

  export async function page({
    data,
    options,
    callback,
  }: {
    data?: PageData;
    options?: any;
    callback?: (...params: any[]) => any;
  }): Promise<any> {
    const analyticsInstance = await init();
    return analyticsInstance
      ? analyticsInstance.page(data, options, callback)
      : callback?.();
  }

  export async function reset({
    callback,
  }: {
    callback?: (...params: any[]) => any;
  }): Promise<any> {
    const analyticsInstance = await init();
    return analyticsInstance ? analyticsInstance.reset(callback) : callback?.();
  }

  export enum Event {
    OrgSetupCompleted = "org-set-up-completed",
    ChatMessageCopiedToClipboard = "chat-message-copied-to-clipboard",
  }
}
