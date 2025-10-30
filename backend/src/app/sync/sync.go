package sync

import (
	"context"
	"math/big"
	"strconv"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/chainclient/evm"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func StartSync(c context.Context) {
	// 启动：定时重建默克尔树与上链更新（每60秒）
	//go StartMerkleAutoUpdate(c, 60*time.Second)
	var wg sync.WaitGroup
	// 查询所有链信息
	// 查询所有链信息
	var chains []model.Chain
	// 修复：直接查询所有链信息，而不是循环查询
	err := ctx.Ctx.DB.Model(&model.Chain{}).Find(&chains).Error
	if err != nil {
		log.Logger.Error("查询所有链信息失败", zap.Error(err))
		return
	}

	if len(chains) == 0 {
		log.Logger.Warn("未找到任何链配置信息")
		return
	}
	log.Logger.Info("开始启动统一事件监听", zap.Int("chain_count", len(chains)))
	// 为每条链启动事件监听
	for _, chain := range chains {
		wg.Add(1)
		go func(chain model.Chain) {
			defer wg.Done()

			chainId := int(chain.ChainId)
			evmClient := ctx.GetClient(chainId).(*evm.Evm)
			if evmClient == nil {
				log.Logger.Error("链客户端获取失败，无法启动监听", zap.Int("chain_id", chainId))
				return
			}

			log.Logger.Info("启动统一事件监听",
				zap.Int("chain_id", chainId))

			lastBlockNum := chain.LastBlockNum

			// 定义所有需要监听的事件topic hash
			// 质押池事件
			stakedTopic := crypto.Keccak256Hash([]byte("Staked(address,uint256,address,uint256,uint256,uint256)")).Hex()
			withdrawnTopic := crypto.Keccak256Hash([]byte("Withdrawn(address,uint256,address,uint256,uint256)")).Hex()

			// 流动性池事件
			swapTopic := crypto.Keccak256Hash([]byte("Swap(address,uint256,uint256,uint256,uint256,address)")).Hex()
			mintTopic := crypto.Keccak256Hash([]byte("Mint(address,uint256,uint256)")).Hex()
			burnTopic := crypto.Keccak256Hash([]byte("Burn(address,uint256,uint256,address)")).Hex()

			// 空投事件
			rewardClaimedTopic := crypto.Keccak256Hash([]byte("RewardClaimed(uint256,address,uint256,uint256,uint256,uint256,uint256)")).Hex()
			updateTotalRewardTopic := crypto.Keccak256Hash([]byte("UpdateTotalRewardUpdated(uint256,address,uint256,uint256,uint256,uint256)")).Hex()
			airdropCreatedTopic := crypto.Keccak256Hash([]byte("AirdropCreated(uint256,string,bytes32,uint256,uint256)")).Hex()
			airdropActivatedTopic := crypto.Keccak256Hash([]byte("AirdropActivated(uint256)")).Hex()

			// 直接使用链信息中的合约地址
			contractAddresses := []string{chain.Address}
			if chain.Address == "" {
				log.Logger.Warn("链配置中未设置合约地址", zap.Int("chain_id", chainId))
				return
			}

			ticker := time.NewTicker(12 * time.Second)
			defer ticker.Stop()

			for {
				select {
				case <-c.Done():
					log.Logger.Info("统一事件监听任务已停止", zap.Int("chain_id", chainId))
					return
				case <-ticker.C:
					// 获取当前块的高度
					currentBlock, err := evmClient.GetBlockNumber()
					if err != nil {
						log.Logger.Error("获取当前区块高度失败", zap.Int("chain_id", chainId), zap.Error(err))
						continue
					}

					targetBlockNum := currentBlock - 6
					if targetBlockNum <= lastBlockNum {
						log.Logger.Debug("当前区块高度不足，跳过本次执行",
							zap.Int("chain_id", chainId),
							zap.Uint64("last_BlockNum", lastBlockNum),
							zap.Uint64("current_block", currentBlock))
						continue
					}

					// 当断开链接很久时，分批次拉取日志，一次拉取1000个块的日志
					if targetBlockNum-lastBlockNum > 1000 {
						targetBlockNum = lastBlockNum + 1000
					}

					log.Logger.Info("开始监听事件日志",
						zap.Uint64("from_block", lastBlockNum),
						zap.Uint64("to_block", targetBlockNum),
						zap.String("contract_address", chain.Address))

					// 监听链配置中的合约地址的事件
					// 修改：合并循环获取日志和错误处理
					var allLogs []types.Log
					for _, address := range contractAddresses {
						logs, err := evmClient.GetFilterLogs(big.NewInt(int64(lastBlockNum)), big.NewInt(int64(targetBlockNum)), address)
						if err != nil {
							log.Logger.Error("GetFilterLogs failed!", zap.String("address", address), zap.Error(err))
							continue
						}
						allLogs = append(allLogs, logs...)
					}

					if len(allLogs) == 0 {
						log.Logger.Debug("GetFilterLogs is empty")
						//即使没有事件也要更新区块高度
						if err := updateBlockNumber(chainId, targetBlockNum, chain.Address); err != nil {
							log.Logger.Error("更新区块高度失败", zap.Error(err))
						} else {
							lastBlockNum = targetBlockNum + 1
						}
						continue
					}

					var userOperationRecords []*model.UserOperationRecord
					var liquidityPoolEvents []*model.LiquidityPoolEvent
					var airdropEvents *AirdropEvents
					//var rewardClaimedEvents []*model.RewardClaimedEvent
					//var totalRewardUpdatedEvents []*model.TotalRewardUpdatedEvent
					//var airdropCreatedEvents []*AirdropCreatedInfo
					//var airdropActivatedIds []string
					// 获取交易发送者（真实用户地址）

					// 解析日志并分类处理
					for _, vLog := range allLogs {
						if len(vLog.Topics) == 0 {
							continue
						}
						address, _ := evmClient.GetUserAddress(vLog)

						topic0 := vLog.Topics[0].Hex()
						switch topic0 {
						case stakedTopic:
							stakedStruct := analysisStakedTopic(vLog, chainId)
							if stakedStruct != nil {
								userOperationRecords = append(userOperationRecords, stakedStruct)
							}
						case withdrawnTopic:
							withdrawnStruct := analysisWithdrawnTopic(vLog, chainId)
							if withdrawnStruct != nil {
								userOperationRecords = append(userOperationRecords, withdrawnStruct)
							}
						case swapTopic, mintTopic, burnTopic:
							event := parseLiquidityPoolEvent(vLog, chainId, address)
							if event != nil {
								liquidityPoolEvents = append(liquidityPoolEvents, event)
							}
						case rewardClaimedTopic, updateTotalRewardTopic, airdropCreatedTopic, airdropActivatedTopic:
							// 处理空投相关事件
							if airdropEvents == nil {
								airdropEvents = &AirdropEvents{}
							}
							parsedEvents := ParseAirdropEvents(vLog, chainId, address)
							if parsedEvents != nil {
								// 合并解析到的事件
								airdropEvents.RewardClaimedEvents = append(airdropEvents.RewardClaimedEvents, parsedEvents.RewardClaimedEvents...)
								airdropEvents.TotalRewardUpdatedEvents = append(airdropEvents.TotalRewardUpdatedEvents, parsedEvents.TotalRewardUpdatedEvents...)
								airdropEvents.AirdropCreatedEvents = append(airdropEvents.AirdropCreatedEvents, parsedEvents.AirdropCreatedEvents...)
								airdropEvents.AirdropActivatedIds = append(airdropEvents.AirdropActivatedIds, parsedEvents.AirdropActivatedIds...)
							}
						default:
							log.Logger.Debug("未知的事件类型",
								zap.String("topic0", topic0),
								zap.String("tx_hash", vLog.TxHash.Hex()))
						}
					}

					// 分别处理不同类型的事件
					success := true

					if len(userOperationRecords) > 0 {
						log.Logger.Info("解析质押池事件成功", zap.Int("event_count", len(userOperationRecords)))
						if err := updateDbUserAmount(userOperationRecords, chainId, targetBlockNum, chain.Address); err != nil {
							log.Logger.Error("保存质押池事件失败", zap.Error(err))
							success = false
						}
					}

					if len(liquidityPoolEvents) > 0 {
						log.Logger.Info("解析流动性池事件成功", zap.Int("event_count", len(liquidityPoolEvents)))
						if err := saveLiquidityPoolEvents(liquidityPoolEvents, chainId, targetBlockNum, chain.Address); err != nil {
							log.Logger.Error("保存流动性池事件失败", zap.Error(err))
							success = false
						}
					}

					// 统一保存空投事件
					if airdropEvents != nil {
						if err := SaveAirdropEvents(airdropEvents, chainId, targetBlockNum, chain.Address); err != nil {
							log.Logger.Error("保存空投事件失败", zap.Error(err))
							success = false
						}
					}

					// 如果所有事件处理成功，更新区块高度
					if success {
						if len(userOperationRecords) == 0 && len(liquidityPoolEvents) == 0 && (airdropEvents == nil ||
							(len(airdropEvents.RewardClaimedEvents) == 0 &&
								len(airdropEvents.TotalRewardUpdatedEvents) == 0 &&
								len(airdropEvents.AirdropCreatedEvents) == 0 &&
								len(airdropEvents.AirdropActivatedIds) == 0)) {
							// 没有事件时也要更新区块高度
							if err := updateBlockNumber(chainId, targetBlockNum, chain.Address); err != nil {
								log.Logger.Error("更新区块高度失败", zap.Error(err))
							} else {
								lastBlockNum = targetBlockNum + 1
							}
						} else {
							lastBlockNum = targetBlockNum + 1
						}
					}
				}
			}
		}(chain)
	}

	//一直等待
	wg.Wait()
}

