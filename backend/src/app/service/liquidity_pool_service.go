package service

import (
	"fmt"
	"math"
	"math/big"
	"time"

	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/ctx"
)

type LiquidityPoolService struct{}

func NewLiquidityPoolService() *LiquidityPoolService {
	return &LiquidityPoolService{}
}

// GetPoolByAddress 根据池子地址获取流动性池信息
func (s *LiquidityPoolService) GetPoolByAddress(chainId int64, poolAddress string) (*model.LiquidityPool, error) {
	var pool model.LiquidityPool
	err := ctx.Ctx.DB.Where("chain_id = ? AND pool_address = ?", chainId, poolAddress).First(&pool).Error
	if err != nil {
		return nil, err
	}
	return &pool, nil
}

// GetPoolEvents 获取流动性池事件
func (s *LiquidityPoolService) GetPoolEvents(chainId int64, poolAddress string, eventType string, limit int) ([]model.LiquidityPoolEvent, error) {
	var events []model.LiquidityPoolEvent
	query := ctx.Ctx.DB.Where("chain_id = ? AND pool_address = ?", chainId, poolAddress)

	if eventType != "" {
		query = query.Where("event_type = ?", eventType)
	}

	err := query.Order("created_at DESC").Limit(limit).Find(&events).Error
	return events, err
}

// GetUserEvents 获取用户相关的事件
func (s *LiquidityPoolService) GetUserEvents(chainId int64, userAddress string, limit int) ([]model.LiquidityPoolEvent, error) {
	var events []model.LiquidityPoolEvent
	err := ctx.Ctx.DB.Where("chain_id = ? AND user_address = ?", chainId, userAddress).
		Order("created_at DESC").Limit(limit).Find(&events).Error
	return events, err
}

// CreatePool 创建新的流动性池记录
func (s *LiquidityPoolService) CreatePool(pool *model.LiquidityPool) error {
	return ctx.Ctx.DB.Create(pool).Error
}

// UpdatePool 更新流动性池信息
func (s *LiquidityPoolService) UpdatePool(pool *model.LiquidityPool) error {
	return ctx.Ctx.DB.Save(pool).Error
}

// --- 新增：查询与统计方法 ---

// ListUserPoolAddresses 根据用户地址（可选链ID）查询其涉及的去重池子地址
func (s *LiquidityPoolService) ListUserPoolAddresses(userAddress string, chainIdOpt int64) ([]string, error) {
	var poolAddresses []string
	subQuery := ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).
		Select("DISTINCT pool_address").
		Where("user_address = ?", userAddress)
	if chainIdOpt > 0 {
		subQuery = subQuery.Where("chain_id = ?", chainIdOpt)
	}
	if err := subQuery.Pluck("pool_address", &poolAddresses).Error; err != nil {
		return nil, err
	}
	return poolAddresses, nil
}

// ListActivePoolsByAddresses 根据地址列表（可选链ID）查询活跃池子（不分页）
func (s *LiquidityPoolService) ListActivePoolsByAddresses(addresses []string, chainIdOpt int64) ([]model.LiquidityPool, error) {
	var pools []model.LiquidityPool
	if len(addresses) == 0 {
		return pools, nil
	}
	query := ctx.Ctx.DB.Model(&model.LiquidityPool{}).
		Where("pool_address IN (?) AND is_active = ?", addresses, true)
	if chainIdOpt > 0 {
		query = query.Where("chain_id = ?", chainIdOpt)
	}
	if err := query.Order("created_at DESC").Find(&pools).Error; err != nil {
		return nil, err
	}
	return pools, nil
}

// ListActivePoolsByAddressesPaged 根据地址列表查询活跃池子（分页返回总数与列表）
func (s *LiquidityPoolService) ListActivePoolsByAddressesPaged(addresses []string, chainIdOpt int64, offset, limit int) ([]model.LiquidityPool, int64, error) {
	var pools []model.LiquidityPool
	var total int64
	if len(addresses) == 0 {
		return pools, 0, nil
	}
	query := ctx.Ctx.DB.Model(&model.LiquidityPool{}).
		Where("pool_address IN (?) AND is_active = ?", addresses, true)
	if chainIdOpt > 0 {
		query = query.Where("chain_id = ?", chainIdOpt)
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&pools).Error; err != nil {
		return nil, 0, err
	}
	return pools, total, nil
}

