package api

import (
	"context"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/abi" // 添加abi包导入
	"github.com/mumu/cryptoSwap/src/app/api/dto"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/app/service"
	commonUtil "github.com/mumu/cryptoSwap/src/common"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"github.com/mumu/cryptoSwap/src/core/result"
	"go.uber.org/zap"
)

type LiquidityPoolApi struct {
	svc *service.LiquidityPoolService
}

func NewLiquidityPoolApi() *LiquidityPoolApi {
	return &LiquidityPoolApi{
		svc: service.NewLiquidityPoolService(),
	}
}

func parsePagination(pageStr, pageSizeStr string) dto.Pagination {
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return dto.Pagination{Page: page, PageSize: pageSize, Offset: (page - 1) * pageSize}
}

// GetRPCURL 根据chainId获取RPC端点
func GetRPCURL(chainId int) string {
	rpcMap := map[int]string{
		11155111: "https://sepolia.infura.io/v3/a6dc9c34bc0c480e9acf43659fc37b1b", // Ropsten Testnet
		1:        "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",                  // Ethereum Mainnet
		5:        "https://goerli.infura.io/v3/YOUR_PROJECT_ID",                   // Goerli Testnet
		56:       "https://bsc-dataseed.binance.org/",                             // BSC Mainnet (PancakeSwap)
		97:       "https://data-seed-prebsc-1-s1.binance.org:8545/",               // BSC Testnet
		137:      "https://polygon-rpc.com/",                                      // Polygon Mainnet
		80001:    "https://rpc-mumbai.matic.today",                                // Polygon Testnet
		42161:    "https://arb1.arbitrum.io/rpc",                                  // Arbitrum Mainnet
		421613:   "https://goerli-rollup.arbitrum.io/rpc",                         // Arbitrum Testnet
		10:       "https://mainnet.optimism.io",                                   // Optimism Mainnet
		420:      "https://goerli.optimism.io",                                    // Optimism Testnet
	}
	return rpcMap[chainId]
}

// GetPoolReserves 直接从 Uniswap V2 池子合约获取储备量
func GetPoolReserves(poolAddress string, chainId int) (reserve0, reserve1, totalSupply *big.Int, err error) {
	rpcURL := GetRPCURL(chainId)
	if rpcURL == "" {
		return nil, nil, nil, fmt.Errorf("不支持的 chainId: %d", chainId)
	}

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, nil, nil, err
	}
	defer client.Close()

	contractAddress := common.HexToAddress(poolAddress)

	// 使用ABI管理器单例获取UniswapV2Pair ABI
	abiManager := abi.GetABIManager()
	uniswapV2PairABI, exists := abiManager.GetABI("UniswapV2Pair")
	if !exists {
		return nil, nil, nil, fmt.Errorf("UniswapV2Pair ABI 未找到")
	}

	// 调用 getReserves 函数
	reservesData, err := uniswapV2PairABI.Pack("getReserves")
	if err != nil {
		return nil, nil, nil, err
	}

	msg := ethereum.CallMsg{
		To:   &contractAddress,
		Data: reservesData,
	}

	reservesResult, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return nil, nil, nil, err
	}

	var reserves struct {
		Reserve0           *big.Int
		Reserve1           *big.Int
		BlockTimestampLast uint32
	}

	err = uniswapV2PairABI.UnpackIntoInterface(&reserves, "getReserves", reservesResult)
	if err != nil {
		return nil, nil, nil, err
	}

	// 调用 totalSupply 函数
	supplyData, err := uniswapV2PairABI.Pack("totalSupply")
	if err != nil {
		return nil, nil, nil, err
	}

	msg.Data = supplyData
	supplyResult, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return nil, nil, nil, err
	}

	err = uniswapV2PairABI.UnpackIntoInterface(&totalSupply, "totalSupply", supplyResult)
	if err != nil {
		return nil, nil, nil, err
	}

	return reserves.Reserve0, reserves.Reserve1, totalSupply, nil
}

