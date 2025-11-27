
import { SubscriptionPackage } from '../types';

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

  async purchasePackage(packageIdentifier: string): Promise<{ success: boolean, customerInfo: any }> {
    // Simulate network latency and processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success
    this.isPremium = true;
    localStorage.setItem('sportpulse_premium_status', 'true');
    
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
  }

  async restorePurchases(): Promise<{ success: boolean, restored: boolean }> {
     await new Promise(resolve => setTimeout(resolve, 1500));
     // Mock logic: if they "bought" it before in this session simulation
     const status = localStorage.getItem('sportpulse_premium_status') === 'true';
     return { success: true, restored: status };
  }

  checkSubscriptionStatus(): boolean {
    return this.isPremium;
  }
}

export const subscriptionService = new SubscriptionService();
