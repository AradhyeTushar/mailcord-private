-- NebulalMailCord Subscription System Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'SUPREME', 'PRO_SERVER'
    type VARCHAR(20) NOT NULL, -- 'user' | 'server'
    razorpay_plan_id VARCHAR(100) NOT NULL UNIQUE,
    price INT NOT NULL, -- in paise
    interval VARCHAR(20) DEFAULT 'monthly',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL, -- Discord User ID
    plan_id UUID REFERENCES plans(id),
    razorpay_subscription_id VARCHAR(100) UNIQUE,
    razorpay_customer_id VARCHAR(100),
    status VARCHAR(20) NOT NULL, -- 'created', 'active', 'past_due', 'cancelled', 'expired'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Server Subscriptions Table
CREATE TABLE IF NOT EXISTS server_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id VARCHAR(100) NOT NULL, -- Discord Guild ID
    owner_user_id VARCHAR(100) NOT NULL, -- Owner's Discord ID
    plan_id UUID REFERENCES plans(id),
    razorpay_subscription_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL, -- 'created', 'active', 'past_due', 'cancelled', 'expired'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razorpay_event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_server_subscriptions_server_id ON server_subscriptions(server_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(razorpay_event_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_server_subscriptions_updated_at BEFORE UPDATE ON server_subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
