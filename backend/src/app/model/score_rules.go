package model

import (
	"github.com/shopspring/decimal"
)

type ScoreRules struct {
	Id           int64           `json:"id" gorm:"column:id;primaryKey"`
	ChainId      int64           `json:"chainId" gorm:"column:chain_id"`
	TokenAddress string          `json:"tokenAddress" gorm:"column:token_address"`
	Score        decimal.Decimal `json:"score" gorm:"column:score"`
	Decimals     int64           `json:"decimals" gorm:"column:decimals"`
}

func (ScoreRules) TableName() string {
	return "score_rules"
}
