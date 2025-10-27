package service

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/mumu/cryptoSwap/src/abi"
	"github.com/mumu/cryptoSwap/src/app/api/dto"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/contract"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type StakeService struct {
	// 私钥用于交易签名
	privateKey string
	// 质押合约地址
	stakeContractAddress string
	// ERC20代币合约地址
	erc20ContractAddress string
}

func NewStakeService() *StakeService {
	return &StakeService{
		privateKey:           "e22afa1331382e752eb5afce597290f5d14c307b613f649ae0b5c47cd84ad974", // 应该从配置文件或环境变量中获取
		stakeContractAddress: "0xEDb4C07B6AfFb61C2A2fa22cBb30552b4F7748f4",                       // 应该从配置文件或环境变量中获取
		erc20ContractAddress: "0x241bBa478bAD3945B9b122b80B756b5D19b423a5",                       // 应该从配置文件或环境变量中获取
	}
}

// ProcessStake 处理质押逻辑
func (s *StakeService) ProcessStake(userAddress string, chainId int64, amount float64, token string, poolId int64) (*model.StakeRecord, error) {
	// 1. 验证用户地址和代币有效性
	if !common.IsHexAddress(userAddress) {
		return nil, fmt.Errorf("无效的用户地址: %s", userAddress)
	}

	// 2. 获取以太坊客户端
	client := ctx.GetEvmClient(int(chainId))
	if client == nil {
		return nil, fmt.Errorf("无法获取链ID为 %d 的以太坊客户端", chainId)
	}

	// 3. 检查余额是否足够
	balance, err := s.checkTokenBalance(client, userAddress, token)
	if err != nil {
		return nil, fmt.Errorf("检查余额失败: %v", err)
	}

	// 将amount转换为最小单位（假设18位小数）
	amountInWei := decimal.NewFromFloat(amount).Mul(decimal.New(1, 18)).BigInt()
	if balance.Cmp(amountInWei) < 0 {
		return nil, fmt.Errorf("余额不足，当前余额: %s, 需要: %s", balance.String(), amountInWei.String())
	}

	// 4. 获取私钥
	privateKey, err := crypto.HexToECDSA(s.privateKey)
	if err != nil {
		return nil, fmt.Errorf("无效的私钥: %v", err)
	}

	// 5. 获取发送者地址
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("获取公钥失败")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// 6. 获取nonce
	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return nil, fmt.Errorf("获取nonce失败: %v", err)
	}

	// 7. 设置交易参数
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("获取建议gas价格失败: %v", err)
	}

	auth := bind.NewKeyedTransactor(privateKey)
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)     // in wei
	auth.GasLimit = uint64(300000) // in units
	auth.GasPrice = gasPrice

	// 8. 创建ERC20合约实例
	erc20Address := common.HexToAddress(s.erc20ContractAddress)
	abiManager := abi.GetABIManager()
	erc20ABI, exists := abiManager.GetABI("ERC20")
	if !exists {
		return nil, fmt.Errorf("ERC20 ABI未找到，请确保已调用abi.InitABIManager()")
	}

	// 创建绑定合约
	// 正确创建合约实例：明确三个角色（可共用client，但语义更清晰）
	var erc20Contract = bind.NewBoundContract(
		erc20Address, // 合约地址
		erc20ABI,     // 合约ABI
		client,       // 用于调用只读方法（caller）
		client,       // 用于发送交易（transactor）
		client,       // 用于过滤日志（filterer）
	) // 调用token0()函数获取代币0地址
	// 调用token0()函数获取代币0地址
	//erc20Contract, err := bind.NewBoundContract(erc20Address, erc20ABI, client, client, client)
	//if err != nil {
	//	return nil, fmt.Errorf("创建 ERC20 合约实例失败: %v", err)
	//}

	// 9. 创建质押合约实例
	stakeAddress := common.HexToAddress(s.stakeContractAddress)
	stakeContract, err := contract.NewAbi(stakeAddress, client)
	if err != nil {
		return nil, fmt.Errorf("创建质押合约实例失败: %v", err)
	}

	// 10. 授权质押合约使用代币
	tx, err := erc20Contract.Transact(auth, "approve", stakeAddress, amountInWei)
	if err != nil {
		return nil, fmt.Errorf("授权失败: %v", err)
	}
	if err != nil {
		return nil, fmt.Errorf("授权失败: %v", err)
	}
	log.Logger.Info("ERC20授权交易已发送", zap.String("txHash", tx.Hash().Hex()))

	// 11. 等待授权交易确认
	// 这里简化处理，实际应用中应该等待交易确认
	// 11. 等待授权交易确认（至少等待1个区块确认）
	//receipt, err := bind.WaitMined(context.Background(), client, tx)
	//if err != nil {
	//	return nil, fmt.Errorf("等待授权交易确认失败: %v", err)
	//}
	//if receipt.Status != 1 {
	//	return nil, fmt.Errorf("授权交易失败，交易状态: %d", receipt.Status)
	//}
	//log.Logger.Info("ERC20授权交易已确认", zap.String("txHash", tx.Hash().Hex()))
	//
	//// 12. 为质押交易获取新的nonce
	//nonce, err = client.PendingNonceAt(context.Background(), fromAddress)
	//if err != nil {
	//	return nil, fmt.Errorf("获取质押交易nonce失败: %v", err)
	//}
	//auth.Nonce = big.NewInt(int64(nonce))
	// 11. 为质押交易使用下一个nonce（362）
	auth.Nonce = big.NewInt(int64(nonce + 1))
	// 12. 调用质押合约进行质押
	poolIdBig := big.NewInt(poolId)
	tx, err = stakeContract.Deposit(auth, poolIdBig, amountInWei)
	if err != nil {
		return nil, fmt.Errorf("质押失败: %v", err)
	}
	log.Logger.Info("质押交易已发送", zap.String("txHash", tx.Hash().Hex()))

	// 13. 记录质押信息到UserOperationRecord表
	operationRecord := &model.UserOperationRecord{
		ChainId:       chainId,
		Address:       userAddress,
		PoolId:        poolId,
		Amount:        amountInWei.Int64(), // 存储为最小单位
		OperationTime: time.Now(),
		UnlockTime:    time.Now().Add(7 * 24 * time.Hour), // 示例：7天锁定期
		TxHash:        tx.Hash().Hex(),
		EventType:     "Staked",
		TokenAddress:  token,
	}

	if err := ctx.Ctx.DB.Create(operationRecord).Error; err != nil {
		return nil, fmt.Errorf("创建质押记录失败: %v", err)
	}

	// 14. 更新用户积分（基于ScoreRules计算）
	go s.updateUserScore(userAddress, chainId, token, amount)

	// 15. 返回StakeRecord格式的数据
	stakeRecord := &model.StakeRecord{
		ID:          operationRecord.Id,
		UserAddress: userAddress,
		ChainId:     chainId,
		Amount:      amount,
		Token:       token,
		Status:      "active",
		CreatedAt:   operationRecord.OperationTime,
		UpdatedAt:   operationRecord.OperationTime,
	}

	return stakeRecord, nil
}

