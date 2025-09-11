package sync

import (
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/chainclient/evm"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"github.com/robfig/cron/v3"
	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"math/big"
	"strconv"
	"sync"
	"time"
)

func StartSync(c context.Context) {
	//如果是集群环境，则需要增加集群锁
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
			//这里使用goroutine进行处理，比如多链，则开多个，进行处理，一个goroutine处理一个chain
			//记录每个chain的质押记录，存放到数据库
			//当获取到一个质押记录，或者提取记录，则修改用户表中的汇总金额

			//查询数据库的最后一次区块
			var chain model.Chain
			err := ctx.Ctx.DB.Model(&model.Chain{}).Where("chain_id = ?", int64(chainId)).First(&chain).Error
			if err != nil {
				log.Logger.Error("查询链信息失败", zap.Int("chain_id", chainId), zap.Error(err))
				return
			}
			lastBlockNum := chain.LastBlockNum
			fmt.Println(lastBlockNum)

			// Staked事件的topic hash
			// 修改:更新stakedTopic日志格式
			stakedTopic := crypto.Keccak256Hash([]byte("Staked(address,uint256,address,uint256,uint256,uint256)")).Hex()
			// Withdrawn事件的topic hash
			withdrawnTopic := crypto.Keccak256Hash([]byte("Withdrawn(address,uint256,address,uint256,uint256)")).Hex()

			// 开启定时任务，每12秒执行一次
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
					targetBlockNum := int64(currentBlock - 6)
					if targetBlockNum <= lastBlockNum {
						log.Logger.Info("当前区块高度不足，跳过本次执行",
							zap.Int("chain_id", chainId),
							zap.Int64("last_BlockNum", lastBlockNum),
							zap.Uint64("current_block", currentBlock))
						continue
					}
					log.Logger.Info("开始监听log日志", zap.Int64("form_block", lastBlockNum), zap.Int64("to_block", targetBlockNum))
					// 这里需要实现具体的日志查询逻辑
					logs, err := evmClient.GetFilterLogs(big.NewInt(lastBlockNum), big.NewInt(targetBlockNum), chain.Address)
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
						//logData := map[string]interface{}{
						//	"address": vLog.Address.Hex(),
						//	"topics":  vLog.Topics,
						//	"data":    vLog.Data,
						//	"block_number": vLog.BlockNumber,
						//	"tx_hash": vLog.TxHash.Hex(),
						//	"tx_index": vLog.TxIndex,
						//	"block_hash": vLog.BlockHash.Hex(),
						//	"index": vLog.Index,
						//	"removed": vLog.Removed,
						//}
						if len(vLog.Topics) == 0 {
							continue
						}
						topic0 := vLog.Topics[0].Hex()
						switch topic0 {
						case stakedTopic:
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
								userOperationRecords = append(userOperationRecords, &userOperationRecord)
							}
						case withdrawnTopic:
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
								userOperationRecords = append(userOperationRecords, &userOperationRecord)
							}
						default:
							log.Logger.Info("未知的日志类型", zap.String("tx_hash", vLog.TxHash.Hex()))
						}
					}
					log.Logger.Info("解析日志成功，条数为。", zap.Int("log_count", len(userOperationRecords)))
					if len(userOperationRecords) == 0 {
						// 更新链的最后区块号
						if err := ctx.Ctx.DB.Model(&model.Chain{}).Where("chain_id = ?", int64(chainId)).Update("last_block_num", targetBlockNum).Error; err != nil {
							log.Logger.Error("更新最后区块号失败", zap.Int("chain_id", chainId), zap.Error(err))
							return
						}
						lastBlockNum = targetBlockNum
						log.Logger.Info("更新数据表最后区块号成功")
						return
					}
					txErr := ctx.Ctx.DB.Transaction(func(tx *gorm.DB) error {
						// 批量插入用户操作记录
						if err := tx.CreateInBatches(userOperationRecords, 100).Error; err != nil {
							log.Logger.Error("批量插入用户操作记录失败", zap.Error(err))
							return err
						}

						// 循环遍历userOperationRecords得到总金额，更新用户表总金额字段
						// 这里可以按用户分组统计总金额并更新用户表
						// 示例代码：
						// 修改:使用Address和TokenAddress组合作为唯一键进行加减法运算
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
					if txErr != nil {
						log.Logger.Error("保存log监听，事务处理失败", zap.Error(txErr))
					} else {
						// 更新内存中的最后区块号
						lastBlockNum = targetBlockNum
					}

				}
			}
		}(chainId)
	}
	//一直等待
	wg.Wait()
}

