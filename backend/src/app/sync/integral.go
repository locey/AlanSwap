package sync

import (
	"fmt"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"github.com/robfig/cron/v3"
	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"strconv"
	"time"
)

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