// updateBlockNumber 更新区块高度
func updateBlockNumber(chainId int, blockNum uint64, address string) error {
	return ctx.Ctx.DB.Model(&model.Chain{}).
		Where("chain_id = ? AND address = ?", int64(chainId), address).
		Update("last_block_num", blockNum).Error
}

// analysisStakedTopic 解析质押事件
func analysisStakedTopic(vLog types.Log, chainId int) *model.UserOperationRecord {
	// 修改:更新日志解析逻辑以匹配新的事件格式
	if len(vLog.Topics) >= 4 && len(vLog.Data) >= 96 {
		// user在topics[1]中 (indexed)
		user := common.BytesToAddress(vLog.Topics[1].Bytes()).Hex()

		// poolId在topics[2]中 (indexed)
		poolId := new(big.Int).SetBytes(common.TrimLeftZeroes(vLog.Topics[2].Bytes()))

		// tokenAddress在topics[3]中 (indexed)
		tokenAddress := common.BytesToAddress(vLog.Topics[3].Bytes()).Hex()

		// amount, stakedAt, unlockTime在data中
		data := vLog.Data
		amount := new(big.Int).SetBytes(common.TrimLeftZeroes(data[0:32]))
		stakedAt := new(big.Int).SetBytes(common.TrimLeftZeroes(data[32:64]))
		unlockTime := new(big.Int).SetBytes(common.TrimLeftZeroes(data[64:96]))

		// 创建质押记录并保存到数据库
		userOperationRecord := model.UserOperationRecord{
			ChainId:       int64(chainId),
			Address:       user,
			PoolId:        poolId.Int64(), // 修改:将big.Int转换为int64
			TokenAddress:  tokenAddress,
			Amount:        amount.Int64(),
			OperationTime: time.UnixMilli(stakedAt.Int64()),
			UnlockTime:    time.UnixMilli(unlockTime.Int64()),
			TxHash:        vLog.TxHash.Hex(),
			BlockNumber:   int64(vLog.BlockNumber),
			EventType:     "Staked",
		}
		return &userOperationRecord
	}
	return nil
}