// ProcessWithdraw 处理提取逻辑
func (s *StakeService) ProcessWithdraw(userAddress string, chainId int64, stakeId int64, poolId int64) (*model.StakeRecord, error) {
	// 1. 验证质押记录存在且属于该用户
	var operationRecord model.UserOperationRecord
	if err := ctx.Ctx.DB.Where("id = ? AND address = ? AND chain_id = ? AND event_type = ?",
		stakeId, userAddress, chainId, "Staked").First(&operationRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("质押记录不存在或不属于该用户")
		}
		return nil, fmt.Errorf("查询质押记录失败: %v", err)
	}

	// 2. 检查质押是否可提取（检查锁定期）
	if time.Now().Before(operationRecord.UnlockTime) {
		return nil, fmt.Errorf("质押未过锁定期，解锁时间: %s", operationRecord.UnlockTime.Format("2006-01-02 15:04:05"))
	}

	// 3. 获取以太坊客户端
	client := ctx.GetEvmClient(int(chainId))
	if client == nil {
		return nil, fmt.Errorf("无法获取链ID为 %d 的以太坊客户端", chainId)
	}

	// 4. 获取私钥
	privateKey, err := crypto.HexToECDSA(s.privateKey)
	if err != nil {
		return nil, fmt.Errorf("无效的私钥: %v", err)
	}

	// 5. 获取发送者地址
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("获取公钥失败")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// 6. 获取nonce
	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return nil, fmt.Errorf("获取nonce失败: %v", err)
	}

	// 7. 设置交易参数
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("获取建议gas价格失败: %v", err)
	}

	auth := bind.NewKeyedTransactor(privateKey)
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)     // in wei
	auth.GasLimit = uint64(300000) // in units
	auth.GasPrice = gasPrice

	// 8. 创建质押合约实例
	stakeAddress := common.HexToAddress(s.stakeContractAddress)
	stakeContract, err := contract.NewAbi(stakeAddress, client)
	if err != nil {
		return nil, fmt.Errorf("创建质押合约实例失败: %v", err)
	}

	// 9. 调用质押合约进行提取
	poolIdBig := big.NewInt(poolId)
	amountBig := big.NewInt(operationRecord.Amount)
	tx, err := stakeContract.Withdraw(auth, poolIdBig, amountBig)
	if err != nil {
		return nil, fmt.Errorf("提取失败: %v", err)
	}
	log.Logger.Info("提取交易已发送", zap.String("txHash", tx.Hash().Hex()))

	// 10. 创建提取记录
	withdrawRecord := &model.UserOperationRecord{
		ChainId:       chainId,
		Address:       userAddress,
		PoolId:        poolId,
		Amount:        operationRecord.Amount, // 提取相同金额
		TokenAddress:  operationRecord.TokenAddress,
		OperationTime: time.Now(),
		TxHash:        tx.Hash().Hex(),
		EventType:     "withdraw",
	}

	if err := ctx.Ctx.DB.Create(withdrawRecord).Error; err != nil {
		return nil, fmt.Errorf("创建提取记录失败: %v", err)
	}

	// 11. 返回StakeRecord格式的数据
	stakeRecord := &model.StakeRecord{
		ID:          stakeId,
		UserAddress: userAddress,
		ChainId:     chainId,
		Amount:      float64(operationRecord.Amount) / 1e18, // 转换回浮点数（假设18位小数）
		Token:       operationRecord.TokenAddress,
		Status:      "withdrawn",
		CreatedAt:   operationRecord.OperationTime,
		UpdatedAt:   time.Now(),
	}

	return stakeRecord, nil
}

