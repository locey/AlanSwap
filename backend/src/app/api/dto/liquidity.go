package dto

// Pagination 通用分页参数
type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
	Offset   int `json:"-"`
}

// PoolListItemDTO 列表项（含统计）
type PoolListItemDTO struct {
	PoolId    string `json:"poolId"`
	PoolName  string `json:"poolName"`
	Icon      string `json:"icon"`
	APY       string `json:"apy"`
	Volume24h string `json:"24hVolume"`
	Fees24h   string `json:"24hFees"`
}

// PoolPerformanceItemDTO 池子表现项
type PoolPerformanceItemDTO struct {
	PoolPair  string `json:"poolPair"`
	Volume24h string `json:"24hVolume"`
}

// RewardDistributionItemDTO 流动性收益分布项
type RewardDistributionItemDTO struct {
	PoolPair     string `json:"poolPair"`
	RewardAmount string `json:"rewardAmount"`
	Icon         string `json:"icon"`
	GrowthRate   string `json:"growthRate"`
}
