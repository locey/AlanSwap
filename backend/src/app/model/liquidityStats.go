package model

type LiquidityStatsResponse struct {
	MyLiquidityValue        string `json:"myLiquidityValue"`
	MyLiquidityPeriodChange string `json:"myLiquidityPeriodChange"`
	TotalFees               string `json:"totalFees"`
	TotalFeesTodayChange    string `json:"totalFeesTodayChange"`
	ActivePoolsCount        int    `json:"activePoolsCount"`
	TotalPoolsCount         int    `json:"totalPoolsCount"`
}

type LiquidityStatsRequest struct {
	UserAddress string `json:"userAddress" form:"userAddress"`
	ChainId     int64  `json:"chainId" form:"chainId"`
	Period      string `json:"period" form:"period"`
}