// GetStakeRecords 获取质押记录
func (s *StakeService) GetStakeRecords(userAddress string, chainId int64, pagination dto.Pagination) ([]model.StakeRecord, int64, error) {
	var operationRecords []model.UserOperationRecord
	var total int64

	// 构建查询条件（只查询质押事件）
	query := ctx.Ctx.DB.Where("address = ? AND event_type = ?", userAddress, "Staked")
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	// 获取总数
	if err := query.Model(&model.UserOperationRecord{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("查询记录总数失败: %v", err)
	}

	// 应用分页查询记录
	if err := query.Order("operation_time DESC").
		Offset(pagination.Offset).
		Limit(pagination.PageSize).
		Find(&operationRecords).Error; err != nil {
		return nil, 0, fmt.Errorf("查询质押记录失败: %v", err)
	}

	// 转换为StakeRecord格式
	var stakeRecords []model.StakeRecord
	for _, record := range operationRecords {
		// 检查是否已提取
		status := "active"
		var withdrawRecord model.UserOperationRecord
		if err := ctx.Ctx.DB.Where("address = ? AND chain_id = ? AND event_type = ? AND amount = ?",
			userAddress, chainId, "withdraw", record.Amount).First(&withdrawRecord).Error; err == nil {
			status = "withdrawn"
		}

		stakeRecord := model.StakeRecord{
			ID:          record.Id,
			UserAddress: record.Address,
			ChainId:     record.ChainId,
			Amount:      float64(record.Amount) / 1e18, // 假设18位小数
			Token:       record.TokenAddress,
			Status:      status,
			CreatedAt:   record.OperationTime,
			UpdatedAt:   record.OperationTime,
		}
		stakeRecords = append(stakeRecords, stakeRecord)
	}

	return stakeRecords, total, nil
}

// GetStakeOverview 获取质押概览（优化版，一次性计算所有数据）
func (s *StakeService) GetStakeOverview(userAddress string, chainId int64) (*model.StakeOverview, error) {
	now := time.Now()

	// 1. 获取用户基本信息
	var user model.Users
	userErr := ctx.Ctx.DB.Where("chain_id = ? AND address = ?", chainId, userAddress).First(&user).Error
	if userErr != nil && userErr != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("查询用户信息失败: %v", userErr)
	}

	// 2. 获取用户所有质押记录（一次性查询）
	var stakeRecords []model.UserOperationRecord
	stakeQuery := ctx.Ctx.DB.Where("address = ? AND chain_id = ? AND event_type = ?",
		userAddress, chainId, "Staked").Find(&stakeRecords)
	if stakeQuery.Error != nil {
		return nil, fmt.Errorf("查询质押记录失败: %v", stakeQuery.Error)
	}

	// 3. 计算基础数据
	var totalStaked int64
	var activeStakes int
	var totalDuration time.Duration

	for _, record := range stakeRecords {
		totalStaked += record.Amount

		// 检查是否已提取
		var withdrawRecord model.UserOperationRecord
		withdrawErr := ctx.Ctx.DB.Where("address = ? AND chain_id = ? AND event_type = ? AND amount = ?",
			userAddress, record.ChainId, "withdraw", record.Amount).First(&withdrawRecord).Error

		if withdrawErr != nil {
			// 未提取，是活跃质押
			activeStakes++
			duration := now.Sub(record.OperationTime)
			totalDuration += duration
		} else {
			// 已提取，计算历史质押时间
			duration := withdrawRecord.OperationTime.Sub(record.OperationTime)
			totalDuration += duration
		}
	}

	// 4. 计算总收益
	totalRewards := 0.0
	if userErr == nil {
		rewardRate := decimal.NewFromFloat(0.01) // 1积分 = 0.01代币
		totalRewardsDecimal := user.Jf.Mul(rewardRate)
		totalRewards, _ = totalRewardsDecimal.Float64()
	}

	// 5. 计算当月质押占比
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, -1).Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	var userMonthlyStake int64
	monthlyUserQuery := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
		Where("address = ? AND chain_id = ? AND event_type = ? AND operation_time BETWEEN ? AND ?",
			userAddress, chainId, "Staked", startOfMonth, endOfMonth)
	if err := monthlyUserQuery.Select("COALESCE(SUM(amount), 0)").Scan(&userMonthlyStake).Error; err != nil {
		return nil, fmt.Errorf("查询用户当月质押总额失败: %v", err)
	}

	var totalMonthlyStake int64
	monthlyTotalQuery := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
		Where("chain_id = ? AND event_type = ? AND operation_time BETWEEN ? AND ?",
			chainId, "Staked", startOfMonth, endOfMonth)
	if err := monthlyTotalQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalMonthlyStake).Error; err != nil {
		return nil, fmt.Errorf("查询全网当月质押总额失败: %v", err)
	}

	monthlyStakeRatio := 0.0
	if totalMonthlyStake > 0 {
		userStakeValue := float64(userMonthlyStake) / 1e18
		totalStakeValue := float64(totalMonthlyStake) / 1e18
		monthlyStakeRatio = (userStakeValue / totalStakeValue) * 100
	}

	// 6. 计算当天质押奖励
	dailyStakeRewards := 0.0
	if userErr == nil {
		// 查询昨天的积分信息
		yesterday := now.AddDate(0, 0, -1)
		startOfYesterday := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
		endOfYesterday := startOfYesterday.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

		var yesterdayUser model.Users
		yesterdayErr := ctx.Ctx.DB.Where("chain_id = ? AND address = ? AND jf_time BETWEEN ? AND ?",
			chainId, userAddress, startOfYesterday, endOfYesterday).
			Order("jf_time DESC").
			First(&yesterdayUser).Error

		var yesterdayJf decimal.Decimal
		if yesterdayErr == nil {
			yesterdayJf = yesterdayUser.Jf
		} else {
			yesterdayJf = user.Jf // 保守估计
		}

		dailyJfIncrease := user.Jf.Sub(yesterdayJf)
		if dailyJfIncrease.IsNegative() {
			dailyJfIncrease = decimal.Zero
		}

		rewardRate := decimal.NewFromFloat(0.01)
		dailyRewards := dailyJfIncrease.Mul(rewardRate)
		dailyStakeRewards, _ = dailyRewards.Float64()
	}

	// 7. 计算APY
	apy := 0.0
	if totalStaked > 0 && len(stakeRecords) > 0 {
		totalStakedValue := float64(totalStaked) / 1e18
		avgStakeDurationDays := totalDuration.Hours() / 24 / float64(len(stakeRecords))

		if avgStakeDurationDays > 0 && totalStakedValue > 0 {
			apy = (totalRewards / totalStakedValue) * (365 / avgStakeDurationDays) * 100
		}
	}

	// 8. 返回完整的概览数据
	overview := &model.StakeOverview{
		TotalStaked:       float64(totalStaked) / 1e18,
		TotalRewards:      totalRewards,
		ActiveStakes:      activeStakes,
		UserAddress:       userAddress,
		ChainId:           chainId,
		MonthlyStakeRatio: monthlyStakeRatio,
		DailyStakeRewards: dailyStakeRewards,
		APY:               apy,
	}

	return overview, nil
}