// ListActivePools 查询所有活跃池子（分页返回总数与列表）
func (s *LiquidityPoolService) ListActivePools(chainIdOpt int64, offset, limit int) ([]model.LiquidityPool, int64, error) {
	var pools []model.LiquidityPool
	var total int64
	query := ctx.Ctx.DB.Model(&model.LiquidityPool{}).Where("is_active = ?", true)
	if chainIdOpt > 0 {
		query = query.Where("chain_id = ?", chainIdOpt)
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&pools).Error; err != nil {
		return nil, 0, err
	}
	return pools, total, nil
}

const DefaultFeeRate = 0.003

// Compute24hStats 计算 24h 交易量、手续费与 APY（APY 为字符串，含百分号）
func (s *LiquidityPoolService) Compute24hStats(pool model.LiquidityPool) (volumeUSD float64, feesUSD float64, apy string) {
	volumeUSD = compute24hVolumeUSD(pool)
	feesUSD = volumeUSD * DefaultFeeRate
	apy = computeAPY(pool, feesUSD)
	return
}

// --- 计算辅助方法（从 API 迁移） ---

func isStable(symbol string) bool {
	switch symbol {
	case "USDC", "USDT", "DAI":
		return true
	default:
		return false
	}
}

func parseBigInt(s string) *big.Int {
	if s == "" {
		return big.NewInt(0)
	}
	v, ok := new(big.Int).SetString(s, 10)
	if !ok {
		return big.NewInt(0)
	}
	return v
}

func toFloatWithDecimals(v *big.Int, decimals int) float64 {
	if v == nil {
		return 0
	}
	f, _ := new(big.Rat).SetFrac(v, new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)).Float64()
	return f
}

// computeVolumeUSDForPeriod 计算任意时间段内的 USD 交易量（稳定币侧）
func computeVolumeUSDForPeriod(pool model.LiquidityPool, start, end time.Time) float64 {
	var events []model.LiquidityPoolEvent
	if err := ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).
		Where("chain_id = ? AND pool_address = ? AND event_type = ? AND created_at >= ? AND created_at < ?",
			pool.ChainId, pool.PoolAddress, "Swap", start, end).
		Order("created_at DESC").
		Find(&events).Error; err != nil {
		return 0
	}

	var total float64
	token0Stable := isStable(pool.Token0Symbol)
	token1Stable := isStable(pool.Token1Symbol)

	for _, e := range events {
		a0in := parseBigInt(e.Amount0In)
		a0out := parseBigInt(e.Amount0Out)
		a1in := parseBigInt(e.Amount1In)
		a1out := parseBigInt(e.Amount1Out)

		if token0Stable {
			vol0 := new(big.Int).Add(a0in, a0out)
			total += toFloatWithDecimals(vol0, pool.Token0Decimals)
		} else if token1Stable {
			vol1 := new(big.Int).Add(a1in, a1out)
			total += toFloatWithDecimals(vol1, pool.Token1Decimals)
		}
	}
	return total
}

// ComputeFeesUSDForPeriod 计算任意时间段内的 USD 手续费
func (s *LiquidityPoolService) ComputeFeesUSDForPeriod(pool model.LiquidityPool, start, end time.Time) float64 {
	vol := computeVolumeUSDForPeriod(pool, start, end)
	return vol * DefaultFeeRate
}

// compute24hVolumeUSD 仅在稳定币池中返回 USD 交易量，否则为 0
func compute24hVolumeUSD(pool model.LiquidityPool) float64 {
	since := time.Now().Add(-24 * time.Hour)
	var events []model.LiquidityPoolEvent
	if err := ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).
		Where("chain_id = ? AND pool_address = ? AND event_type = ? AND created_at >= ?",
			pool.ChainId, pool.PoolAddress, "Swap", since).
		Order("created_at DESC").
		Find(&events).Error; err != nil {
		return 0
	}

	var total float64
	token0Stable := isStable(pool.Token0Symbol)
	token1Stable := isStable(pool.Token1Symbol)

	for _, e := range events {
		a0in := parseBigInt(e.Amount0In)
		a0out := parseBigInt(e.Amount0Out)
		a1in := parseBigInt(e.Amount1In)
		a1out := parseBigInt(e.Amount1Out)

		if token0Stable {
			vol0 := new(big.Int).Add(a0in, a0out)
			total += toFloatWithDecimals(vol0, pool.Token0Decimals)
		} else if token1Stable {
			vol1 := new(big.Int).Add(a1in, a1out)
			total += toFloatWithDecimals(vol1, pool.Token1Decimals)
		}
	}
	return total
}

