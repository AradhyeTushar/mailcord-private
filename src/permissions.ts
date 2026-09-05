import { pgQuery } from './db-pg.js';

/**
 * Calculates effective permissions for a user within a specific server.
 * Effective access = combination of user plan + server plan.
 */
export async function getEffectivePermissions(userId: string, serverId: string) {
    // 1. Fetch User Plan
    const userSub = await pgQuery(`
        SELECT p.name, p.features 
        FROM user_subscriptions s 
        JOIN plans p ON s.plan_id = p.id 
        WHERE s.user_id = $1 AND s.status = 'active' AND s.current_period_end > NOW()
    `, [userId]);
    const userPlan = userSub.rows[0]?.name || 'FREE';
    const userFeatures = userSub.rows[0]?.features || {};

    // 2. Fetch Server Plan
    const serverSub = await pgQuery(`
        SELECT p.name, p.features 
        FROM server_subscriptions s 
        JOIN plans p ON s.plan_id = p.id 
        WHERE s.server_id = $1 AND s.status = 'active' AND s.current_period_end > NOW()
    `, [serverId]);
    const serverPlan = serverSub.rows[0]?.name || 'FREE';
    const serverFeatures = serverSub.rows[0]?.features || {};

    // 3. Merge Logic
    // Example: user = SUPREME + server = FREE → limited by server features for server-specific things
    // user = FREE + server = ENTERPRISE → limited by user features for user-specific things
    
    return {
        userPlan,
        serverPlan,
        effectivePermissions: {
            maxAliases: Math.max(userFeatures.maxAliases || 5, serverFeatures.maxAliases || 0),
            prioritySupport: userFeatures.prioritySupport || serverFeatures.prioritySupport || false,
            customDomain: serverFeatures.customDomain || false, // Server-specific feature
            privateAliases: userFeatures.privateAliases || false, // User-specific feature
            retentionDays: Math.max(userFeatures.retentionDays || 7, serverFeatures.retentionDays || 0)
        }
    };
}