// CalculateAPY 计算年化收益率(APY)
func (s *StakeService) CalculateAPY(userAddress string, chainId int64) (float64, error) {
	// 获取用户当前总质押量
	var totalStaked int64
	query := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
		Where("address = ? AND chain_id = ? AND event_type = ?", userAddress, chainId, "Staked")

	if err := query.Select("COALESCE(SUM(amount), 0)").Scan(&totalStaked).Error; err != nil {
		return 0, fmt.Errorf("计算总质押量失败: %v", err)
	}

	if totalStaked == 0 {
		return 0, nil // 如果没有质押，APY为0
	}

	// 获取用户总收益（从积分信息计算）
	totalRewards, err := s.getUserRewards(userAddress, chainId)
	if err != nil {
		return 0, fmt.Errorf("获取用户总收益失败: %v", err)
	}

	// 计算平均质押时间（以天为单位）
	var avgStakeDurationDays float64
	var stakeRecords []model.UserOperationRecord
	stakeQuery := ctx.Ctx.DB.Where("address = ? AND chain_id = ? AND event_type = ?",
		userAddress, chainId, "Staked").Find(&stakeRecords)

	if stakeQuery.Error != nil {
		return 0, fmt.Errorf("查询质押记录失败: %v", stakeQuery.Error)
	}

	if len(stakeRecords) > 0 {
		totalDuration := time.Duration(0)
		for _, record := range stakeRecords {
			// 检查是否已提取
			var withdrawRecord model.UserOperationRecord
			withdrawErr := ctx.Ctx.DB.Where("address = ? AND chain_id = ? AND event_type = ? AND amount = ?",
				userAddress, record.ChainId, "withdraw", record.Amount).First(&withdrawRecord).Error

			if withdrawErr == nil {
				// 已提取，计算从质押到提取的时间
				duration := withdrawRecord.OperationTime.Sub(record.OperationTime)
				totalDuration += duration
			} else {
				// 未提取，计算从质押到当前时间的时间
				duration := time.Now().Sub(record.OperationTime)
				totalDuration += duration
			}
		}
		avgStakeDurationDays = totalDuration.Hours() / 24 / float64(len(stakeRecords))
	} else {
		avgStakeDurationDays = 30 // 默认30天
	}

	// 计算年化收益率
	totalStakedValue := float64(totalStaked) / 1e18

	if avgStakeDurationDays <= 0 || totalStakedValue <= 0 {
		return 0, nil
	}

	// APY = (总收益 / 总质押量) * (365 / 平均质押天数) * 100%
	apy := (totalRewards / totalStakedValue) * (365 / avgStakeDurationDays) * 100

	return apy, nil
}