// computeAPY 基于稳定币侧的 TVL 估算 APY
func computeAPY(pool model.LiquidityPool, feesUSD24h float64) string {
	var tvlUSD float64
	if isStable(pool.Token0Symbol) {
		tvlUSD = 2 * toFloatWithDecimals(parseBigInt(pool.Reserve0), pool.Token0Decimals)
	} else if isStable(pool.Token1Symbol) {
		tvlUSD = 2 * toFloatWithDecimals(parseBigInt(pool.Reserve1), pool.Token1Decimals)
	}

	if tvlUSD <= 0 {
		return "-"
	}
	apy := (feesUSD24h / tvlUSD) * 365 * 100
	if math.IsNaN(apy) || math.IsInf(apy, 0) {
		return "-"
	}
	return fmt.Sprintf("%.1f%%", apy)
}

// BatchCreateEvents 批量创建事件记录
func (s *LiquidityPoolService) BatchCreateEvents(events []model.LiquidityPoolEvent) error {
	return ctx.Ctx.DB.CreateInBatches(events, 100).Error
}

// GetPoolStats 获取流动性池统计信息
func (s *LiquidityPoolService) GetPoolStats(chainId int64) (map[string]interface{}, error) {
	var stats map[string]interface{} = make(map[string]interface{})

	// 总池子数
	var totalPools int64
	err := ctx.Ctx.DB.Model(&model.LiquidityPool{}).Where("chain_id = ? AND is_active = ?", chainId, true).Count(&totalPools).Error
	if err != nil {
		return nil, err
	}
	stats["totalPools"] = totalPools

	// 总事件数
	var totalEvents int64
	err = ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).Where("chain_id = ?", chainId).Count(&totalEvents).Error
	if err != nil {
		return nil, err
	}
	stats["totalEvents"] = totalEvents

	// 今日事件数
	var todayEvents int64
	err = ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).Where("chain_id = ? AND created_at::date = CURRENT_DATE", chainId).Count(&todayEvents).Error
	if err != nil {
		return nil, err
	}
	stats["todayEvents"] = todayEvents

	// 活跃用户数
	var activeUsers int64
	err = ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).Where("chain_id = ?", chainId).
		Distinct("user_address").Count(&activeUsers).Error
	if err != nil {
		return nil, err
	}
	stats["activeUsers"] = activeUsers

	return stats, nil
}

// GetTopPools 获取交易量最大的流动性池
func (s *LiquidityPoolService) GetTopPools(chainId int64, limit int) ([]model.LiquidityPool, error) {
	var pools []model.LiquidityPool
	err := ctx.Ctx.DB.Where("chain_id = ? AND is_active = ?", chainId, true).
		Order("tx_count DESC").Limit(limit).Find(&pools).Error
	return pools, err
}

// GetRecentEvents 获取最近的事件
func (s *LiquidityPoolService) GetRecentEvents(chainId int64, limit int) ([]model.LiquidityPoolEvent, error) {
	var events []model.LiquidityPoolEvent
	err := ctx.Ctx.DB.Where("chain_id = ?", chainId).
		Order("created_at DESC").Limit(limit).Find(&events).Error
	return events, err
}

// GetPoolVolume 获取池子的交易量统计
func (s *LiquidityPoolService) GetPoolVolume(chainId int64, poolAddress string, days int) (map[string]interface{}, error) {
	var stats map[string]interface{} = make(map[string]interface{})

	// 总交易量
	var totalVolume int64
	err := ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).
		Where("chain_id = ? AND pool_address = ? AND event_type = ?", chainId, poolAddress, "Swap").
		Count(&totalVolume).Error
	if err != nil {
		return nil, err
	}
	stats["totalVolume"] = totalVolume

	// 指定天数内的交易量
	var periodVolume int64
	err = ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{}).
		Where("chain_id = ? AND pool_address = ? AND event_type = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
			chainId, poolAddress, "Swap", days).
		Count(&periodVolume).Error
	if err != nil {
		return nil, err
	}
	stats["periodVolume"] = periodVolume

	return stats, nil
}