// analysisWithdrawnTopic 解析提现事件
func analysisWithdrawnTopic(vLog types.Log, chainId int) *model.UserOperationRecord {
	if len(vLog.Topics) >= 4 && len(vLog.Data) >= 64 {
		// user在topics[1]中 (indexed)
		user := common.BytesToAddress(vLog.Topics[1].Bytes()).Hex()

		// poolId在topics[2]中 (indexed)
		poolId := new(big.Int).SetBytes(common.TrimLeftZeroes(vLog.Topics[2].Bytes()))

		// tokenAddress在topics[3]中 (indexed)
		tokenAddress := common.BytesToAddress(vLog.Topics[3].Bytes()).Hex()

		// amount, withdrawnAt在data中
		data := vLog.Data
		amount := new(big.Int).SetBytes(common.TrimLeftZeroes(data[0:32]))
		withdrawnAt := new(big.Int).SetBytes(common.TrimLeftZeroes(data[32:64]))

		// 创建提现记录并保存到数据库 (复用StakedRecord模型)
		userOperationRecord := model.UserOperationRecord{
			ChainId:       int64(chainId),
			Address:       user,
			PoolId:        poolId.Int64(), // 修改:将big.Int转换为int64
			TokenAddress:  tokenAddress,
			Amount:        amount.Int64(),
			OperationTime: time.UnixMilli(withdrawnAt.Int64()), // 解除质押时间
			//UnlockTime:    ni,                                 // 不再使用此字段
			TxHash:      vLog.TxHash.Hex(),
			BlockNumber: int64(vLog.BlockNumber),
			EventType:   "Withdrawn",
		}
		return &userOperationRecord
	}
	return nil
}