// GetDailyStakeRewards 计算当天质押奖励
func (s *StakeService) GetDailyStakeRewards(userAddress string, chainId int64) (float64, error) {
	// 获取当天的开始和结束时间
	now := time.Now()
	//startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	//endOfDay := startOfDay.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	// 查询用户信息获取当前积分
	var user model.Users
	if err := ctx.Ctx.DB.Where("chain_id = ? AND address = ?", chainId, userAddress).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return 0, nil // 用户不存在，返回0收益
		}
		return 0, fmt.Errorf("查询用户信息失败: %v", err)
	}

	// 查询昨天的积分信息（用于计算当日收益）
	yesterday := now.AddDate(0, 0, -1)
	startOfYesterday := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
	endOfYesterday := startOfYesterday.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	// 查询昨天最后时刻的用户积分记录
	var yesterdayUser model.Users
	yesterdayErr := ctx.Ctx.DB.Where("chain_id = ? AND address = ? AND jf_time BETWEEN ? AND ?",
		chainId, userAddress, startOfYesterday, endOfYesterday).
		Order("jf_time DESC").
		First(&yesterdayUser).Error

	var yesterdayJf decimal.Decimal
	if yesterdayErr == nil {
		yesterdayJf = yesterdayUser.Jf
	} else {
		// 如果没有昨天的记录，使用当前积分作为基准（保守估计）
		yesterdayJf = user.Jf
	}

	// 计算当日积分增长
	dailyJfIncrease := user.Jf.Sub(yesterdayJf)
	if dailyJfIncrease.IsNegative() {
		dailyJfIncrease = decimal.Zero // 如果积分减少，当日收益为0
	}

	// 将积分转换为收益（使用与getUserRewards相同的规则）
	rewardRate := decimal.NewFromFloat(0.01) // 1积分 = 0.01代币
	dailyRewards := dailyJfIncrease.Mul(rewardRate)

	reward, _ := dailyRewards.Float64()
	return reward, nil
}

