-- AlanSwap Airdrop 数据库 Schema（精简版，仅保留必要表）
-- 目标：支撑前端 4 个接口 + 领取 proof；金额以 wei（numeric(78,0)）存储；地址、tx_hash 入库前转小写；事件以 (tx_hash, log_index) 去重。

BEGIN;

/*
============================================================
1) 空投活动元数据（链下手动维护/定时同步）
============================================================
*/
CREATE TABLE IF NOT EXISTS airdrop_campaigns (
                                                 airdrop_id NUMERIC(78,0) PRIMARY KEY,
    chain_id INTEGER NOT NULL,
    merkle_airdrop_contract TEXT CHECK (merkle_airdrop_contract ~ '^0x[0-9a-f]{40}$'),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    token_symbol TEXT NOT NULL,
    merkle_root TEXT CHECK (merkle_root ~ '^0x[0-9a-f]{64}$'),
    total_reward NUMERIC(78,0) NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS idx_airdrop_campaigns_active_end
    ON airdrop_campaigns (is_active, end_time DESC);

/*
============================================================
2) 用户白名单与领取证明（用于 claimReward 返回 proof）
============================================================
*/
CREATE TABLE IF NOT EXISTS airdrop_whitelist (
                                                 id BIGSERIAL PRIMARY KEY,
                                                 airdrop_id NUMERIC(78,0) NOT NULL,
    wallet_address TEXT NOT NULL CHECK (wallet_address ~ '^0x[0-9a-f]{40}$'),
    total_reward NUMERIC(78,0) NOT NULL,
    proof JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (airdrop_id, wallet_address)
    );

CREATE INDEX IF NOT EXISTS idx_airdrop_whitelist_airdrop
    ON airdrop_whitelist (airdrop_id);

/*
============================================================
3) 用户领取奖励事件（最小必要字段）
============================================================
*/
CREATE TABLE IF NOT EXISTS reward_claimed_events (
                                                     id BIGSERIAL PRIMARY KEY,
                                                     chain_id INTEGER NOT NULL,
                                                     contract_address TEXT NOT NULL CHECK (contract_address ~ '^0x[0-9a-f]{40}$'),
    airdrop_id NUMERIC(78, 0) NOT NULL,
    user_address TEXT NOT NULL CHECK (user_address ~ '^0x[0-9a-f]{40}$'),
    claim_amount NUMERIC(78, 0) NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    block_number BIGINT NOT NULL,
    tx_hash TEXT NOT NULL CHECK (tx_hash ~ '^0x[0-9a-f]{64}$'),
    log_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (claim_amount >= 0),
    UNIQUE (tx_hash, log_index)
    );

CREATE INDEX IF NOT EXISTS idx_reward_claimed_airdrop_user
    ON reward_claimed_events (airdrop_id, user_address);

CREATE INDEX IF NOT EXISTS idx_reward_claimed_contract_block
    ON reward_claimed_events (contract_address, block_number DESC);

/*
============================================================
4) 任务定义、绑定与用户状态（接口 2 与接口 4）
============================================================
*/
CREATE TABLE IF NOT EXISTS tasks (
                                     task_id BIGSERIAL PRIMARY KEY,
                                     task_name TEXT NOT NULL,
                                     description TEXT,
                                     icon_url TEXT,
                                     action_url TEXT,
                                     verify_type TEXT NOT NULL CHECK (verify_type IN ('auto','manual')),
    deadline TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS airdrop_task_bindings (
                                                     id BIGSERIAL PRIMARY KEY,
                                                     airdrop_id NUMERIC(78,0) NOT NULL,
    task_id BIGINT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (airdrop_id, task_id)
    );

CREATE INDEX IF NOT EXISTS idx_airdrop_task_bindings_airdrop
    ON airdrop_task_bindings (airdrop_id);

CREATE TABLE IF NOT EXISTS user_task_status (
                                                id BIGSERIAL PRIMARY KEY,
                                                wallet_address TEXT NOT NULL CHECK (wallet_address ~ '^0x[0-9a-f]{40}$'),
    task_id BIGINT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_status INTEGER NOT NULL CHECK (user_status IN (0,1,2)), -- 0未开始 1进行中 2已完成
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (wallet_address, task_id)
    );

COMMIT;

INSERT INTO public.airdrop_whitelist (airdrop_id,wallet_address,total_reward,proof,created_at) VALUES
	 (1,'0x61ddea492e49dda284efe85c55872af4b88cc911',300000000000000000000,NULL,'2025-10-16 17:00:10.809345+08'),
	 (1,'0x6efa2a04bb328df4a69a7e14123ba27d4f741a5b',200000000000000000000,NULL,'2025-10-16 17:00:10.809345+08'),
	 (1,'0x020875bf393a9cfc00b75a4f7b07576baa4248f4',400000000000000000000,NULL,'2025-10-16 17:00:10.809345+08');


-- 查询实现提示：
-- 1) 概览（overview）：
--    totalRewards = SUM(airdrop_whitelist.total_reward) 按用户地址；
--    claimedRewards = SUM(reward_claimed_events.claim_amount) 按用户地址；
--    pendingRewards = totalRewards - claimedRewards；
--    totalRewardsWeeklyChange = 过去 7 天的 SUM(claim_amount)。
-- 2) 可参与列表（available）：
--    活动列表来自 airdrop_campaigns，status = CASE(is_active/time 区间)；
--    userTotalReward 来自 airdrop_whitelist；userClaimedReward 来自 reward_claimed_events 聚合；
--    userPendingReward = total - claimed；userCount = COUNT(DISTINCT user_address) from reward_claimed_events。
-- 3) 排行榜（ranking）：
--    按 airdrop_id 聚合 reward_claimed_events：SUM(claim_amount) 与 MAX(event_timestamp)，按 sortBy 排序。
-- 4) 任务列表（userTask/list）：
--    读取 tasks + user_task_status，若需活动任务列表再关联 airdrop_task_bindings。