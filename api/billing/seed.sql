-- Seed Plans for NebulaMailCord (SQLite Compatible)
-- Run this AFTER schema.sqlite.sql

DELETE FROM plans; -- Clear existing to avoid ID mismatches

INSERT INTO plans (id, name, type, razorpay_plan_id, price, features)
VALUES 
('user_premium', 'PREMIUM', 'user', 'plan_SeFLzb0otVuh3r', 19900, '{
    "maxAliases": 25,
    "prioritySupport": true,
    "privateAliases": true,
    "retentionDays": 30
}'),
('user_supreme', 'SUPREME', 'user', 'plan_SeFMiZVQZ7JpSj', 49900, '{
    "maxAliases": 100,
    "prioritySupport": true,
    "privateAliases": true,
    "retentionDays": 90
}'),
('guild_pro', 'PRO_SERVER', 'server', 'plan_SeFNAFdrjG9g0z', 99900, '{
    "maxAliases": 500,
    "prioritySupport": true,
    "customDomain": true,
    "retentionDays": 60
}'),
('guild_enterprise', 'ENTERPRISE_SERVER', 'server', 'plan_SeFNk3IlFW3TS2', 249900, '{
    "maxAliases": 5000,
    "prioritySupport": true,
    "customDomain": true,
    "retentionDays": 365
}');
