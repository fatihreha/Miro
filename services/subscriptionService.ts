import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { SubscriptionPackage } from '../types';
import { supabase } from './supabase';

const isNative = Capacitor.isNativePlatform();

// RevenueCat API Keys
const REVENUECAT_IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_KEY || '';

// Fallback packages for web/development
const FALLBACK_PACKAGES: SubscriptionPackage[] = [
  {
    identifier: 'sportpulse_gold_monthly_999',
    packageType: 'MONTHLY',
    priceString: '$9.99',
    title: 'Gold Monthly',
    description: 'Flexible plan, cancel anytime.',
    tier: 'GOLD'
  },
  {
    identifier: 'sportpulse_gold_annual_5999',
    packageType: 'ANNUAL',
    priceString: '$59.99',
    title: 'Gold Annual',
    description: 'Best value for the gold tier.',
    savings: '50%',
    tier: 'GOLD'
  },
  {
    identifier: 'sportpulse_pro_monthly_1999',
    packageType: 'MONTHLY',
    priceString: '$19.99',
    title: 'Pro Monthly',
    description: 'For serious athletes.',
    tier: 'PRO'
  },
  {
    identifier: 'sportpulse_pro_annual_11999',
    packageType: 'ANNUAL',
    priceString: '$119.99',
    title: 'Pro Annual',
    description: 'Ultimate athlete experience.',
    savings: '50%',
    tier: 'PRO'
  }
];

