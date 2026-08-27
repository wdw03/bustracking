// Type declarations for packages that have incomplete or incompatible types

// react-native-iap ships raw .ts source files that reference 'global'
// without a DOM/Node lib. This declaration patches the missing global.
declare var global: typeof globalThis;

// Module declaration for react-native-iap (use compiled output types)
declare module "react-native-iap" {
  export function initConnection(): Promise<boolean>;
  export function endConnection(): Promise<void>;
  export function flushFailedPurchasesCachedAsPendingAndroid(): Promise<string[]>;
  
  export function getSubscriptions(params: { skus: string[] }): Promise<any[]>;
  export function getProducts(params: { skus: string[] }): Promise<any[]>;
  
  export function requestSubscription(params: {
    sku: string;
    subscriptionOffers?: Array<{ sku: string; offerToken: string }>;
  }): Promise<any>;
  
  export function requestPurchase(params: { sku: string }): Promise<any>;
  
  export function acknowledgePurchaseAndroid(params: { token: string }): Promise<any>;
  
  export function purchaseUpdatedListener(
    listener: (purchase: {
      productId: string;
      transactionId: string;
      purchaseToken: string;
      transactionReceipt: string;
    }) => void
  ): { remove: () => void };
  
  export function purchaseErrorListener(
    listener: (error: {
      code: string;
      message: string;
      responseCode: number;
    }) => void
  ): { remove: () => void };
}
