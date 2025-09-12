package sync

import (
	"context"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/chainclient/evm"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"math/big"
	"strconv"
	"sync"
	"time"
)

func StartSync(c context.Context) {
	var wg sync.WaitGroup
	for chainId := range ctx.Ctx.ChainMap {
		wg.Add(1)
		go func(chainId int) {
			defer wg.Done()
			evmClient := ctx.GetClient(chainId).(*evm.Evm)
			if evmClient == nil {
				log.Logger.Error("链客户端获取失败，无法启动监听", zap.Int("chain_id", chainId))
				return
			}
			log.Logger.Info("chainId is " + strconv.Itoa(chainId) + "start monitoring log...")
			//查询数据库的最后一次区块
			var chain model.Chain
			err := ctx.Ctx.DB.Model(&model.Chain{}).Where("chain_id = ?", int64(chainId)).First(&chain).Error
			if err != nil {
				log.Logger.Error("查询链信息失败", zap.Int("chain_id", chainId), zap.Error(err))
				return
			}
			lastBlockNum := chain.LastBlockNum

			// Staked事件的topic hash
			stakedTopic := crypto.Keccak256Hash([]byte("Staked(address,uint256,address,uint256,uint256,uint256)")).Hex()
			// Withdrawn事件的topic hash
			withdrawnTopic := crypto.Keccak256Hash([]byte("Withdrawn(address,uint256,address,uint256,uint256)")).Hex()
			ticker := time.NewTicker(12 * time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-c.Done():
					log.Logger.Info("定时任务已停止", zap.Int("chain_id", chainId))
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
						log.Logger.Info("当前区块高度不足，跳过本次执行", zap.Int("chain_id", chainId), zap.Uint64("last_BlockNum", lastBlockNum), zap.Uint64("current_block", currentBlock))
						continue
					}
					//当断开链接很久时，分批次拉取日志，一次拉取1000个块的日志
					if targetBlockNum-lastBlockNum > 1000 {
						targetBlockNum = lastBlockNum + 1000
					}
					log.Logger.Info("开始监听log日志", zap.Uint64("form_block", lastBlockNum), zap.Uint64("to_block", targetBlockNum))
					// 这里需要实现具体的日志查询逻辑
					logs, err := evmClient.GetFilterLogs(big.NewInt(int64(lastBlockNum)), big.NewInt(int64(targetBlockNum)), chain.Address)
					if err != nil {
						log.Logger.Error("GetFilterLogs failed!", zap.Error(err))
						return
					}
					if len(logs) == 0 {
						log.Logger.Info("GetFilterLogs is empty")
						return
					}
					var userOperationRecords []*model.UserOperationRecord
					// 解析日志并保存到数据库
					for _, vLog := range logs {
						// 解析日志数据
						if len(vLog.Topics) == 0 {
							continue
						}
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
						default:
							log.Logger.Info("未知的日志类型", zap.String("tx_hash", vLog.TxHash.Hex()))
						}
					}
					log.Logger.Info("解析日志成功，条数为。", zap.Int("log_count", len(userOperationRecords)))
					txErr := updateDbUserAmount(userOperationRecords, chainId, targetBlockNum)
					if txErr != nil {
						log.Logger.Error("log监听到的数据保存数据库失败，事务处理失败", zap.Error(txErr))
					} else {
						lastBlockNum = targetBlockNum + 1
					}

				}
			}
		}(chainId)
	}
	//一直等待
	wg.Wait()
}

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

func updateDbUserAmount(userOperationRecords []*model.UserOperationRecord, chainId int, targetBlockNum uint64) error {
	if len(userOperationRecords) == 0 {
		// 更新链的最后区块号
		if err := ctx.Ctx.DB.Model(&model.Chain{}).Where("chain_id = ?", int64(chainId)).Update("last_block_num", targetBlockNum).Error; err != nil {
			log.Logger.Error("更新最后区块号失败", zap.Int("chain_id", chainId), zap.Error(err))
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
		// 更新链的最后区块号
		if err := tx.Model(&model.Chain{}).Where("chain_id = ?", int64(chainId)).Update("last_block_num", targetBlockNum).Error; err != nil {
			log.Logger.Error("更新最后区块号失败", zap.Int("chain_id", chainId), zap.Error(err))
			return err
		}
		return nil
	})
	return txErr
}
