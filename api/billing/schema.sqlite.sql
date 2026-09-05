-- NebulalMailCord Subscription System Schema
-- SQLite Version

-- 1. Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY, -- e.g. 'premium', 'supreme'
    name TEXT NOT NULL UNIQUE, -- e.g., 'PREMIUM', 'SUPREME'
    type TEXT NOT NULL, -- 'user' | 'server'
    razorpay_plan_id TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL, -- in paise
    interval TEXT DEFAULT 'monthly',
    features TEXT DEFAULT '{}', -- JSON as TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- Discord User ID
    plan_id TEXT REFERENCES plans(id),
    razorpay_subscription_id TEXT UNIQUE,
    razorpay_customer_id TEXT,
    status TEXT NOT NULL, -- 'created', 'active', 'past_due', 'cancelled', 'expired'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end INTEGER DEFAULT 0, -- Boolean as 0/1
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Server Subscriptions Table
CREATE TABLE IF NOT EXISTS server_subscriptions (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL, -- Discord Guild ID
    owner_user_id TEXT NOT NULL, -- Owner's Discord ID
    plan_id TEXT REFERENCES plans(id),
    razorpay_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL, -- 'created', 'active', 'past_due', 'cancelled', 'expired'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id TEXT PRIMARY KEY,
    razorpay_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON as TEXT
    processed INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_server_subscriptions_server_id ON server_subscriptions(server_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(razorpay_event_id);

-- SQLite handles updated_at via triggers too if needed, but for simplicity we can handle it in JS or via a basic trigger.
CREATE TRIGGER IF NOT EXISTS update_user_subscriptions_updated_at AFTER UPDATE ON user_subscriptions
BEGIN
    UPDATE user_subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_server_subscriptions_updated_at AFTER UPDATE ON server_subscriptions
BEGIN
    UPDATE server_subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