// updateDbUserAmount 更新数据库用户金额
func updateDbUserAmount(userOperationRecords []*model.UserOperationRecord, chainId int, targetBlockNum uint64, address string) error {
	if len(userOperationRecords) == 0 {
		// 更新质押池服务配置的最后区块号
		if err := ctx.Ctx.DB.Model(&model.Chain{}).Where("chain_id = ? AND address = ?", int64(chainId), address).Update("last_block_num", targetBlockNum).Error; err != nil {
			log.Logger.Error("更新质押池最后区块号失败", zap.Int("chain_id", chainId), zap.Error(err))
			return err
		}
		log.Logger.Info("更新数据表最后区块号成功" + strconv.Itoa(int(targetBlockNum)))
		return nil
	}
	txErr := ctx.Ctx.DB.Transaction(func(tx *gorm.DB) error {
		// 批量插入用户操作记录
		if err := tx.CreateInBatches(userOperationRecords, 100).Error; err != nil {
			log.Logger.Error("批量插入用户操作记录失败", zap.Error(err))
			return err
		}

		// 根据质押事件标记对应的任务为已完成（自动验证类）
		for _, record := range userOperationRecords {
			if record.EventType == "Staked" {
				if err := markTaskCompleted(tx, record.Address, "Stake Once"); err != nil {
					log.Logger.Warn("标记质押任务完成失败", zap.Error(err), zap.String("task", "Stake Once"), zap.String("user", record.Address))
				}
			}
		}

		type userTokenKey struct {
			Address      string
			TokenAddress string
		}
		userAmounts := make(map[userTokenKey]*big.Int)
		for _, record := range userOperationRecords {
			key := userTokenKey{
				Address:      record.Address,
				TokenAddress: record.TokenAddress,
			}
			amount := big.NewInt(record.Amount)
			if userAmounts[key] == nil {
				userAmounts[key] = big.NewInt(0)
			}
			if record.EventType == "Staked" {
				userAmounts[key].Add(userAmounts[key], amount)
			} else if record.EventType == "Withdrawn" {
				userAmounts[key].Sub(userAmounts[key], amount)
			}
		}
		//更新每个用户tokenAddress总金额
		for key, amount := range userAmounts {
			// 修改:使用UPSERT操作处理用户记录不存在的情况
			if err := tx.Exec(`
                                    INSERT INTO users (chain_id, token_address, address, total_amount, last_block_num)
                                    VALUES (?, ?, ?, ?, ?)
                                    ON CONFLICT (chain_id, token_address, address)
                                    DO UPDATE SET
                                        total_amount = users.total_amount + ?,
                                        last_block_num = ?
                                `, chainId, key.TokenAddress, key.Address, amount.Int64(), targetBlockNum, amount.Int64(), targetBlockNum).Error; err != nil {
				log.Logger.Error("更新用户总金额失败", zap.String("user", key.Address), zap.String("token_address", key.TokenAddress), zap.String("amount", amount.String()), zap.Error(err))
				return err
			}
		}
		// 更新质押池服务配置的最后区块号
		if err := tx.Model(&model.Chain{}).Where("chain_id = ? AND address = ?", int64(chainId), address).Update("last_block_num", targetBlockNum).Error; err != nil {
			log.Logger.Error("更新质押池最后区块号失败", zap.Int("chain_id", chainId), zap.Error(err))
			return err
		}
		return nil
	})
	return txErr
}