// GetLiquidityStats 获取流动性统计信息
func (s *LiquidityPoolService) GetLiquidityStats(req *model.LiquidityStatsRequest) (*model.LiquidityStatsResponse, error) {
	stats := &model.LiquidityStatsResponse{}

	// 获取我的流动性价值
	myLiquidityValue, err := s.calculateMyLiquidityValue(req.UserAddress, req.ChainId)
	if err != nil {
		return nil, err
	}
	stats.MyLiquidityValue = fmt.Sprintf("$%.2f", myLiquidityValue)

	// 获取我的流动性变化率
	periodChange, err := s.calculateMyLiquidityPeriodChange(req.UserAddress, req.ChainId, req.Period)
	if err != nil {
		return nil, err
	}
	stats.MyLiquidityPeriodChange = fmt.Sprintf("%+.1f%%", periodChange*100)

	// 获取累计手续费
	totalFees, err := s.calculateTotalFees(req.ChainId)
	if err != nil {
		return nil, err
	}
	stats.TotalFees = fmt.Sprintf("$%.2f", totalFees)

	// 获取今日手续费变化量
	feesTodayChange, err := s.calculateFeesTodayChange(req.ChainId)
	if err != nil {
		return nil, err
	}
	stats.TotalFeesTodayChange = fmt.Sprintf("+$%.2f", feesTodayChange)

	// 获取活跃池子数量
	activePoolsCount, err := s.getActivePoolsCount(req.ChainId)
	if err != nil {
		return nil, err
	}
	stats.ActivePoolsCount = activePoolsCount

	// 获取总池子数量
	totalPoolsCount, err := s.getTotalPoolsCount(req.ChainId)
	if err != nil {
		return nil, err
	}
	stats.TotalPoolsCount = totalPoolsCount

	return stats, nil
}

// calculateMyLiquidityValue 计算我的流动性总价值
func (s *LiquidityPoolService) calculateMyLiquidityValue(userAddress string, chainId int64) (float64, error) {
	var totalValue float64

	// 查询用户参与的流动性池事件
	var userEvents []model.LiquidityPoolEvent
	query := ctx.Ctx.DB.Where("user_address = ?", userAddress)
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	err := query.Find(&userEvents).Error
	if err != nil {
		return 0, err
	}

	// 计算每个池子的流动性价值
	poolValues := make(map[string]float64)
	for _, event := range userEvents {
		// 获取池子当前价格
		var pool model.LiquidityPool
		err := ctx.Ctx.DB.Where("pool_address = ? AND chain_id = ?", event.PoolAddress, event.ChainId).
			First(&pool).Error
		if err != nil {
			continue
		}

		// 计算用户在该池子的LP代币价值
		price, _ := new(big.Float).SetString(pool.Price)
		if price == nil {
			continue
		}

		// 简化计算：假设用户LP代币价值与池子总价值成比例
		// 实际应该根据用户LP代币数量计算
		poolValue, _ := price.Float64()
		poolValues[event.PoolAddress] = poolValue
	}

	// 累加所有池子的价值
	for _, value := range poolValues {
		totalValue += value
	}

	return totalValue, nil
}

// calculateMyLiquidityPeriodChange 计算我的流动性变化率
func (s *LiquidityPoolService) calculateMyLiquidityPeriodChange(userAddress string, chainId int64, period string) (float64, error) {
	// 获取当前流动性价值
	currentValue, err := s.calculateMyLiquidityValue(userAddress, chainId)
	if err != nil {
		return 0, err
	}

	// 获取周期开始时的流动性价值
	startTime := s.getPeriodStartTime(period)
	previousValue, err := s.getHistoricalLiquidityValue(userAddress, chainId, startTime)
	if err != nil {
		return 0, err
	}

	if previousValue == 0 {
		return 0, nil
	}

	return (currentValue - previousValue) / previousValue, nil
}