class SubscriptionService {
  private initialized = false;
  private customerInfo: CustomerInfo | null = null;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId: string): Promise<boolean> {
    if (!isNative) {
      console.log('RevenueCat only available on native platforms');
      return false;
    }

    if (this.initialized) return true;

    try {
      const platform = Capacitor.getPlatform();
      const apiKey = platform === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        console.error('RevenueCat API key not configured');
        return false;
      }

      await Purchases.configure({ apiKey, appUserID: userId });

      if (import.meta.env.DEV) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      }

      const { customerInfo } = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      this.initialized = true;

      await this.syncPremiumStatus(userId);
      console.log('✅ RevenueCat initialized');
      return true;
    } catch (error) {
      console.error('RevenueCat init failed:', error);
      return false;
    }
  }

  async getOfferings(): Promise<SubscriptionPackage[]> {
    if (!isNative || !this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return FALLBACK_PACKAGES;
    }

    try {
      const result = await Purchases.getOfferings() as any;
      const offerings = result.offerings || result;
      if (!offerings.current?.availablePackages?.length) return FALLBACK_PACKAGES;

      return offerings.current.availablePackages.map((pkg: PurchasesPackage) => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType as 'MONTHLY' | 'ANNUAL',
        priceString: pkg.product.priceString,
        title: pkg.product.title || 'Premium',
        description: pkg.product.description || '',
        savings: pkg.packageType === 'ANNUAL' ? '50%' : undefined
      }));
    } catch {
      return FALLBACK_PACKAGES;
    }
  }

  async purchasePackage(packageIdentifier: string, userId: string): Promise<{ success: boolean; customerInfo?: any; error?: string; tier?: string; warning?: string; shouldRetry?: boolean }> {
    // Generate idempotency key for this purchase attempt
    const idempotencyKey = `purchase_${userId}_${packageIdentifier}_${Date.now()}`;

    // Check if purchase is already in progress
    const existingPurchase = this.getPendingPurchase(userId);
    if (existingPurchase) {
      console.log('Purchase already in progress:', existingPurchase);
      return { success: false, error: 'Purchase already in progress' };
    }

    // Save pending state BEFORE purchase attempt
    this.savePendingPurchase(userId, packageIdentifier, idempotencyKey);

    if (!isNative || !this.initialized) {
      // Simulate for web/dev
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Retry sync with exponential backoff
      const syncSuccess = await this.updateSupabasePremiumStatusWithRetry(userId, true);
      if (!syncSuccess) {
        console.error('Failed to sync premium status after multiple attempts');
        // Keep pending state for manual resolution
        return { success: false, error: 'Failed to sync premium status' };
      }

      this.clearPendingPurchase(userId);
      return { success: true, customerInfo: { entitlements: { active: { pro_access: {} } } } };
    }

    try {
      const result = await Purchases.getOfferings() as any;
      const offerings = result.offerings || result;
      const pkg = offerings.current?.availablePackages?.find((p: PurchasesPackage) => p.identifier === packageIdentifier);
      if (!pkg) {
        this.clearPendingPurchase(userId);
        return { success: false, error: 'Package not found' };
      }

      // Execute purchase
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      this.customerInfo = customerInfo;

      const isPremium = !!customerInfo.entitlements.active['pro_access'];
      if (isPremium) {
        // Critical: Sync with Supabase with retry logic
        const syncSuccess = await this.updateSupabasePremiumStatusWithRetry(userId, true, 5);

        if (!syncSuccess) {
          // Payment succeeded but sync failed - store for background sync
          console.error('Purchase succeeded but sync failed - storing for retry');
          this.storeFailedSyncForRetry(userId, customerInfo);
          // Don't clear pending - will be retried on next app launch
          return {
            success: true,
            customerInfo,
            warning: 'Payment processed, syncing in background'
          };
        }

        this.clearPendingPurchase(userId);
        return { success: true, customerInfo };
      }

      this.clearPendingPurchase(userId);
      return { success: false, error: 'Purchase did not grant access' };
    } catch (error: any) {
      console.error('Purchase error:', error);

      // Don't clear pending on network errors - might succeed server-side
      if (error.code === 'PURCHASE_CANCELLED') {
        this.clearPendingPurchase(userId);
        return { success: false, error: 'Cancelled' };
      }

      // Network timeout or unknown error - keep pending for verification
      if (error.message?.includes('timeout') || error.message?.includes('network')) {
        return {
          success: false,
          error: 'Network error - verifying purchase status',
          shouldRetry: true
        };
      }

      this.clearPendingPurchase(userId);
      return { success: false, error: error.message };
    }
  }

  async restorePurchases(userId: string): Promise<{ success: boolean; restored: boolean; error?: string; tier?: string }> {
    if (!isNative || !this.initialized) {
      const { data } = await supabase.from('users').select('is_premium').eq('id', userId).single();
      const isPremium = data?.is_premium || false;
      localStorage.setItem('sportpulse_premium_status', isPremium.toString());
      return { success: true, restored: isPremium };
    }

    // Retry restore with exponential backoff
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempting to restore purchases (${attempt}/${maxAttempts})`);

        const { customerInfo } = await Purchases.restorePurchases();
        this.customerInfo = customerInfo;
        const isPremium = !!customerInfo.entitlements.active['pro_access'];

        // Sync with retry
        await this.updateSupabasePremiumStatusWithRetry(userId, isPremium);

        return { success: true, restored: isPremium };
      } catch (error: any) {
        console.error(`Restore attempt ${attempt} failed:`, error);

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } else {
          return { success: false, restored: false, error: error.message };
        }
      }
    }

    return { success: false, restored: false, error: 'Max retry attempts reached' };
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    if (!isNative || !this.initialized) {
      return localStorage.getItem('sportpulse_premium_status') === 'true';
    }
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active['pro_access'];
  }

  async logout(): Promise<void> {
    if (isNative && this.initialized) {
      try { await Purchases.logOut(); } catch { }
    }
    this.customerInfo = null;
    this.initialized = false;
  }

  private async syncPremiumStatus(userId: string): Promise<void> {
    const isPremium = this.customerInfo ? !!this.customerInfo.entitlements.active['pro_access'] : false;
    await this.updateSupabasePremiumStatus(userId, isPremium);
  }

  private async updateSupabasePremiumStatus(userId: string, isPremium: boolean): Promise<void> {
    try {
      await supabase.from('users').update({ is_premium: isPremium }).eq('id', userId);
      localStorage.setItem('sportpulse_premium_status', isPremium.toString());
    } catch (error) {
      console.error('Premium status update error:', error);
      throw error; // Propagate error for retry logic
    }
  }

  /**
   * Update premium status with exponential backoff retry
   */
  private async updateSupabasePremiumStatusWithRetry(
    userId: string,
    isPremium: boolean,
    maxAttempts: number = 3
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Syncing premium status (attempt ${attempt}/${maxAttempts})`);
        await supabase.from('users').update({ is_premium: isPremium }).eq('id', userId);
        localStorage.setItem('sportpulse_premium_status', isPremium.toString());
        console.log('✅ Premium status synced successfully');
        return true;
      } catch (error) {
        console.error(`Sync attempt ${attempt} failed:`, error);

        if (attempt < maxAttempts) {
          const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ Failed to sync premium status after all attempts');
    return false;
  }

  /**
   * Save pending purchase state to localStorage
   */
  private savePendingPurchase(userId: string, packageId: string, idempotencyKey: string): void {
    const pendingPurchase = {
      userId,
      packageId,
      idempotencyKey,
      timestamp: Date.now(),
      status: 'pending'
    };
    localStorage.setItem('sportpulse_pending_purchase', JSON.stringify(pendingPurchase));
    console.log('💾 Saved pending purchase:', pendingPurchase);
  }

  /**
   * Get pending purchase from localStorage
   */
  private getPendingPurchase(userId: string): any | null {
    const stored = localStorage.getItem('sportpulse_pending_purchase');
    if (!stored) return null;

    try {
      const purchase = JSON.parse(stored);

      // Ignore if older than 10 minutes
      if (Date.now() - purchase.timestamp > 10 * 60 * 1000) {
        this.clearPendingPurchase(userId);
        return null;
      }

      return purchase.userId === userId ? purchase : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear pending purchase from localStorage
   */
  private clearPendingPurchase(userId: string): void {
    localStorage.removeItem('sportpulse_pending_purchase');
    console.log('🗑️ Cleared pending purchase for user:', userId);
  }

  /**
   * Store failed sync for background retry
   */
  private storeFailedSyncForRetry(userId: string, customerInfo: any): void {
    const failedSync = {
      userId,
      customerInfo: {
        entitlements: customerInfo.entitlements,
        activeSubscriptions: customerInfo.activeSubscriptions
      },
      timestamp: Date.now()
    };
    localStorage.setItem('sportpulse_failed_sync', JSON.stringify(failedSync));
    console.log('💾 Stored failed sync for retry:', failedSync);
  }

  /**
   * Check and retry any failed syncs on app startup
   */
  async checkAndRetryFailedSyncs(): Promise<void> {
    const stored = localStorage.getItem('sportpulse_failed_sync');
    if (!stored) return;

    try {
      const failedSync = JSON.parse(stored);
      console.log('🔄 Found failed sync, retrying...');

      const isPremium = !!failedSync.customerInfo?.entitlements?.active?.['pro_access'];
      const success = await this.updateSupabasePremiumStatusWithRetry(failedSync.userId, isPremium, 5);

      if (success) {
        localStorage.removeItem('sportpulse_failed_sync');
        console.log('✅ Failed sync resolved successfully');
      }
    } catch (error) {
      console.error('Failed to retry sync:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