// GetUserLPTokenBalance 获取用户在 Uniswap V2 池子中的 LP 代币余额
func GetUserLPTokenBalance(poolAddress, userAddress string, chainId int) (*big.Int, error) {
	rpcURL := GetRPCURL(chainId)
	if rpcURL == "" {
		return nil, fmt.Errorf("不支持的 chainId: %d", chainId)
	}

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	contractAddress := common.HexToAddress(poolAddress)
	ownerAddress := common.HexToAddress(userAddress)

	// 使用ABI管理器单例获取UniswapV2Pair ABI
	abiManager := abi.GetABIManager()
	uniswapV2PairABI, exists := abiManager.GetABI("UniswapV2Pair")
	if !exists {
		return nil, fmt.Errorf("UniswapV2Pair ABI 未找到")
	}

	// 调用 balanceOf 函数
	balanceData, err := uniswapV2PairABI.Pack("balanceOf", ownerAddress)

	msg := ethereum.CallMsg{
		To:   &contractAddress,
		Data: balanceData,
	}

	balanceResult, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return nil, err
	}

	var balance *big.Int
	err = uniswapV2PairABI.UnpackIntoInterface(&balance, "balanceOf", balanceResult)
	if err != nil {
		return nil, err
	}

	return balance, nil
}

// GetUserLiquidityPoolsByLPToken 根据用户LP代币余额获取参与的流动性池
func GetUserLiquidityPoolsByLPToken(c *gin.Context) {
	userAddress := c.Query("userAddress")
	chainIdStr := c.Query("chainId")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "20")

	if userAddress == "" {
		result.Error(c, result.InvalidParameter)
		return
	}

	chainId, err := strconv.ParseInt(chainIdStr, 10, 64)
	if err != nil && chainIdStr != "" {
		result.Error(c, result.InvalidParameter)
		return
	}

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	// 1. 查询所有流动性池信息
	var allPools []model.LiquidityPool
	query := ctx.Ctx.DB.Model(&model.LiquidityPool{}).Where("is_active = ?", true)
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	if err := query.Find(&allPools).Error; err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	if len(allPools) == 0 {
		result.OK(c, gin.H{
			"pools":    []model.LiquidityPool{},
			"total":    0,
			"page":     page,
			"pageSize": pageSize,
		})
		return
	}

	// 2. 查询每个池子的LP代币余额
	var userPools []model.LiquidityPool
	for _, pool := range allPools {
		// 直接调用Uniswap V2池子合约的balanceOf函数
		balance, err := GetUserLPTokenBalance(pool.PoolAddress, userAddress, int(chainId))
		if err != nil {
			// 查询失败，跳过这个池子
			log.Logger.Warn("查询LP代币余额失败",
				zap.String("pool", pool.PoolAddress),
				zap.Error(err))
			continue
		}

		// 如果余额大于0，添加到结果中
		if balance.Cmp(big.NewInt(0)) > 0 {
			userPools = append(userPools, pool)
		}
	}

	// 3. 分页处理
	total := len(userPools)
	start := offset
	end := offset + pageSize
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	var pagedPools []model.LiquidityPool
	if start < end {
		pagedPools = userPools[start:end]
	}

	result.OK(c, gin.H{
		"pools":    pagedPools,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetUserLiquidityPools 根据用户地址获取参与的流动性池
func GetUserLiquidityPools(c *gin.Context) {
	userAddress := c.Query("userAddress")
	chainIdStr := c.Query("chainId")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "20")

	if !commonUtil.ValidateHexAddress(userAddress) {
		result.Error(c, result.InvalidParameter)
		return
	}
	chainId, ok := commonUtil.ParseChainId(chainIdStr)
	if !ok {
		result.Error(c, result.InvalidParameter)
		return
	}
	pg := parsePagination(pageStr, pageSizeStr)

	// 查询用户参与过的流动性池地址（去重）
	poolAddresses, err := service.NewLiquidityPoolService().ListUserPoolAddresses(userAddress, chainId)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	if len(poolAddresses) == 0 {
		result.OK(c, gin.H{
			"pools":    []model.LiquidityPool{},
			"total":    0,
			"page":     pg.Page,
			"pageSize": pg.PageSize,
		})
		return
	}

	// 根据池子地址查询完整的流动性池信息
	pools, total, err := service.NewLiquidityPoolService().ListActivePoolsByAddressesPaged(poolAddresses, chainId, pg.Offset, pg.PageSize)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	result.OK(c, gin.H{
		"pools":    pools,
		"total":    total,
		"page":     pg.Page,
		"pageSize": pg.PageSize,
	})
}

// GetLiquidityPools 获取流动性池列表
func GetLiquidityPools(c *gin.Context) {
	chainIdStr := c.Query("chainId")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "20")

	chainId, ok := commonUtil.ParseChainId(chainIdStr)
	if !ok {
		result.Error(c, result.InvalidParameter)
		return
	}
	pg := parsePagination(pageStr, pageSizeStr)

	pools, total, err := service.NewLiquidityPoolService().ListActivePools(chainId, pg.Offset, pg.PageSize)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	result.OK(c, gin.H{
		"pools":    pools,
		"total":    total,
		"page":     pg.Page,
		"pageSize": pg.PageSize,
	})
}

