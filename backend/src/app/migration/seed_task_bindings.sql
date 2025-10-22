-- Seed data for tasks + airdrop_task_bindings + user_task_status
-- Purpose: Make the following query return rows for given wallet and airdrop_id
--   SELECT t.task_id, t.task_name, COALESCE(uts.user_status, 0) AS status
--   FROM airdrop_task_bindings b
--   JOIN tasks t ON t.task_id = b.task_id
--   LEFT JOIN user_task_status uts ON uts.task_id = t.task_id AND uts.wallet_address = $WALLET
--   WHERE b.airdrop_id = $AIRDROP_ID
--   ORDER BY t.task_id ASC;

-- Configurable constants (edit if needed)
-- Using airdrop_id = 1 and wallet_address = 0x0208... per request
-- Note: keep wallet address lowercase

BEGIN;

-- Ensure tables exist (idempotent, matches airdrop_events_schema.sql)
CREATE TABLE IF NOT EXISTS tasks (
    task_id BIGSERIAL PRIMARY KEY,
    task_name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    action_url TEXT,
    verify_type TEXT NOT NULL CHECK (verify_type IN ('auto','manual')),
    deadline TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reward_amount NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS airdrop_task_bindings (
    id BIGSERIAL PRIMARY KEY,
    airdrop_id NUMERIC(78,0) NOT NULL,
    task_id BIGINT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (airdrop_id, task_id)
);

CREATE TABLE IF NOT EXISTS user_task_status (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL CHECK (wallet_address ~ '^0x[0-9a-f]{40}$'),
    task_id BIGINT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_status INTEGER NOT NULL CHECK (user_status IN (0,1,2)),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (wallet_address, task_id)
);

INSERT INTO tasks (task_name, description, icon_url, action_url, verify_type, deadline, reward_amount)
SELECT 'Swap Once', 'Make at least one swap on AlanSwap', 'https://cdn.example.com/icons/swap.png', 'https://app.alanswap.com/', 'auto', NOW() + INTERVAL '30 days',2000
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE task_name = 'Swap Once');

INSERT INTO tasks (task_name, description, icon_url, action_url, verify_type, deadline, reward_amount)
SELECT 'Provide Liquidity', 'Add liquidity to any pool', 'https://cdn.example.com/icons/liquidity.png', 'https://app.alanswap.com/liquidity', 'auto', NOW() + INTERVAL '30 days',3000
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE task_name = 'Provide Liquidity');

-- Bind tasks to airdrop_id = 1
INSERT INTO airdrop_task_bindings (airdrop_id, task_id)
SELECT 1 AS airdrop_id, t.task_id FROM tasks t
WHERE t.task_name IN ('Swap Once','Provide Liquidity')
ON CONFLICT (airdrop_id, task_id) DO NOTHING;

-- Seed user task status for the given wallet (lowercase)
INSERT INTO user_task_status (wallet_address, task_id, user_status)
SELECT '0x020875bf393a9cfc00b75a4f7b07576baa4248f4' AS wallet_address, t.task_id,
       CASE
           WHEN t.task_name IN ('Follow Twitter','Join Telegram') THEN 2  -- completed
           WHEN t.task_name IN ('Swap Once') THEN 1                        -- in progress
           ELSE 0                                                         -- not started
       END AS user_status
FROM tasks t
WHERE t.task_name IN ('Swap Once','Provide Liquidity')
ON CONFLICT (wallet_address, task_id) DO UPDATE SET user_status = EXCLUDED.user_status;

COMMIT;