// GetMonthlyStakeValueRatio 计算当月质押总价值占比
func (s *StakeService) GetMonthlyStakeValueRatio(userAddress string, chainId int64) (float64, error) {
	// 获取当前月份的开始和结束时间
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, -1).Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	// 查询当月用户质押总额
	var userMonthlyStake int64
	userQuery := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
		Where("address = ? AND chain_id = ? AND event_type = ? AND operation_time BETWEEN ? AND ?",
			userAddress, chainId, "Staked", startOfMonth, endOfMonth)

	if err := userQuery.Select("COALESCE(SUM(amount), 0)").Scan(&userMonthlyStake).Error; err != nil {
		return 0, fmt.Errorf("查询用户当月质押总额失败: %v", err)
	}

	// 查询当月全网质押总额
	var totalMonthlyStake int64
	totalQuery := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
		Where("chain_id = ? AND event_type = ? AND operation_time BETWEEN ? AND ?",
			chainId, "Staked", startOfMonth, endOfMonth)

	if err := totalQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalMonthlyStake).Error; err != nil {
		return 0, fmt.Errorf("查询全网当月质押总额失败: %v", err)
	}

	// 计算占比
	if totalMonthlyStake == 0 {
		return 0, nil // 如果当月没有质押，占比为0
	}

	userStakeValue := float64(userMonthlyStake) / 1e18 // 转换为代币单位
	totalStakeValue := float64(totalMonthlyStake) / 1e18
	ratio := (userStakeValue / totalStakeValue) * 100 // 转换为百分比

	return ratio, nil
}

