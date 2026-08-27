// ============================================================================
// BusTracker: Google Play Billing Service (react-native-iap)
// Real In-App Purchase flow for Google Play Store
// Path: src/services/paymentService.ts
//
// FLOW:
// 1. App calls initIAP() on mount → connects to Google Play Billing
// 2. User selects plan → requestPurchase(productId) opens Google Play sheet
// 3. Google Play returns purchaseToken + orderId
// 4. App sends token to backend Edge Function (google-play-webhook)
// 5. Backend verifies with Google Play Developer API (server-side)
// 6. Backend creates subscription row in DB → subscription activated
// ============================================================================

import { Platform } from "react-native";

// Product IDs — must match Google Play Console In-App Products
export const PRODUCT_IDS = {
    monthly: "com.bustracker.monthly",
    quarterly: "com.bustracker.quarterly",
    yearly: "com.bustracker.yearly",
} as const;

export type PlanId = keyof typeof PRODUCT_IDS;

export interface PurchaseResult {
    success: boolean;
    purchaseToken?: string;
    orderId?: string;
    productId?: string;
    error?: string;
}

export interface ProductInfo {
    productId: string;
    title: string;
    description: string;
    price: string;
    currency: string;
    localizedPrice: string;
}

// ── IAP Module (lazy loaded — only on native Android) ──

let iapModule: any = null;
let iapInitialized = false;
let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;

// Pending purchase resolver (for promise-based flow)
let pendingPurchaseResolve: ((result: PurchaseResult) => void) | null = null;

/**
 * Initialize Google Play Billing connection
 * Call this once on app mount (e.g., in App.tsx or AuthContext)
 */
export async function initIAP(): Promise<boolean> {
    if (Platform.OS !== "android") {
        console.log("IAP: Skipping — not Android");
        return false;
    }

    if (iapInitialized) return true;

    try {
        iapModule = await import("react-native-iap");
        const { initConnection, purchaseUpdatedListener, purchaseErrorListener, flushFailedPurchasesCachedAsPendingAndroid } = iapModule;

        // Connect to Google Play Billing
        await initConnection();

        // Flush any stuck/failed purchases from previous sessions
        await flushFailedPurchasesCachedAsPendingAndroid().catch(() => {});

        // Listen for successful purchases
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: any) => {
            console.log("IAP Purchase Update:", purchase.productId, purchase.transactionId);

            if (pendingPurchaseResolve) {
                pendingPurchaseResolve({
                    success: true,
                    purchaseToken: purchase.purchaseToken,
                    orderId: purchase.transactionId,
                    productId: purchase.productId,
                });
                pendingPurchaseResolve = null;
            }

            // Acknowledge the purchase (CRITICAL — unacknowledged purchases get refunded after 3 days)
            try {
                await iapModule.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
            } catch (ackErr) {
                console.warn("IAP: Failed to acknowledge purchase:", ackErr);
            }
        });

        // Listen for purchase errors
        purchaseErrorSubscription = purchaseErrorListener((error: any) => {
            console.warn("IAP Purchase Error:", error.code, error.message);

            if (pendingPurchaseResolve) {
                const isCancelled = error.code === "E_USER_CANCELLED" || error.responseCode === 1;
                pendingPurchaseResolve({
                    success: false,
                    error: isCancelled ? "Purchase cancelled by user." : (error.message || "Purchase failed."),
                });
                pendingPurchaseResolve = null;
            }
        });

        iapInitialized = true;
        console.log("IAP: Google Play Billing initialized successfully");
        return true;
    } catch (err) {
        console.warn("IAP: Initialization failed:", err);
        return false;
    }
}

/**
 * Get product details from Google Play (prices, titles, etc.)
 */
export async function getProducts(): Promise<ProductInfo[]> {
    if (!iapModule || !iapInitialized) {
        await initIAP();
    }

    if (!iapModule) return getFallbackProducts();

    try {
        const { getSubscriptions } = iapModule;
        const productIds = Object.values(PRODUCT_IDS);

        const products = await getSubscriptions({ skus: productIds });

        return products.map((p: any) => ({
            productId: p.productId,
            title: p.title || p.productId,
            description: p.description || "",
            price: p.price || "",
            currency: p.currency || "INR",
            localizedPrice: p.localizedPrice || p.price || "",
        }));
    } catch (err) {
        console.warn("IAP: Failed to get products:", err);
        return getFallbackProducts();
    }
}

/**
 * Fallback product info (used on web/emulator where Google Play is unavailable)
 */
function getFallbackProducts(): ProductInfo[] {
    return [
        { productId: PRODUCT_IDS.monthly, title: "Monthly Plan", description: "1 month of live bus tracking", price: "99", currency: "INR", localizedPrice: "₹99" },
        { productId: PRODUCT_IDS.quarterly, title: "Quarterly Plan", description: "3 months of live bus tracking", price: "249", currency: "INR", localizedPrice: "₹249" },
        { productId: PRODUCT_IDS.yearly, title: "Yearly Plan", description: "12 months of live bus tracking", price: "799", currency: "INR", localizedPrice: "₹799" },
    ];
}

/**
 * Request a subscription purchase from Google Play
 * Opens the Google Play purchase sheet and returns the purchase result
 */
export async function requestPurchase(planId: PlanId): Promise<PurchaseResult> {
    const productId = PRODUCT_IDS[planId];

    if (Platform.OS !== "android" || !iapModule || !iapInitialized) {
        // Development/Web fallback — generate mock purchase for testing
        console.log("IAP: Using dev fallback for purchase:", productId);
        return {
            success: true,
            purchaseToken: `dev_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            orderId: `GPA.DEV-${Date.now()}`,
            productId,
        };
    }

    try {
        const { requestSubscription } = iapModule;

        // Create a promise that will be resolved by the purchase listener
        const purchasePromise = new Promise<PurchaseResult>((resolve) => {
            pendingPurchaseResolve = resolve;

            // Timeout after 5 minutes (user might take time on Google Play sheet)
            setTimeout(() => {
                if (pendingPurchaseResolve === resolve) {
                    pendingPurchaseResolve = null;
                    resolve({ success: false, error: "Purchase timed out. Please try again." });
                }
            }, 5 * 60 * 1000);
        });

        // Trigger the Google Play purchase sheet
        await requestSubscription({
            sku: productId,
            subscriptionOffers: [{ sku: productId, offerToken: "" }],
        });

        return await purchasePromise;
    } catch (err: any) {
        console.warn("IAP: requestPurchase error:", err);
        return {
            success: false,
            error: err?.message || "Failed to start purchase.",
        };
    }
}

/**
 * Cleanup IAP connection (call on app unmount)
 */
export async function cleanupIAP(): Promise<void> {
    if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
        purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
        purchaseErrorSubscription = null;
    }
    if (iapModule) {
        try {
            await iapModule.endConnection();
        } catch (err) {
            console.warn("IAP: cleanup error:", err);
        }
    }
    iapInitialized = false;
    iapModule = null;
}
