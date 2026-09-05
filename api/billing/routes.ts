import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config.js';
import { pgQuery, pgTransaction } from '../../src/db-pg.js';
import { RazorpayService } from '../../services/razorpay.service.js';

export const billingRouter = express.Router();

// Debug middleware
billingRouter.use((req, res, next) => {
  console.log(`[Billing Router] ${req.method} ${req.path}`);
  next();
});

const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * 1. POST /api/billing/create-subscription
 * Create a new subscription flow
 */
billingRouter.post('/create-subscription', requireAuth, async (req: any, res) => {
  const { plan_id, target_type, target_id } = req.body;
  const userId = req.user.id;

  console.log(`[Billing] Creating subscription: plan=${plan_id}, user=${userId}, target=${target_id}`);

  try {
    // 1. Validate plan exists and matches type
    const planRes = await pgQuery('SELECT * FROM plans WHERE id = $1 AND type = $2', [plan_id, target_type]);
    if (planRes.rowCount === 0) {
      console.warn(`[Billing] Plan not found: ${plan_id} for ${target_type}`);
      return res.status(400).json({ error: 'Invalid plan or target type' });
    }
    const plan = planRes.rows[0];

    // 2. Check for existing active or pending subscriptions
    const existingCheck = target_type === 'user' 
        ? await pgQuery('SELECT id FROM user_subscriptions WHERE user_id = $1 AND status IN (\'active\', \'past_due\')', [userId])
        : await pgQuery('SELECT id FROM server_subscriptions WHERE server_id = $1 AND status IN (\'active\', \'past_due\')', [target_id]);

    if (existingCheck.rowCount && existingCheck.rowCount > 0) {
        return res.status(400).json({ error: 'You already have an active subscription for this.' });
    }

    // 3. Create or reuse Razorpay customer
    let customerId;
    try {
        customerId = await RazorpayService.getOrCreateCustomer(userId);
    } catch (custErr: any) {
        console.error('[Billing] Razorpay Customer Error:', custErr.message);
        return res.status(500).json({ error: 'Failed to initialize payment profile.' });
    }

    // 4. Create Razorpay subscription
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3005';
    const callbackUrl = `${baseUrl}/dashboard?tab=billing&payment=success`;
    
    console.log(`[Billing] Calling Razorpay Service for plan ${plan.razorpay_plan_id}`);
    const rzpSubscription = await RazorpayService.createSubscription(plan.razorpay_plan_id, customerId, {
        userId,
        targetId: target_id,
        targetType: target_type,
        planName: plan.name
    }, callbackUrl);

    // 5. Store record with status = "created"
    if (target_type === 'user') {
        await pgQuery(`
            INSERT INTO user_subscriptions (id, user_id, plan_id, razorpay_subscription_id, razorpay_customer_id, status)
            VALUES ($1, $2, $3, $4, $5, 'created')
        `, [`us_${Date.now()}`, userId, plan.id, rzpSubscription.id, customerId]);
    } else {
        await pgQuery(`
            INSERT INTO server_subscriptions (id, server_id, owner_user_id, plan_id, razorpay_subscription_id, status)
            VALUES ($1, $2, $3, $4, $5, 'created')
        `, [`ss_${Date.now()}`, target_id, userId, plan.id, rzpSubscription.id]);
    }

    res.json({
        subscriptionId: rzpSubscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        status: 'created'
    });

  } catch (err: any) {
    console.error('Subscription Creation Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

/**
 * 0. GET /api/billing/health
 * Verification endpoint
 */
billingRouter.get('/health', (req, res) => res.json({ status: 'billing system online' }));

/**
 * 2. POST /api/billing/cancel
 * Cancel an active subscription
 */
billingRouter.post('/cancel', requireAuth, async (req: any, res) => {
    const { target_type, target_id } = req.body;
    const userId = req.user.id;
    const finalTargetId = target_id || userId;

    console.log(`[Billing] Cancellation request: type=${target_type}, id=${finalTargetId}`);

    try {
        let subscription;
        if (target_type === 'user') {
            const result = await pgQuery(
                'SELECT * FROM user_subscriptions WHERE user_id = $1 AND status IN (\'active\', \'past_due\', \'created\') ORDER BY created_at DESC LIMIT 1',
                [userId]
            );
            subscription = result.rows[0];
        } else {
            const result = await pgQuery(
                'SELECT * FROM server_subscriptions WHERE server_id = $1 AND status IN (\'active\', \'past_due\', \'created\') ORDER BY created_at DESC LIMIT 1',
                [finalTargetId]
            );
            subscription = result.rows[0];
        }

        if (!subscription) {
            console.warn(`[Billing] No active subscription found for type=${target_type}, id=${finalTargetId}`);
            return res.status(404).json({ error: 'No active subscription found to cancel.' });
        }

        console.log(`[Billing] Found subscription to cancel: ${subscription.razorpay_subscription_id || 'manual'}`);

        // Cancel in Razorpay if it's a real sub
        if (subscription.razorpay_subscription_id && !subscription.razorpay_subscription_id.startsWith('mock_')) {
            try {
                await RazorpayService.cancelSubscription(subscription.razorpay_subscription_id);
            } catch (rzpErr: any) {
                console.warn('[Billing] Razorpay cancellation failed:', rzpErr.message);
            }
        }

        // Update local DB
        if (target_type === 'user') {
            await pgQuery('UPDATE user_subscriptions SET status = \'cancelled\', updated_at = CURRENT_TIMESTAMP WHERE id = $1', [subscription.id]);
            // Force sync plan state to MongoDB User model for the bot to see
            const { syncUserPlan } = await import('../../src/shared.js');
            await syncUserPlan(userId);
        } else {
            await pgQuery('UPDATE server_subscriptions SET status = \'cancelled\', updated_at = CURRENT_TIMESTAMP WHERE id = $1', [subscription.id]);
            const { syncGuildPlan } = await import('../../src/shared.js');
            await syncGuildPlan(finalTargetId);
        }

        res.json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (err: any) {
        console.error('[Billing] Cancellation Error:', err);
        res.status(500).json({ error: err.message || 'Failed to cancel subscription.' });
    }
});

/**
 * 2. GET /api/billing/status
 * Get current subscription status for user/server
 */
billingRouter.get('/status', requireAuth, async (req: any, res) => {
    const userId = req.user.id;
    try {
        const userSub = await pgQuery(`
            SELECT s.*, p.name as plan_name, p.features 
            FROM user_subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = $1 AND s.status = 'active'
            ORDER BY s.created_at DESC LIMIT 1
        `, [userId]);

        const serverSubs = await pgQuery(`
            SELECT s.*, p.name as plan_name, p.features 
            FROM server_subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.owner_user_id = $1 AND s.status = 'active'
        `, [userId]);

        res.json({
            user: userSub.rows[0] || null,
            servers: serverSubs.rows || []
        });
    } catch (err) {
        console.error('[Billing Status Error]', err);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

