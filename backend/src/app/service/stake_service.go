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

// GetStakeOverview 获取质押概览
func (s *StakeService) GetStakeOverview(userAddress string, chainId int64) (*model.StakeOverview, error) {
	var totalStaked int64
	var activeStakes int64

	// 构建查询条件
	query := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).Where("address = ? AND event_type = ?", userAddress, "Staked")
	if chainId > 0 {
		query = query.Where("chain_id = ?", chainId)
	}

	// 计算总质押量（活跃状态的质押）
	//var totalStakedStr string
	if err := query.Select("COALESCE(SUM(amount), 0)").Scan(&totalStaked).Error; err != nil {
		return nil, fmt.Errorf("计算总质押量失败: %v", err)
	}
	// 将字符串结果转换为int64
	//totalStaked, err := strconv.ParseInt(totalStakedStr, 10, 64)
	//if err != nil {
	//	return nil, fmt.Errorf("转换总质押量失败: %v", err)
	//}
	// 计算活跃质押数量（未提取的质押记录）
	activeQuery := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).Where("address = ? AND event_type = ?", userAddress, "Staked")
	if chainId > 0 {
		activeQuery = activeQuery.Where("chain_id = ?", chainId)
	}

	// 统计未提取的质押记录数量
	var stakeRecords []model.UserOperationRecord
	if err := activeQuery.Find(&stakeRecords).Error; err != nil {
		return nil, fmt.Errorf("查询质押记录失败: %v", err)
	}

	for _, record := range stakeRecords {
		var withdrawRecord model.UserOperationRecord
		if err := ctx.Ctx.DB.Where("address = ? AND chain_id = ? AND event_type = ? AND amount = ?",
			userAddress, record.ChainId, "withdraw", record.Amount).First(&withdrawRecord).Error; err != nil {
			// 如果没有找到对应的提取记录，说明是活跃质押
			activeStakes++
		}
	}

	// 计算总收益（从Users表获取积分信息）
	totalRewards, err := s.getUserRewards(userAddress, chainId)
	if err != nil {
		return nil, fmt.Errorf("获取用户收益失败: %v", err)
	}

	overview := &model.StakeOverview{
		TotalStaked:  float64(totalStaked) / 1e18, // 假设18位小数
		TotalRewards: totalRewards,
		ActiveStakes: int(activeStakes),
		UserAddress:  userAddress,
		ChainId:      chainId,
	}

	return overview, nil
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
