import { pgQuery } from '../src/db-pg.js';

export const requireUserPlan = (minTier: string) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.user.id;
    try {
        const subRes = await pgQuery(`
            SELECT p.name 
            FROM user_subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = $1 AND s.status = 'active' AND s.current_period_end > NOW()
        `, [userId]);

        const plan = subRes.rows[0]?.name || 'FREE';
        
        if (checkTier(plan, minTier)) {
            req.userPlan = plan;
            return next();
        }

        res.status(403).json({ error: `Access denied. Requires ${minTier} plan.` });
    } catch (err) {
        res.status(500).json({ error: 'Plan validation error' });
    }
  };
};

export const requireServerPlan = (minTier: string) => {
    return async (req: any, res: any, next: any) => {
      const serverId = req.params.serverId || req.body.serverId;
      if (!serverId) return res.status(400).json({ error: 'Server ID required' });

      try {
          const subRes = await pgQuery(`
              SELECT p.name 
              FROM server_subscriptions s 
              JOIN plans p ON s.plan_id = p.id 
              WHERE s.server_id = $1 AND s.status = 'active' AND s.current_period_end > NOW()
          `, [serverId]);
  
          const plan = subRes.rows[0]?.name || 'FREE';
          
          if (checkTier(plan, minTier)) {
              req.serverPlan = plan;
              return next();
          }
  
          res.status(403).json({ error: `Server requires ${minTier} plan.` });
      } catch (err) {
          res.status(500).json({ error: 'Server plan validation error' });
      }
    };
  };

function checkTier(current: string, required: string): boolean {
    const tiers: Record<string, number> = {
        'FREE': 0,
        'PREMIUM': 1,
        'SUPREME': 2,
        'PRO_SERVER': 1,
        'ENTERPRISE_SERVER': 2
    };
    return (tiers[current] || 0) >= (tiers[required] || 0);
}
