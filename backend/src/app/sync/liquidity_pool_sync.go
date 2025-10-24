package sync

import (
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/mumu/cryptoSwap/src/abi"
	"github.com/mumu/cryptoSwap/src/app/api"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// parseLiquidityPoolEvent 解析流动性池事件
func parseLiquidityPoolEvent(vLog types.Log, chainId int, address string) *model.LiquidityPoolEvent {
	if len(vLog.Topics) == 0 {
		return nil
	}

	topic0 := vLog.Topics[0].Hex()

	// Swap事件解析
	if topic0 == crypto.Keccak256Hash([]byte("Swap(address,uint256,uint256,uint256,uint256,address)")).Hex() {
		return parseSwapEvent(vLog, chainId, address)
	}

	// Mint事件解析
	if topic0 == crypto.Keccak256Hash([]byte("Mint(address,uint256,uint256)")).Hex() {
		return parseMintEvent(vLog, chainId, address)
	}

	// Burn事件解析
	if topic0 == crypto.Keccak256Hash([]byte("Burn(address,uint256,uint256,address)")).Hex() {
		return parseBurnEvent(vLog, chainId, address)
	}

	return nil
}
func getPoolTokenAddressesFromContract(poolAddress string, chainId int) (string, string, error) {
	// 使用ABI管理器单例获取UniswapV2Pair ABI
	var err error
	abiManager := abi.GetABIManager()
	uniswapV2PairABI, flag := abiManager.GetABI("UniswapV2Pair")
	if !flag {
		log.Logger.Error("获取UniswapV2Pair ABI失败")
		return "", "", fmt.Errorf("获取ABI失败: %w", flag)
	}

	contractAddress := common.HexToAddress(poolAddress)

	rpcURL := api.GetRPCURL(chainId)
	if rpcURL == "" {
		err := fmt.Errorf("未找到对应链的RPC端点")
		log.Logger.Error("获取RPC URL失败", zap.Int("chain_id", chainId), zap.Error(err))
		return "", "", err
	}
	// 建立区块链连接
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		err := fmt.Errorf("连接区块链失败")
		log.Logger.Error("连接区块链失败", zap.Error(err))
		return "", "", fmt.Errorf("连接区块链失败: %w", err)
	}
	defer client.Close()
	// 正确创建合约实例：明确三个角色（可共用client，但语义更清晰）
	var contract = bind.NewBoundContract(
		contractAddress,  // 合约地址
		uniswapV2PairABI, // 合约ABI
		client,           // 用于调用只读方法（caller）
		client,           // 用于发送交易（transactor）
		client,           // 用于过滤日志（filterer）
	) // 调用token0()函数获取代币0地址
	// 调用token0()函数获取代币0地址
	token0Address := new(common.Address)
	if err := contract.Call(&bind.CallOpts{}, &[]any{token0Address}, "token0"); err != nil {
		log.Logger.Error("获取token0地址失败", zap.Error(err))
		return "", "", fmt.Errorf("获取token0失败: %w", err)
	}

	// 调用token1()函数获取代币1地址
	token1Address := new(common.Address)
	if err := contract.Call(&bind.CallOpts{}, &[]any{token1Address}, "token1"); err != nil {
		log.Logger.Error("获取token1地址失败", zap.Error(err))
		return "", "", fmt.Errorf("获取token1失败: %w", err)
	}

	return token0Address.Hex(), token1Address.Hex(), nil
}

// getPoolTokenAddresses 获取池子的代币地址（优先从数据库获取，失败则从合约获取）
func getPoolTokenAddresses(poolAddress string, chainId int) (string, string) {
	var pool model.LiquidityPool
	err := ctx.Ctx.DB.Where("pool_address = ? AND chain_id = ?", poolAddress, chainId).First(&pool).Error
	if err != nil {
		log.Logger.Warn("查询流动性池代币地址失败，尝试从合约获取",
			zap.String("pool_address", poolAddress),
			zap.Int("chain_id", chainId),
			zap.Error(err))

		// 从合约获取代币地址
		token0Address, token1Address, err := getPoolTokenAddressesFromContract(poolAddress, chainId)
		if err != nil {
			log.Logger.Error("从合约获取代币地址失败",
				zap.String("pool_address", poolAddress),
				zap.Int("chain_id", chainId),
				zap.Error(err))
			// 返回默认值，避免空字符串
			return "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"
		}

		//// 更新数据库中的代币地址
		//if err := updatePoolTokenAddresses(poolAddress, chainId, token0Address, token1Address); err != nil {
		//	log.Logger.Warn("更新数据库代币地址失败",
		//		zap.String("pool_address", poolAddress),
		//		zap.Int("chain_id", chainId),
		//		zap.Error(err))
		//}

		return token0Address, token1Address
	}

	// 检查代币地址是否为默认值，如果是则重新从合约获取
	if pool.Token0Address == "0x0000000000000000000000000000000000000000" ||
		pool.Token1Address == "0x0000000000000000000000000000000000000000" {
		log.Logger.Info("检测到默认代币地址，重新从合约获取",
			zap.String("pool_address", poolAddress),
			zap.Int("chain_id", chainId))

		token0Address, token1Address, err := getPoolTokenAddressesFromContract(poolAddress, chainId)
		if err != nil {
			log.Logger.Error("从合约获取代币地址失败",
				zap.String("pool_address", poolAddress),
				zap.Int("chain_id", chainId),
				zap.Error(err))
			return pool.Token0Address, pool.Token1Address
		}

		// 更新数据库中的代币地址
		if err := updatePoolTokenAddresses(poolAddress, chainId, token0Address, token1Address); err != nil {
			log.Logger.Warn("更新数据库代币地址失败",
				zap.String("pool_address", poolAddress),
				zap.Int("chain_id", chainId),
				zap.Error(err))
		}

		return token0Address, token1Address
	}

	return pool.Token0Address, pool.Token1Address
}

