package model

import "time"

type UserOperationRecord struct {
	Id            int64     `json:"id" gorm:"column:id;primaryKey"`
	ChainId       int64     `json:"chainId" gorm:"column:chain_id"`
	Address       string    `json:"address" gorm:"column:address"`
	PoolId        int64     `json:"poolId" gorm:"column:pool_id"`
	Amount        int64     `json:"amount" gorm:"column:amount"`
	OperationTime time.Time `json:"operationTime" gorm:"column:operation_time"` // 操作时间 (Operation Time)
	UnlockTime    time.Time `json:"unlockTime" gorm:"column:unlock_time"`
	TxHash        string    `json:"txHash" gorm:"column:tx_hash"`
	BlockNumber   int64     `json:"blockNumber" gorm:"column:block_number"`
	EventType     string    `json:"eventType" gorm:"column:event_type"` // 事件类型 (Event Type)
	TokenAddress  string    `json:"tokenAddress" gorm:"column:token_address"`
}

func (UserOperationRecord) TableName() string {
	return "user_operation_record"
}
