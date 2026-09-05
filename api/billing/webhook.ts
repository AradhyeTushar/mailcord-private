import crypto from 'crypto';
import { pgQuery, pgTransaction } from '../../src/db-pg.js';

export const handleRazorpayWebhook = async (rawBody: string, signature: string) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not configured');

    // 1. Verify Signature
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        throw new Error('Invalid Razorpay Signature');
    }

    const payload = JSON.parse(rawBody);
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const eventType = payload.event;

    // 2. Idempotency Check & Logging
    try {
        await pgQuery(`
            INSERT INTO webhook_logs (razorpay_event_id, event_type, payload)
            VALUES ($1, $2, $3)
        `, [eventId, eventType, JSON.stringify(payload)]);
    } catch (err: any) {
        if (err.code === '23505' || err.message?.includes('UNIQUE constraint failed')) { // Unique violation
            console.log(`[WEBHOOK] Duplicate event ignored: ${eventId}`);
            return { handled: true, duplicate: true };
        }
        throw err;
    }

    // 3. Process Event
    try {
        const entity = payload.payload.subscription.entity;
        const rzpSubscriptionId = entity.id;
        const notes = entity.notes || {};
        const status = mapRazorpayStatus(entity.status);
        const periodStart = new Date(entity.current_start * 1000);
        const periodEnd = new Date(entity.current_end * 1000);
        const cancelAtEnd = entity.cancel_at_period_end ? 1 : 0;

        await pgTransaction(async (client) => {
            if (notes.targetType === 'user' || notes.userId) {
                const targetId = notes.userId || notes.targetId;
                // Fetch current status to prevent illegal transitions
                const current = await client.query('SELECT status FROM user_subscriptions WHERE razorpay_subscription_id = $1', [rzpSubscriptionId]);
                const currentStatus = current.rows[0]?.status;
                
                // If it's already terminal (cancelled/expired), don't set to active unless it's a specific reactivation logic
                if ((currentStatus === 'cancelled' || currentStatus === 'expired') && status === 'active') {
                    console.log(`[WEBHOOK] Ignoring activation for terminal subscription: ${rzpSubscriptionId}`);
                    return;
                }

                await client.query(`
                    UPDATE user_subscriptions 
                    SET status = $1, current_period_start = $2, current_period_end = $3, cancel_at_period_end = $4, updated_at = CURRENT_TIMESTAMP
                    WHERE razorpay_subscription_id = $5
                `, [status, periodStart, periodEnd, cancelAtEnd, rzpSubscriptionId]);
            } else if (notes.targetType === 'server' || notes.targetId) {
                const current = await client.query('SELECT status FROM server_subscriptions WHERE razorpay_subscription_id = $1', [rzpSubscriptionId]);
                const currentStatus = current.rows[0]?.status;

                if ((currentStatus === 'cancelled' || currentStatus === 'expired') && status === 'active') {
                    console.log(`[WEBHOOK] Ignoring activation for terminal subscription: ${rzpSubscriptionId}`);
                    return;
                }

                await client.query(`
                    UPDATE server_subscriptions 
                    SET status = $1, current_period_start = $2, current_period_end = $3, cancel_at_period_end = $4, updated_at = CURRENT_TIMESTAMP
                    WHERE razorpay_subscription_id = $5
                `, [status, periodStart, periodEnd, cancelAtEnd, rzpSubscriptionId]);
            }

            // Mark log as processed
            await client.query('UPDATE webhook_logs SET processed = 1 WHERE razorpay_event_id = $1', [eventId]);
        });

        // 4. Trigger Sync in Bot DB
        const { syncUserPlan, syncGuildPlan } = await import('../../src/shared.js');
        if (notes.targetType === 'user' || notes.userId) {
            await syncUserPlan(notes.userId || notes.targetId);
        } else if (notes.targetType === 'server' || notes.targetId) {
            await syncGuildPlan(notes.targetId);
        }
        
        return { handled: true };
    } catch (err: any) {
        console.error(`[WEBHOOK ERROR] ${eventId}:`, err);
        await pgQuery('UPDATE webhook_logs SET error = $1 WHERE razorpay_event_id = $2', [err.message, eventId]);
        throw err;
    }
};

function mapRazorpayStatus(rzpStatus: string): string {
    switch (rzpStatus) {
        case 'active': return 'active';
        case 'authenticated': return 'active';
        case 'activated': return 'active';
        case 'past_due': return 'past_due';
        case 'halted': return 'past_due';
        case 'cancelled': return 'cancelled';
        case 'completed': return 'expired';
        case 'expired': return 'expired';
        default: return 'created';
    }
}