// updatePoolTokenAddresses 更新数据库中的代币地址
func updatePoolTokenAddresses(poolAddress string, chainId int, token0Address, token1Address string) error {
	return ctx.Ctx.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "pool_address"},
			{Name: "chain_id"},
		},
		UpdateAll: true,
	}).Create(&model.LiquidityPool{
		PoolAddress:   poolAddress,
		ChainId:       int64(chainId),
		Token0Address: token0Address,
		Token1Address: token1Address,
	}).Error
}

// parseSwapEvent 解析Swap事件
func parseSwapEvent(vLog types.Log, chainId int, address string) *model.LiquidityPoolEvent {
	if len(vLog.Topics) < 3 || len(vLog.Data) < 128 {
		return nil
	}

	// Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)
	sender := common.BytesToAddress(vLog.Topics[1].Bytes()).Hex()
	_ = common.BytesToAddress(vLog.Topics[2].Bytes()).Hex() // to address (not used in current implementation)

	data := vLog.Data
	amount0In := new(big.Int).SetBytes(common.TrimLeftZeroes(data[0:32]))
	amount1In := new(big.Int).SetBytes(common.TrimLeftZeroes(data[32:64]))
	amount0Out := new(big.Int).SetBytes(common.TrimLeftZeroes(data[64:96]))
	amount1Out := new(big.Int).SetBytes(common.TrimLeftZeroes(data[96:128]))
	// 获取池子的代币地址
	token0Address, token1Address := getPoolTokenAddresses(vLog.Address.Hex(), chainId)
	return &model.LiquidityPoolEvent{
		ChainId:       int64(chainId),
		TxHash:        vLog.TxHash.Hex(),
		BlockNumber:   int64(vLog.BlockNumber),
		EventType:     "Swap",
		PoolAddress:   vLog.Address.Hex(),
		Token0Address: token0Address,
		Token1Address: token1Address,
		UserAddress:   address,
		CallerAddress: sender,
		Amount0In:     amount0In.String(),  // 改为字符串
		Amount1In:     amount1In.String(),  // 改为字符串
		Amount0Out:    amount0Out.String(), // 改为字符串
		Amount1Out:    amount1Out.String(), // 改为字符串
		Reserve0:      "0",                 // 改为字符串
		Reserve1:      "0",                 // 改为字符串
		Price:         "0",                 // 改为字符串
		Liquidity:     "0",                 // 改为字符串
	}
}

// parseMintEvent 解析Mint事件
func parseMintEvent(vLog types.Log, chainId int, address string) *model.LiquidityPoolEvent {
	if len(vLog.Topics) < 2 || len(vLog.Data) < 64 {
		return nil
	}

	// Mint(address indexed sender, uint amount0, uint amount1)
	sender := common.BytesToAddress(vLog.Topics[1].Bytes()).Hex()

	data := vLog.Data
	amount0 := new(big.Int).SetBytes(common.TrimLeftZeroes(data[0:32]))
	amount1 := new(big.Int).SetBytes(common.TrimLeftZeroes(data[32:64]))
	// 获取池子的代币地址
	token0Address, token1Address := getPoolTokenAddresses(vLog.Address.Hex(), chainId)
	return &model.LiquidityPoolEvent{
		ChainId:       int64(chainId),
		TxHash:        vLog.TxHash.Hex(),
		BlockNumber:   int64(vLog.BlockNumber),
		EventType:     "AddLiquidity",
		PoolAddress:   vLog.Address.Hex(),
		Token0Address: token0Address,
		Token1Address: token1Address,
		UserAddress:   address,
		CallerAddress: sender,
		Amount0In:     amount0.String(), // 改为字符串
		Amount1In:     amount1.String(), // 改为字符串
		Amount0Out:    "0",              // 改为字符串
		Amount1Out:    "0",              // 改为字符串
		Reserve0:      "0",              // 改为字符串
		Reserve1:      "0",              // 改为字符串
		Price:         "0",              // 改为字符串
		Liquidity:     "0",              // 改为字符串
	}
}

