import type { NewTenant } from "./types/NewTenant";
import { DeliveryMethod, type WebhookHandler } from "@shopify/shopify-api";
import type { WebhookConfig } from "node_modules/@shopify/shopify-app-remix/build/ts/server/config-types";

export class SafeDigit {
  public static baseUrl = "https://api.safedigit.io/public/api";

  async createTenant(clientId: string, shop: string, accessToken?: string) {
    if (!accessToken) {
      throw new Error("Access token is required");
    }
    try {
      const newTenant: NewTenant = {
        tenantId: SafeDigit.getTenantId(clientId, shop),
        name: shop,
        configuration: {
          shopifyToken: accessToken,
          shopifyShopDomain: shop,
        },
      };
      return await fetch(`${SafeDigit.baseUrl}/${clientId}/create-tenant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTenant),
      });
    } catch (error) {
      throw new Error("Error creating tenant");
    }
  }

  static getTenantId(clientId: string, shop: string): string {
    return `${clientId}@${shop}`;
  }

  static getWebhooks(
    clientId: string,
    webhooks: Record<string, string>,
  ): WebhookConfig {
    var retVal: WebhookConfig = Object.fromEntries(
      Object.entries(webhooks).map(([key, value]) => {
        return [
          key,
          {
            deliveryMethod: DeliveryMethod.Http,
            callbackUrl: SafeDigit.getCallbackUrl(clientId, value),
          },
        ];
      }),
    );

    retVal.APP_UNINSTALLED = [
      retVal.APP_UNINSTALLED as WebhookHandler,
      {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks",
      },
    ];
    return retVal;
  }

  private static getCallbackUrl(clientId: string, callbackPath: string) {
    if (callbackPath.startsWith("http")) {
      return callbackPath;
    } else {
      const fixedCallbackPath = callbackPath.startsWith("/")
        ? callbackPath
        : `/${callbackPath}`;
      return `${SafeDigit.baseUrl}/${clientId}/${fixedCallbackPath}`;
    }
  }
}

export const safeDigit = new SafeDigit();
