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
    identifier: 'sportpulse_monthly_999',
    packageType: 'MONTHLY',
    priceString: '$9.99',
    title: 'Monthly Access',
    description: 'Flexible plan, cancel anytime.',
  },
  {
    identifier: 'sportpulse_annual_5999',
    packageType: 'ANNUAL',
    priceString: '$59.99',
    title: 'Annual Pass',
    description: 'Best value for serious athletes.',
    savings: '50%'
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
      const { offerings } = await Purchases.getOfferings();
      if (!offerings.current?.availablePackages.length) return FALLBACK_PACKAGES;

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

  async purchasePackage(packageIdentifier: string, userId: string): Promise<{ success: boolean; customerInfo?: any; error?: string }> {
    if (!isNative || !this.initialized) {
      // Simulate for web/dev
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.updateSupabasePremiumStatus(userId, true);
      return { success: true, customerInfo: { entitlements: { active: { pro_access: {} } } } };
    }

    try {
      const { offerings } = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p: PurchasesPackage) => p.identifier === packageIdentifier);
      if (!pkg) return { success: false, error: 'Package not found' };

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      this.customerInfo = customerInfo;

      const isPremium = !!customerInfo.entitlements.active['pro_access'];
      if (isPremium) {
        await this.updateSupabasePremiumStatus(userId, true);
        return { success: true, customerInfo };
      }
      return { success: false, error: 'Purchase did not grant access' };
    } catch (error: any) {
      if (error.code === 'PURCHASE_CANCELLED') return { success: false, error: 'Cancelled' };
      return { success: false, error: error.message };
    }
  }

  async restorePurchases(userId: string): Promise<{ success: boolean; restored: boolean; error?: string }> {
    if (!isNative || !this.initialized) {
      const { data } = await supabase.from('users').select('is_premium').eq('id', userId).single();
      const isPremium = data?.is_premium || false;
      localStorage.setItem('sportpulse_premium_status', isPremium.toString());
      return { success: true, restored: isPremium };
    }

    try {
      const { customerInfo } = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      const isPremium = !!customerInfo.entitlements.active['pro_access'];
      await this.updateSupabasePremiumStatus(userId, isPremium);
      return { success: true, restored: isPremium };
    } catch (error: any) {
      return { success: false, restored: false, error: error.message };
    }
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
      try { await Purchases.logOut(); } catch {}
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
    }
  }
}

export const subscriptionService = new SubscriptionService();
