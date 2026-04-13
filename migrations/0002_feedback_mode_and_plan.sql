-- Migration number: 0002 	 2026-04-13T00:00:00.000Z

-- Feedback mode per contract (aggressive | balanced | safety_first)
ALTER TABLE contracts ADD COLUMN feedback_mode TEXT NOT NULL DEFAULT 'balanced';

-- User plan for paid-tier gating
ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';

-- Stripe columns (nullable until Stripe is wired up)
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT;
ALTER TABLE users ADD COLUMN current_period_end INTEGER;
