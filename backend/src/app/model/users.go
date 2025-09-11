package model

import (
	"github.com/shopspring/decimal"
	"time"
)

type Users struct {
	Id           int64           `json:"id" gorm:"column:id;primaryKey"`
	ChainId      int64           `json:"chainId" gorm:"column:chain_id"`
	Address      string          `json:"address" gorm:"column:address"`
	TokenAddress string          `json:"tokenAddress" gorm:"column:token_address"`
	TotalAmount  int64           `json:"totalAmount" gorm:"column:total_amount"`
	LastBlockNum int64           `json:"lastBlockNum" gorm:"column:last_block_num"`
	JfAmount     int64           `json:"jfAmount" gorm:"column:jf_amount"`
	JfTime       time.Time       `json:"jfTime" gorm:"column:jf_time"`
	Jf           decimal.Decimal `json:"jf" gorm:"column:jf"`
}

func (Users) TableName() string {
	return "users"
}
