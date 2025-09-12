package model

type Chain struct {
	Id           int64  `json:"id" gorm:"column:id;primaryKey"`
	ChainId      int64  `json:"chainId" gorm:"column:chain_id"`
	ChainName    string `json:"chainName" gorm:"column:chain_name"`
	Address      string `json:"address" gorm:"column:address"`
	LastBlockNum uint64 `json:"lastBlockNum" gorm:"column:last_block_num"`
}

// TableName 指定表名
func (Chain) TableName() string {
	return "chain"
}