// GetLiquidityPoolEvents 获取流动性池事件列表
func (lp *LiquidityPoolApi) GetLiquidityPoolEvents(c *gin.Context) {
	poolAddress := c.Query("poolAddress")
	eventType := c.Query("eventType")
	userAddress := c.Query("userAddress")
	chainIdStr := c.Query("chainId")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "20")

	chainId, ok := commonUtil.ParseChainId(chainIdStr)
	if !ok {
		result.Error(c, result.InvalidParameter)
		return
	}
	pg := parsePagination(pageStr, pageSizeStr)

	var events []model.LiquidityPoolEvent
	var total int64

	query := ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{})

	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}
	if poolAddress != "" {
		query = query.Where("pool_address = ?", poolAddress)
	}
	if eventType != "" {
		query = query.Where("event_type = ?", eventType)
	}
	if userAddress != "" {
		query = query.Where("user_address = ?", userAddress)
	}

	if err := query.Count(&total).Error; err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	if err := query.Offset(pg.Offset).Limit(pg.PageSize).Order("created_at DESC").Find(&events).Error; err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	result.OK(c, gin.H{
		"events":   events,
		"total":    total,
		"page":     pg.Page,
		"pageSize": pg.PageSize,
	})
}

// GetLiquidityStats 处理流动性统计请求
func (lp *LiquidityPoolApi) GetLiquidityStats(c *gin.Context) {
	// 绑定请求参数
	var req model.LiquidityStatsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 参数验证
	if req.UserAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户地址不能为空"})
		return
	}

	// 初始化服务

	service := service.NewLiquidityPoolService()

	// 获取统计数据
	stats, err := service.GetLiquidityStats(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回响应
	result.OK(c, gin.H{
		"myLiquidityValue":        stats.MyLiquidityValue,
		"myLiquidityPeriodChange": stats.MyLiquidityPeriodChange,
		"totalFees":               stats.TotalFees,
		"totalFeesTodayChange":    stats.TotalFeesTodayChange,
		"activePoolsCount":        stats.ActivePoolsCount,
		"totalPoolsCount":         stats.TotalPoolsCount,
	})
}

// GetLiquidityPoolStats 获取流动性池统计信息
func (lp *LiquidityPoolApi) GetLiquidityPoolStats(c *gin.Context) {
	chainIdStr := c.Query("chainId")

	var chainId int64
	if chainIdStr != "" {
		var err error
		chainId, err = strconv.ParseInt(chainIdStr, 10, 64)
		if err != nil {
			result.Error(c, result.InvalidParameter)
			return
		}
	}

	query := ctx.Ctx.DB.Model(&model.LiquidityPool{}).Where("is_active = ?", true)
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	var totalPools int64
	if err := query.Count(&totalPools).Error; err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	// 查询事件统计
	eventQuery := ctx.Ctx.DB.Model(&model.LiquidityPoolEvent{})
	if chainId > 0 {
		eventQuery = eventQuery.Where("chain_id = ?", chainId)
	}

	var totalEvents int64
	if err := eventQuery.Count(&totalEvents).Error; err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	// 查询今日事件数
	var todayEvents int64
	if err := eventQuery.Where("created_at::date = CURRENT_DATE").Count(&todayEvents).Error; err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	result.OK(c, gin.H{
		"poolPair":  totalPools,
		"24hVolume": totalEvents,
	})
}

// GetPoolPerformanceRequest 池子表现请求参数
type GetPoolPerformanceRequest struct {
	WalletAddress string `json:"walletAddress" binding:"required"`
	Page          int    `json:"page"`
	PageSize      int    `json:"pageSize"`
}

