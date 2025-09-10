package model

type UserOperationRecord struct {
	Id            int64  `json:"id" gorm:"column:id;primaryKey"`
	ChainId       int64  `json:"chainId" gorm:"column:chain_id"`
	User          string `json:"user" gorm:"column:user"`
	PoolId        string `json:"poolId" gorm:"column:pool_id"`
	Amount        string `json:"amount" gorm:"column:amount"`
	OperationTime int64  `json:"operationTime" gorm:"column:operation_time"` // 操作时间 (Operation Time)
	UnlockTime    int64  `json:"unlockTime" gorm:"column:unlock_time"`
	TxHash        string `json:"txHash" gorm:"column:tx_hash"`
	BlockNumber   int64  `json:"blockNumber" gorm:"column:block_number"`
	EventType     string `json:"eventType" gorm:"column:event_type"` // 事件类型 (Event Type)
}

// TableName 指定表名 (User Operation Record Table)
func (UserOperationRecord) TableName() string {
	return "user_operation_record"
}