// parseBurnEvent 解析Burn事件
func parseBurnEvent(vLog types.Log, chainId int, address string) *model.LiquidityPoolEvent {
	if len(vLog.Topics) < 3 || len(vLog.Data) < 64 {
		return nil
	}

	// Burn(address indexed sender, uint amount0, uint amount1, address indexed to)
	sender := common.BytesToAddress(vLog.Topics[1].Bytes()).Hex()
	_ = common.BytesToAddress(vLog.Topics[2].Bytes()).Hex() // to address (not used in current implementation)

	data := vLog.Data
	amount0 := new(big.Int).SetBytes(common.TrimLeftZeroes(data[0:32]))
	amount1 := new(big.Int).SetBytes(common.TrimLeftZeroes(data[32:64]))
	// 获取池子的代币地址
	token0Address, token1Address := getPoolTokenAddresses(vLog.Address.Hex(), chainId)
	return &model.LiquidityPoolEvent{
		ChainId:       int64(chainId),
		TxHash:        vLog.TxHash.Hex(),
		BlockNumber:   int64(vLog.BlockNumber),
		EventType:     "RemoveLiquidity",
		PoolAddress:   vLog.Address.Hex(),
		Token0Address: token0Address,
		Token1Address: token1Address,
		UserAddress:   address,
		CallerAddress: sender,
		Amount0In:     "0",              // 改为字符串
		Amount1In:     "0",              // 改为字符串
		Amount0Out:    amount0.String(), // 改为字符串
		Amount1Out:    amount1.String(), // 改为字符串
		Reserve0:      "0",              // 改为字符串
		Reserve1:      "0",              // 改为字符串
		Price:         "0",              // 改为字符串
		Liquidity:     "0",              // 改为字符串
	}
}

// saveLiquidityPoolEvents 保存流动性池事件到数据库
func saveLiquidityPoolEvents(events []*model.LiquidityPoolEvent, chainId int, targetBlockNum uint64, addresses string) error {
	if len(events) == 0 {
		return updateLiquidityPoolBlockNumber(chainId, targetBlockNum, addresses)
	}

	return ctx.Ctx.DB.Transaction(func(tx *gorm.DB) error {
		// 批量插入流动性池事件
		if err := tx.CreateInBatches(events, 100).Error; err != nil {
			log.Logger.Error("批量插入流动性池事件失败", zap.Error(err))
			return err
		}

		// 更新流动性池信息
		if err := updateLiquidityPoolInfo(tx, events); err != nil {
			log.Logger.Error("更新流动性池信息失败", zap.Error(err))
			return err
		}

		// 根据事件标记对应的任务为已完成（自动验证类）
		for _, e := range events {
			switch e.EventType {
			case "Swap":
				if err := markTaskCompleted(tx, e.UserAddress, "Swap Once"); err != nil {
					log.Logger.Warn("标记任务完成失败", zap.Error(err), zap.String("task", "Swap Once"), zap.String("user", e.UserAddress))
				}
			case "AddLiquidity":
				if err := markTaskCompleted(tx, e.UserAddress, "Provide Liquidity"); err != nil {
					log.Logger.Warn("标记任务完成失败", zap.Error(err), zap.String("task", "Provide Liquidity"), zap.String("user", e.UserAddress))
				}
			}
		}

		// 更新区块号
		return updateLiquidityPoolBlockNumber(chainId, targetBlockNum, addresses)
	})
}

// 根据任务名将用户任务状态设为完成（2）。仅作用于 verify_type = 'auto' 的任务。
func markTaskCompleted(tx *gorm.DB, walletAddress, taskName string) error {
	addr := strings.ToLower(walletAddress)
	return tx.Exec(`
        INSERT INTO user_task_status (wallet_address, task_id, user_status, updated_at)
        SELECT ?, t.task_id, 2, NOW()
        FROM tasks t
        WHERE t.task_name = ? AND t.verify_type = 'auto'
        ON CONFLICT (wallet_address, task_id)
        DO UPDATE SET user_status = 2, updated_at = NOW()
    `, addr, taskName).Error
}

