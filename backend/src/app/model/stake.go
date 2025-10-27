package model

import "time"

// StakeRecord 质押记录
type StakeRecord struct {
	ID          int64     `json:"id" gorm:"primaryKey"`
	UserAddress string    `json:"userAddress" gorm:"index"`
	ChainId     int64     `json:"chainId" gorm:"index"`
	Amount      float64   `json:"amount"`
	Token       string    `json:"token"`
	Status      string    `json:"status"` // active, withdrawn, expired
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// StakeOverview 质押概览
type StakeOverview struct {
	TotalStaked       float64 `json:"totalStaked"`
	TotalRewards      float64 `json:"totalRewards"`
	ActiveStakes      int     `json:"activeStakes"`
	UserAddress       string  `json:"userAddress"`
	ChainId           int64   `json:"chainId"`
	MonthlyStakeRatio float64 `json:"monthlyStakeRatio"` // 当月质押总价值占比
	DailyStakeRewards float64 `json:"dailyStakeRewards"` // 当天质押奖励
	APY               float64 `json:"apy"`               // 年化收益率
}