// GetPoolPerformance 返回用户相关池子的 24 小时交易量表现
func (lp *LiquidityPoolApi) GetPoolPerformance(c *gin.Context) {
	var req GetPoolPerformanceRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.WalletAddress == "" {
		result.Error(c, result.InvalidParameter)
		return
	}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 || req.PageSize > 100 {
		req.PageSize = 20
	}

	offset := (req.Page - 1) * req.PageSize

	addrs, err := lp.svc.ListUserPoolAddresses(req.WalletAddress, 0)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	var pools []model.LiquidityPool
	var total int64

	if len(addrs) == 0 {
		result.OK(c, gin.H{
			"total": 0,
			"list":  []dto.PoolPerformanceItemDTO{},
		})
		return
	}

	pools, total, err = lp.svc.ListActivePoolsByAddressesPaged(addrs, 0, offset, req.PageSize)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	items := make([]dto.PoolPerformanceItemDTO, 0, len(pools))
	for _, p := range pools {
		vol, _, _ := lp.svc.Compute24hStats(p)
		pair := fmt.Sprintf("%s/%s", p.Token0Symbol, p.Token1Symbol)
		items = append(items, dto.PoolPerformanceItemDTO{
			PoolPair:  pair,
			Volume24h: formatUSD(vol),
		})
	}

	result.OK(c, gin.H{
		"total": total,
		"list":  items,
	})
}

// GetRewardDistributionRequest 收益分布请求参数
type GetRewardDistributionRequest struct {
	WalletAddress string `json:"walletAddress" binding:"required"`
	Page          int    `json:"page"`
	PageSize      int    `json:"pageSize"`
}

// GetRewardDistribution 流动性收益分布
func (lp *LiquidityPoolApi) GetRewardDistribution(c *gin.Context) {
	var req GetRewardDistributionRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.WalletAddress == "" {
		result.Error(c, result.InvalidParameter)
		return
	}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 || req.PageSize > 100 {
		req.PageSize = 20
	}

	offset := (req.Page - 1) * req.PageSize

	// 查询该用户涉及的池子
	addrs, err := lp.svc.ListUserPoolAddresses(req.WalletAddress, 0)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	var pools []model.LiquidityPool
	var total int64

	if len(addrs) == 0 {
		result.OK(c, gin.H{
			"total": 0,
			"list":  []dto.RewardDistributionItemDTO{},
		})
		return
	}

	pools, total, err = lp.svc.ListActivePoolsByAddressesPaged(addrs, 0, offset, req.PageSize)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	// 计算每个池子的“累计收益”与近7天增长率（近7天与前7天对比）
	now := time.Now()
	last7Start := now.Add(-7 * 24 * time.Hour)
	prev7Start := now.Add(-14 * 24 * time.Hour)

	items := make([]dto.RewardDistributionItemDTO, 0, len(pools))
	for _, p := range pools {
		// 以当前24h手续费近似累计收益的代表（如需历史累计，可后续扩充）
		_, fees24h, _ := lp.svc.Compute24hStats(p)

		// 近7天与前7天比较计算增长率
		feesLast7 := lp.svc.ComputeFeesUSDForPeriod(p, last7Start, now)
		feesPrev7 := lp.svc.ComputeFeesUSDForPeriod(p, prev7Start, last7Start)
		var growth string
		if feesPrev7 <= 0 && feesLast7 <= 0 {
			growth = "0.0%"
		} else if feesPrev7 <= 0 && feesLast7 > 0 {
			growth = "+100.0%"
		} else {
			rate := ((feesLast7 - feesPrev7) / feesPrev7) * 100
			// 保留一位小数并带符号
			if rate >= 0 {
				growth = fmt.Sprintf("+%.1f%%", rate)
			} else {
				growth = fmt.Sprintf("%.1f%%", rate)
			}
		}

		pair := fmt.Sprintf("%s/%s", p.Token0Symbol, p.Token1Symbol)
		items = append(items, dto.RewardDistributionItemDTO{
			PoolPair:     pair,
			RewardAmount: formatUSD(fees24h),
			Icon:         "https://example.com",
			GrowthRate:   growth,
		})
	}

	result.OK(c, gin.H{
		"total": total,
		"list":  items,
	})
}