// calculatePrice 计算代币价格
func calculatePrice(reserve0, reserve1 *big.Int) string {
	if reserve0.Cmp(big.NewInt(0)) == 0 {
		return "0"
	}

	// price = reserve1 / reserve0
	price := new(big.Float).Quo(
		new(big.Float).SetInt(reserve1),
		new(big.Float).SetInt(reserve0),
	)

	return price.Text('f', 18) // 保留18位小数
}

// updateLiquidityPoolInfo 更新流动性池信息
func updateLiquidityPoolInfo(tx *gorm.DB, events []*model.LiquidityPoolEvent) error {
	// 按池子地址分组
	poolEvents := make(map[string][]*model.LiquidityPoolEvent)
	for _, event := range events {
		poolEvents[event.PoolAddress] = append(poolEvents[event.PoolAddress], event)
	}

	for poolAddress, poolEventList := range poolEvents {
		// 检查池子是否存在
		var pool model.LiquidityPool
		err := tx.Where("pool_address = ? AND chain_id = ?", poolAddress, poolEventList[0].ChainId).First(&pool).Error
		if err == gorm.ErrRecordNotFound {
			// 创建新的流动性池记录前，先获取真实的代币地址
			token0Address, token1Address, err := getPoolTokenAddressesFromContract(poolAddress, int(poolEventList[0].ChainId))
			if err != nil {
				log.Logger.Warn("创建流动性池时获取代币地址失败，使用默认值",
					zap.String("pool_address", poolAddress),
					zap.Int64("chain_id", poolEventList[0].ChainId),
					zap.Error(err))
				token0Address = "0x0000000000000000000000000000000000000000"
				token1Address = "0x0000000000000000000000000000000000000000"
			}

			// 创建新的流动性池记录
			pool = model.LiquidityPool{
				ChainId:        poolEventList[0].ChainId,
				PoolAddress:    poolAddress,
				Token0Address:  token0Address, // 使用从合约获取的真实地址
				Token1Address:  token1Address, // 使用从合约获取的真实地址
				Token0Symbol:   "",            // 暂时留空
				Token1Symbol:   "",            // 暂时留空
				Token0Decimals: 0,             // 默认值
				Token1Decimals: 0,             // 默认值
				Reserve0:       "0",           // 默认值
				Reserve1:       "0",           // 默认值
				TotalSupply:    "0",           // 默认值
				Price:          "0",           // 默认值
				Volume24h:      "0",           // 默认值
				TxCount:        0,             // 默认值
				LastBlockNum:   poolEventList[len(poolEventList)-1].BlockNumber,
				IsActive:       true,
			}

			if err := tx.Create(&pool).Error; err != nil {
				log.Logger.Error("创建流动性池记录失败", zap.Error(err))
				return err
			}
		} else if err != nil {
			log.Logger.Error("查询流动性池记录失败", zap.Error(err))
			return err
		} else {
			// 更新现有池子的区块号
			if err := tx.Model(&pool).Update("last_block_num", poolEventList[len(poolEventList)-1].BlockNumber).Error; err != nil {
				log.Logger.Error("更新流动性池区块号失败", zap.Error(err))
				return err
			}
		}

		// 更新交易计数
		if err := tx.Model(&pool).Update("tx_count", gorm.Expr("tx_count + ?", len(poolEventList))).Error; err != nil {
			log.Logger.Error("更新流动性池交易计数失败", zap.Error(err))
			return err
		}
		// 直接从Uniswap V2池子合约获取最新储备量
		reserve0, reserve1, totalSupply, err := api.GetPoolReserves(poolAddress, int(poolEventList[0].ChainId))
		if err != nil {
			log.Logger.Warn("获取链上储备量失败", zap.Error(err))
			// 使用默认值继续处理
			reserve0 = big.NewInt(0)
			reserve1 = big.NewInt(0)
			totalSupply = big.NewInt(0)
		}

		// 计算价格
		price := calculatePrice(reserve0, reserve1)

		// 更新池子信息
		if err := tx.Model(&pool).Updates(map[string]interface{}{
			"reserve0": reserve0.String(),
			"reserve1": reserve1.String(),
			//"liquidity":    totalSupply.String(),
			"total_supply": totalSupply.String(),
			"price":        price,
		}).Error; err != nil {
			log.Logger.Error("更新流动性池信息失败", zap.Error(err))
			return err
		}
	}

	return nil
}

// updateLiquidityPoolBlockNumber 更新流动性池监听的区块号
func updateLiquidityPoolBlockNumber(chainId int, blockNumber uint64, address string) error {
	// 更新流动性池服务配置的区块号
	return ctx.Ctx.DB.Model(&model.Chain{}).Where("chain_id = ? AND address = ?", int64(chainId), address).Update("last_block_num", blockNumber).Error
}
