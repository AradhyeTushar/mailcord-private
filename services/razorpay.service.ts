import Razorpay from 'razorpay';
import { pgQuery } from '../src/db-pg.js';

let _razorpay: any = null;
const isMockMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder';

export const getRazorpay = () => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
    });
    if (isMockMode) console.warn('[Razorpay] Running in MOCK mode. Global keys not provided.');
  }
  return _razorpay;
};

export class RazorpayService {
  /**
   * Idempotently create or find a Razorpay Customer
   */
  static async getOrCreateCustomer(userId: string, email?: string, name?: string) {
    if (isMockMode) return `mock_cust_${userId}`;

    // 1. Check DB for existing customer ID associated with this user
    const existingSub = await pgQuery(
      'SELECT razorpay_customer_id FROM user_subscriptions WHERE user_id = $1 AND razorpay_customer_id IS NOT NULL LIMIT 1',
      [userId]
    );

    if (existingSub.rowCount && existingSub.rows[0].razorpay_customer_id) {
      return existingSub.rows[0].razorpay_customer_id;
    }

    const rzp = getRazorpay();
    try {
      const newCustomer = await rzp.customers.create({
        name: name || `Discord User ${userId}`,
        email: email,
        notes: { discordId: userId }
      });
      return newCustomer.id;
    } catch (e) {
      console.error('Error creating customer:', e);
      throw e;
    }
  }

  /**
   * Create a Subscription
   */
  static async createSubscription(planId: string, customerId: string, notes: any, callbackUrl?: string) {
    if (isMockMode) {
        return {
            id: `mock_sub_${Date.now()}`,
            short_url: `${callbackUrl || 'http://localhost:3005/dashboard'}`
        };
    }
    const rzp = getRazorpay();
    return await rzp.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: notes
    });
  }

  /**
   * Get Subscription Details
   */
  static async getSubscription(subscriptionId: string) {
    const rzp = getRazorpay();
    return await rzp.subscriptions.fetch(subscriptionId);
  }

  /**
   * Cancel Subscription
   */
  static async cancelSubscription(subscriptionId: string, atEnd: boolean = true) {
    const rzp = getRazorpay();
    return await rzp.subscriptions.cancel(subscriptionId, atEnd);
  }
}
