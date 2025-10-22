package model

import (
    "time"
)

// RewardClaimedEvent 空投奖励领取事件
type RewardClaimedEvent struct {
    Id               int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
    ChainId          int64     `json:"chainId" gorm:"column:chain_id;not null"`
    ContractAddress  string    `json:"contractAddress" gorm:"column:contract_address;not null"`
    AirdropId        string    `json:"airdropId" gorm:"column:airdrop_id;type:decimal(78,0);not null"`
    UserAddress      string    `json:"userAddress" gorm:"column:user_address;not null"`
    ClaimAmount      string    `json:"claimAmount" gorm:"column:claim_amount;type:decimal(78,0);not null"`
    TotalReward      string    `json:"totalReward" gorm:"column:total_reward;type:decimal(78,0);not null"`
    ClaimedReward    string    `json:"claimedReward" gorm:"column:claimed_reward;type:decimal(78,0);not null"`
    PendingReward    string    `json:"pendingReward" gorm:"column:pending_reward;type:decimal(78,0);not null"`
    EventTimestamp   time.Time `json:"eventTimestamp" gorm:"column:event_timestamp;not null"`
    BlockNumber      int64     `json:"blockNumber" gorm:"column:block_number;not null"`
    TxHash           string    `json:"txHash" gorm:"column:tx_hash;not null"`
    LogIndex         int       `json:"logIndex" gorm:"column:log_index;not null"`
    CreatedAt        time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

func (RewardClaimedEvent) TableName() string {
    return "reward_claimed_events"
}

// TotalRewardUpdatedEvent 更新用户总奖励事件
type TotalRewardUpdatedEvent struct {
    Id               int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
    ChainId          int64     `json:"chainId" gorm:"column:chain_id;not null"`
    ContractAddress  string    `json:"contractAddress" gorm:"column:contract_address;not null"`
    AirdropId        string    `json:"airdropId" gorm:"column:airdrop_id;type:decimal(78,0);not null"`
    UserAddress      string    `json:"userAddress" gorm:"column:user_address;not null"`
    TotalReward      string    `json:"totalReward" gorm:"column:total_reward;type:decimal(78,0);not null"`
    ClaimedReward    string    `json:"claimedReward" gorm:"column:claimed_reward;type:decimal(78,0);not null"`
    PendingReward    string    `json:"pendingReward" gorm:"column:pending_reward;type:decimal(78,0);not null"`
    EventTimestamp   time.Time `json:"eventTimestamp" gorm:"column:event_timestamp;not null"`
    BlockNumber      int64     `json:"blockNumber" gorm:"column:block_number;not null"`
    TxHash           string    `json:"txHash" gorm:"column:tx_hash;not null"`
    LogIndex         int       `json:"logIndex" gorm:"column:log_index;not null"`
    CreatedAt        time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

func (TotalRewardUpdatedEvent) TableName() string {
    return "total_reward_updates"
}