// PostLiquidityPools 按照需求返回池子列表（支持 all/my），并计算 24hVolume、24hFees、APY
type LiquidityPoolsRequest struct {
	WalletAddress string `json:"walletAddress" binding:"required"`
	Page          int    `json:"page"`
	PageSize      int    `json:"pageSize"`
	PoolType      string `json:"poolType"` // all 或 my，默认 all
}

func (lp *LiquidityPoolApi) PostLiquidityPools(c *gin.Context) {
	var req LiquidityPoolsRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.WalletAddress == "" {
		result.Error(c, result.InvalidParameter)
		return
	}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 || req.PageSize > 100 {
		req.PageSize = 20
	}
	if req.PoolType == "" {
		req.PoolType = "all"
	}

	offset := (req.Page - 1) * req.PageSize

	var pools []model.LiquidityPool
	var total int64

	if req.PoolType == "my" {
		addrs, err := lp.svc.ListUserPoolAddresses(req.WalletAddress, 0)
		if err != nil {
			result.Error(c, result.DBQueryFailed)
			return
		}
		pools, total, err = lp.svc.ListActivePoolsByAddressesPaged(addrs, 0, offset, req.PageSize)
		if err != nil {
			result.Error(c, result.DBQueryFailed)
			return
		}
	} else {
		//使用短变量声明会在此作用域内创建新的局部变量，而不是使用外部声明的变量。
		//因此，即使内部赋值了，外部的pools和total仍然是零值，导致后续处理时数据丢失。
		var err error
		pools, total, err = lp.svc.ListActivePools(0, offset, req.PageSize)
		if err != nil {
			result.Error(c, result.DBQueryFailed)
			return
		}
	}

	// 组装返回并计算统计
	items := make([]dto.PoolListItemDTO, 0, len(pools))
	for _, p := range pools {
		volUSD, feesUSD, apy := lp.svc.Compute24hStats(p)

		name := fmt.Sprintf("%s/%s", p.Token0Symbol, p.Token1Symbol)
		items = append(items, dto.PoolListItemDTO{
			PoolId:    fmt.Sprintf("%d", p.Id),
			PoolName:  name,
			Icon:      "https://example.com",
			APY:       apy,
			Volume24h: formatUSD(volUSD),
			Fees24h:   formatUSD(feesUSD),
		})
	}

	result.OK(c, gin.H{
		"total": total,
		"list":  items,
	})
}

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

func formatUSD(v float64) string {
	if v <= 0 {
		return "$0"
	}
	// K/M/B 格式化
	if v >= 1_000_000_000 {
		return fmt.Sprintf("$%.1fB", v/1_000_000_000)
	}
	if v >= 1_000_000 {
		return fmt.Sprintf("$%.1fM", v/1_000_000)
	}
	if v >= 1_000 {
		return fmt.Sprintf("$%.1fK", v/1_000)
	}
	return fmt.Sprintf("$%.2f", v)
}

// --- helpers to reduce duplication ---
// getUserPoolAddresses 根据用户地址（可选链ID）查询其涉及的去重池子地址
func getUserPoolAddresses(userAddress string, chainIdOpt int64) ([]string, error) {
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

// listActivePoolsByAddresses 根据地址列表（可选链ID）查询活跃池子
func listActivePoolsByAddresses(addresses []string, chainIdOpt int64) ([]model.LiquidityPool, error) {
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

// makePairAndVolumeItem 将池子格式化为包含交易对与24小时交易量的条目
func makePairAndVolumeItem(p model.LiquidityPool, svc *service.LiquidityPoolService) gin.H {
	volUSD, _, _ := svc.Compute24hStats(p)
	pair := fmt.Sprintf("%s/%s", p.Token0Symbol, p.Token1Symbol)
	return gin.H{
		"poolPair":  pair,
		"24hVolume": formatUSD(volUSD),
	}
}

//func (lp *LiquidityPoolApi) PoolMappingHandler(c *gin.Context) error {
//	poolMap, err := c.service.GetPoolMapping()
//	if err != nil {
//		log.Error("Unable to fetch pool table data: %v", err)
//		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
//	}
//
//	return c.JSON(poolMap)
//}