// calculateTotalFees 计算累计手续费
func (s *LiquidityPoolService) calculateTotalFees(chainId int64) (float64, error) {
	var totalFees float64

	// 查询所有Swap事件，计算手续费
	// 假设手续费为交易量的0.3%
	var swapEvents []model.LiquidityPoolEvent
	query := ctx.Ctx.DB.Where("event_type = ?", "Swap")
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	err := query.Find(&swapEvents).Error
	if err != nil {
		return 0, err
	}

	for _, event := range swapEvents {
		// 计算交易量（取较大的输入或输出）
		amount0In, _ := new(big.Float).SetString(event.Amount0In)
		amount1In, _ := new(big.Float).SetString(event.Amount1In)
		amount0Out, _ := new(big.Float).SetString(event.Amount0Out)
		amount1Out, _ := new(big.Float).SetString(event.Amount1Out)

		var volume *big.Float
		if amount0In != nil && amount0In.Sign() > 0 {
			volume = amount0In
		} else if amount1In != nil && amount1In.Sign() > 0 {
			volume = amount1In
		} else if amount0Out != nil && amount0Out.Sign() > 0 {
			volume = amount0Out
		} else if amount1Out != nil && amount1Out.Sign() > 0 {
			volume = amount1Out
		}

		if volume != nil {
			// 手续费率为0.3%
			fee := new(big.Float).Mul(volume, big.NewFloat(0.003))
			feeFloat, _ := fee.Float64()
			totalFees += feeFloat
		}
	}

	return totalFees, nil
}

// calculateFeesTodayChange 计算今日手续费变化量
func (s *LiquidityPoolService) calculateFeesTodayChange(chainId int64) (float64, error) {
	// 获取今日手续费
	var todayFees float64
	query := ctx.Ctx.DB.Where("event_type = ? AND created_at::date = CURRENT_DATE", "Swap")
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	var todayEvents []model.LiquidityPoolEvent
	err := query.Find(&todayEvents).Error
	if err != nil {
		return 0, err
	}

	for _, event := range todayEvents {
		amount0In, _ := new(big.Float).SetString(event.Amount0In)
		if amount0In != nil {
			fee := new(big.Float).Mul(amount0In, big.NewFloat(0.003))
			feeFloat, _ := fee.Float64()
			todayFees += feeFloat
		}
	}

	return todayFees, nil
}

// getActivePoolsCount 获取活跃池子数量
func (s *LiquidityPoolService) getActivePoolsCount(chainId int64) (int, error) {
	var count int64
	query := ctx.Ctx.DB.Model(&model.LiquidityPool{}).Where("is_active = ?", true)
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	err := query.Count(&count).Error
	return int(count), err
}

// getTotalPoolsCount 获取总池子数量
func (s *LiquidityPoolService) getTotalPoolsCount(chainId int64) (int, error) {
	var count int64
	query := ctx.Ctx.DB.Model(&model.LiquidityPool{})
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	err := query.Count(&count).Error
	return int(count), err
}

// getPeriodStartTime 获取周期开始时间
func (s *LiquidityPoolService) getPeriodStartTime(period string) time.Time {
	now := time.Now()
	switch period {
	case "today":
		return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		return now.AddDate(0, 0, -7)
	case "month":
		return now.AddDate(0, -1, 0)
	default:
		return time.Time{} // 所有时间
	}
}

// getHistoricalLiquidityValue 获取历史流动性价值
func (s *LiquidityPoolService) getHistoricalLiquidityValue(userAddress string, chainId int64, startTime time.Time) (float64, error) {
	// 简化实现：查询指定时间点之后的用户事件
	var historicalValue float64

	var userEvents []model.LiquidityPoolEvent
	query := ctx.Ctx.DB.Where("user_address = ? AND created_at >= ?", userAddress, startTime)
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	err := query.Find(&userEvents).Error
	if err != nil {
		return 0, err
	}

	// 简化计算：使用事件发生时的价格估算历史价值
	for _, event := range userEvents {
		price, _ := new(big.Float).SetString(event.Price)
		if price != nil {
			priceFloat, _ := price.Float64()
			historicalValue += priceFloat
		}
	}

	return historicalValue, nil
}
