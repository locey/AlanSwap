package model

type Users struct {
	Id           int64  `json:"id" gorm:"column:id;primaryKey"`
	ChainId      int64  `json:"chainId" gorm:"column:chain_id"`
	Address      string `json:"address" gorm:"column:address"`
	TokenAddress string `json:"tokenAddress" gorm:"column:token_address"`
	TotalAmount  int64  `json:"totalAmount" gorm:"column:total_amount"`
	LastBlockNum int64  `json:"lastBlockNum" gorm:"column:last_block_num"`
}

func (Users) TableName() string {
	return "users"
}
