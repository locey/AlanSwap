package model

import (
	"time"
)

// LiquidityPoolEvent 流动性池事件记录
type LiquidityPoolEvent struct {
	Id            int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ChainId       int64     `json:"chainId" gorm:"column:chain_id;not null"`
	TxHash        string    `json:"txHash" gorm:"column:tx_hash;not null;index"`
	BlockNumber   int64     `json:"blockNumber" gorm:"column:block_number;not null"`
	EventType     string    `json:"eventType" gorm:"column:event_type;not null"` // Swap, AddLiquidity, RemoveLiquidity
	PoolAddress   string    `json:"poolAddress" gorm:"column:pool_address;not null;index"`
	Token0Address string    `json:"token0Address" gorm:"column:token0_address"`
	Token1Address string    `json:"token1Address" gorm:"column:token1_address"`
	UserAddress   string    `json:"userAddress" gorm:"column:user_address;not null;index"`
	CallerAddress string    `json:"callerAddress" gorm:"column:caller_address"`
	Amount0In     string    `json:"amount0In" gorm:"column:amount0_in;type:decimal(78,0)"` // 大数用字符串存储
	Amount1In     string    `json:"amount1In" gorm:"column:amount1_in;type:decimal(78,0)"`
	Amount0Out    string    `json:"amount0Out" gorm:"column:amount0_out;type:decimal(78,0)"`
	Amount1Out    string    `json:"amount1Out" gorm:"column:amount1_out;type:decimal(78,0)"`
	Reserve0      string    `json:"reserve0" gorm:"column:reserve0;type:decimal(78,0)"` // 池子储备量
	Reserve1      string    `json:"reserve1" gorm:"column:reserve1;type:decimal(78,0)"`
	Price         string    `json:"price" gorm:"column:price;type:decimal(30,18)"`        // 价格
	Liquidity     string    `json:"liquidity" gorm:"column:liquidity;type:decimal(78,0)"` // 流动性
	CreatedAt     time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt     time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName 指定表名
func (LiquidityPoolEvent) TableName() string {
	return "liquidity_pool_events"
}

// LiquidityPool 流动性池信息
type LiquidityPool struct {
	Id             int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ChainId        int64     `json:"chainId" gorm:"column:chain_id;not null"`
	PoolAddress    string    `json:"poolAddress" gorm:"column:pool_address;not null;uniqueIndex:idx_chain_pool"`
	Token0Address  string    `json:"token0Address" gorm:"column:token0_address"`
	Token1Address  string    `json:"token1Address" gorm:"column:token1_address"`
	Token0Symbol   string    `json:"token0Symbol" gorm:"column:token0_symbol"`
	Token1Symbol   string    `json:"token1Symbol" gorm:"column:token1_symbol"`
	Token0Decimals int       `json:"token0Decimals" gorm:"column:token0_decimals"`
	Token1Decimals int       `json:"token1Decimals" gorm:"column:token1_decimals"`
	Reserve0       string    `json:"reserve0" gorm:"column:reserve0;type:decimal(78,0)"`
	Reserve1       string    `json:"reserve1" gorm:"column:reserve1;type:decimal(78,0)"`
	TotalSupply    string    `json:"totalSupply" gorm:"column:total_supply;type:decimal(78,0)"`
	Price          string    `json:"price" gorm:"column:price;type:decimal(30,18)"`
	Volume24h      string    `json:"volume24h" gorm:"column:volume_24h;type:decimal(78,0)"`
	TxCount        int64     `json:"txCount" gorm:"column:tx_count"`
	LastBlockNum   int64     `json:"lastBlockNum" gorm:"column:last_block_num"`
	IsActive       bool      `json:"isActive" gorm:"column:is_active;default:true"`
	CreatedAt      time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName 指定表名
func (LiquidityPool) TableName() string {
	return "liquidity_pools"
}