func InitComputeIntegral() {
	c := cron.New()
	_, err := c.AddFunc("0 * * * *", computeIntegral)
	if err != nil {
		fmt.Printf("添加定时任务失败: %v\n", err)
		return
	}
	c.Start()
	defer c.Stop()
	// 阻塞主线程，防止程序退出
	fmt.Println("定时任务已启动，每整点执行一次...")
	select {}
}
func computeIntegral() {
	currentTime := time.Now()
	var scoreRules []model.ScoreRules
	if err := ctx.Ctx.DB.Model(&model.ScoreRules{}).Find(&scoreRules).Error; err != nil {
		log.Logger.Error("查询积分规则失败", zap.Error(err))
		return
	}
	//获取积分规则
	scoreRuleMap := make(map[string]model.ScoreRules)
	for _, scoreRule := range scoreRules {
		scoreRuleMap[strconv.FormatInt(scoreRule.ChainId, 10)+scoreRule.TokenAddress] = scoreRule
	}
	for chainId := range ctx.Ctx.ChainMap {
		go func(chainId int) {
			log.Logger.Info("开始处理chainId", zap.Int("chain_id", chainId))
			//获取到chainId，只处理这一个链的数据，获取该链上的所有用户数据
			var users []model.Users
			err := ctx.Ctx.DB.Model(&model.Users{}).Where("chain_id = ?", chainId).Find(&users).Error
			if err != nil {
				log.Logger.Error("查询用户数据失败", zap.Int("chain_id", chainId), zap.Error(err))
				return
			}
			if len(users) == 0 {
				log.Logger.Info("当前链没有查询到用户数据", zap.Int("chain_id", chainId))
				return
			}
			// 现在可以通过 users 变量访问查询结果
			for _, user := range users {
				//获取规则
				rule := scoreRuleMap[strconv.FormatInt(user.ChainId, 10)+user.TokenAddress]
				var operationRecords []model.UserOperationRecord
				err := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
					Where("chain_id = ? AND token_address = ? AND address = ? AND operation_time > ? AND operation_time <= ?",
						user.ChainId, user.TokenAddress, user.Address, user.JfTime, currentTime).
					Order("operation_time ASC").
					Find(&operationRecords).Error

				if err != nil {
					log.Logger.Error("查询用户操作记录失败",
						zap.Int64("chain_id", user.ChainId),
						zap.String("token_address", user.TokenAddress),
						zap.String("address", user.Address),
						zap.Error(err))
					continue
				}
				user.JfTime = currentTime
				//历史值
				newJf := decimal.NewFromInt(user.JfAmount).Mul(rule.Score).
					Div(decimal.NewFromInt(10).Pow(decimal.NewFromInt(rule.Decimals)))
				if len(operationRecords) == 0 {
					user.Jf = user.Jf.Add(newJf)
					// 更新数据库中的用户积分信息
					if err := ctx.Ctx.DB.Model(&model.Users{}).Where("id = ?", user.Id).Updates(map[string]interface{}{
						"jf":      user.Jf,
						"jf_time": user.JfTime,
					}).Error; err != nil {
						log.Logger.Error("更新用户积分失败", zap.Error(err))
						continue
					}
				} else {
					var amount int64
					for _, record := range operationRecords {
						minutes := int64(currentTime.Sub(record.OperationTime).Minutes())
						if record.EventType == "Staked" {
							newJf.Add(decimal.NewFromInt(record.Amount).Mul(rule.Score).
								Div(decimal.NewFromInt(10).Pow(decimal.NewFromInt(rule.Decimals))).
								Mul(decimal.NewFromInt(minutes)).DivRound(decimal.NewFromInt(60), 2))
							amount += record.Amount
						} else if record.EventType == "Withdrawn" {
							newJf.Sub(decimal.NewFromInt(record.Amount).Mul(rule.Score).
								Div(decimal.NewFromInt(10).Pow(decimal.NewFromInt(rule.Decimals))).
								Mul(decimal.NewFromInt(minutes)).DivRound(decimal.NewFromInt(60), 2))
							amount -= record.Amount
						}
					}
					user.JfAmount += amount
					user.Jf = user.Jf.Add(newJf)
					// 更新数据库中的用户积分信息
					if err := ctx.Ctx.DB.Model(&model.Users{}).Where("id = ?", user.Id).Updates(map[string]interface{}{
						"jf":        user.Jf,
						"jf_time":   user.JfTime,
						"jf_amount": user.JfAmount,
					}).Error; err != nil {
						log.Logger.Error("更新用户积分失败", zap.Error(err))
						continue
					}
				}
				// 在这里可以处理operationRecords数据
				log.Logger.Info("查询到用户操作记录",
					zap.Int64("chain_id", user.ChainId),
					zap.String("token_address", user.TokenAddress),
					zap.String("address", user.Address),
					zap.Int("record_count", len(operationRecords)))
			}
		}(chainId)
	}
}
