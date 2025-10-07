/**
 * Payment Service
 * RevenueCat integration for in-app purchases
 * Install: npm install react-native-purchases
 */

// import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { SubscriptionService, SubscriptionTier } from './subscription';

export class PaymentService {
  private static isConfigured = false;

  /**
   * Configure RevenueCat
   * Call this once on app start
   */
  static configure(apiKey: string, userId?: string): void {
    if (this.isConfigured) return;

    try {
      // TODO: Uncomment when react-native-purchases is installed
      // Purchases.configure({ apiKey, appUserID: userId });
      console.log('Payment service configured:', apiKey, userId);
      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to configure payments:', error);
    }
  }

  /**
   * Get available packages
   */
  static async getPackages(): Promise<any[]> {
    try {
      // TODO: Implement with RevenueCat
      // const offerings = await Purchases.getOfferings();
      // return offerings.current?.availablePackages || [];
      
      return []; // Placeholder
    } catch (error) {
      console.error('Error getting packages:', error);
      return [];
    }
  }

  /**
   * Purchase a package
   */
  static async purchase(
    packageId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // TODO: Implement with RevenueCat
      // const { customerInfo } = await Purchases.purchasePackage(package);
      // await this.syncSubscriptionStatus(customerInfo);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Purchase failed'),
      };
    }
  }

  /**
   * Restore purchases
   */
  static async restorePurchases(): Promise<{ success: boolean; error?: Error }> {
    try {
      // TODO: Implement with RevenueCat
      // const customerInfo = await Purchases.restorePurchases();
      // await this.syncSubscriptionStatus(customerInfo);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Restore failed'),
      };
    }
  }

  /**
   * Get current subscriber status
   */
  static async getSubscriberStatus(): Promise<{
    tier: SubscriptionTier;
    isActive: boolean;
    expiresAt?: Date;
  }> {
    try {
      // TODO: Implement with RevenueCat
      // const customerInfo = await Purchases.getCustomerInfo();
      // const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      return {
        tier: 'free',
        isActive: false,
      };
    } catch (error) {
      console.error('Error getting subscriber status:', error);
      return {
        tier: 'free',
        isActive: false,
      };
    }
  }

  /**
   * Sync subscription status to Supabase
   */
  private static async syncSubscriptionStatus(customerInfo: any): Promise<void> {
    // TODO: Extract subscription info and sync to Supabase
    console.log('Syncing subscription:', customerInfo);
  }
}

export default PaymentService;