// updateUserScore 更新用户积分
func (s *StakeService) updateUserScore(userAddress string, chainId int64, token string, amount float64) {
	// 1. 获取积分规则
	var scoreRule model.ScoreRules
	if err := ctx.Ctx.DB.Where("chain_id = ? AND token_address = ?", chainId, token).First(&scoreRule).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果没有找到积分规则，使用默认规则
			scoreRule.Score = decimal.NewFromFloat(1.0) // 默认1:1积分
			scoreRule.Decimals = 18
		} else {
			fmt.Printf("查询积分规则失败: %v\n", err)
			return
		}
	}

	// 2. 计算应得积分
	amountDecimal := decimal.NewFromFloat(amount)
	score := amountDecimal.Mul(scoreRule.Score)

	// 3. 更新用户积分信息
	var user model.Users
	if err := ctx.Ctx.DB.Where("chain_id = ? AND address = ?", chainId, userAddress).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新用户记录
			user = model.Users{
				ChainId:      chainId,
				Address:      userAddress,
				TokenAddress: token,
				TotalAmount:  int64(amount * 1e18), // 假设18位小数
				JfAmount:     score.IntPart(),
				Jf:           score,
				JfTime:       time.Now(),
			}
			if err := ctx.Ctx.DB.Create(&user).Error; err != nil {
				fmt.Printf("创建用户记录失败: %v\n", err)
				return
			}
		} else {
			fmt.Printf("查询用户记录失败: %v\n", err)
			return
		}
	} else {
		// 更新现有用户记录
		user.TotalAmount += int64(amount * 1e18) // 假设18位小数
		user.JfAmount += score.IntPart()
		user.Jf = user.Jf.Add(score)
		user.JfTime = time.Now()

		if err := ctx.Ctx.DB.Save(&user).Error; err != nil {
			fmt.Printf("更新用户积分失败: %v\n", err)
			return
		}
	}

	fmt.Printf("用户 %s 积分更新成功，当前积分: %s\n", userAddress, user.Jf.String())
}

// getUserRewards 获取用户收益（从积分信息计算）
func (s *StakeService) getUserRewards(userAddress string, chainId int64) (float64, error) {
	var user model.Users
	if err := ctx.Ctx.DB.Where("chain_id = ? AND address = ?", chainId, userAddress).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return 0, nil // 用户不存在，返回0收益
		}
		return 0, fmt.Errorf("查询用户信息失败: %v", err)
	}

	// 将积分转换为收益（这里需要根据实际业务规则）
	// 示例：1积分 = 0.01代币
	rewardRate := decimal.NewFromFloat(0.01)
	totalRewards := user.Jf.Mul(rewardRate)

	reward, _ := totalRewards.Float64()
	return reward, nil
}

// checkTokenBalance 检查代币余额
func (s *StakeService) checkTokenBalance(client *ethclient.Client, userAddress, token string) (*big.Int, error) {
	// 创建ERC20合约实例
	erc20Address := common.HexToAddress(s.erc20ContractAddress)
	erc20Contract, err := abi.NewAbi(erc20Address, client)
	if err != nil {
		return nil, fmt.Errorf("创建ERC20合约实例失败: %v", err)
	}

	// 查询用户余额
	balance, err := erc20Contract.BalanceOf(&bind.CallOpts{}, common.HexToAddress(userAddress))
	if err != nil {
		return nil, fmt.Errorf("查询余额失败: %v", err)
	}

	return balance, nil
}
