
import { SubscriptionPackage } from '../types';
import { supabase } from './supabase';

// Mocking a RevenueCat-like service
const MOCK_PACKAGES: SubscriptionPackage[] = [
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
  private isPremium = false;

  constructor() {
    // Check local storage for simulated persistence
    this.isPremium = localStorage.getItem('sportpulse_premium_status') === 'true';
  }

  async getOfferings(): Promise<SubscriptionPackage[]> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_PACKAGES;
  }

  async purchasePackage(packageIdentifier: string, userId: string): Promise<{ success: boolean, customerInfo: any }> {
    // Simulate network latency and processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update Supabase user
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', userId);

      if (error) throw error;

      this.isPremium = true;
      return {
        success: true,
        customerInfo: {
          entitlements: {
            active: {
              'pro_access': { expiresDate: null }
            }
          }
        }
      };
    } catch (e) {
      console.error('Purchase error:', e);
      return { success: false, customerInfo: null };
    }
  }

  async restorePurchases(userId: string): Promise<{ success: boolean, restored: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check Supabase
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, restored: data?.is_premium || false };
    } catch (e) {
      console.error('Restore error:', e);
      return { success: false, restored: false };
    }
  }

  checkSubscriptionStatus(): boolean {
    return this.isPremium;
  }
}

export const subscriptionService = new SubscriptionService();
