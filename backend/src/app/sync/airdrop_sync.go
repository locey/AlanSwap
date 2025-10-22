package sync

import (
	"encoding/hex"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	appabi "github.com/mumu/cryptoSwap/src/abi"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AirdropEvents struct {
	RewardClaimedEvents      []*model.RewardClaimedEvent
	TotalRewardUpdatedEvents []*model.TotalRewardUpdatedEvent
	AirdropCreatedEvents     []*AirdropCreatedInfo
	AirdropActivatedIds      []string
}

// ParseAirdropEvents 统一解析空投相关事件
func ParseAirdropEvents(vLog types.Log, chainId int, address string) *AirdropEvents {
	events := &AirdropEvents{}
	topic0 := vLog.Topics[0].Hex()
	// 定义所有空投相关事件的topic hash
	rewardClaimedTopic := crypto.Keccak256Hash([]byte("RewardClaimed(uint256,address,uint256,uint256,uint256,uint256,uint256)")).Hex()
	updateTotalRewardTopic := crypto.Keccak256Hash([]byte("UpdateTotalRewardUpdated(uint256,address,uint256,uint256,uint256,uint256)")).Hex()
	airdropCreatedTopic := crypto.Keccak256Hash([]byte("AirdropCreated(uint256,string,bytes32,uint256,uint256)")).Hex()
	airdropActivatedTopic := crypto.Keccak256Hash([]byte("AirdropActivated(uint256)")).Hex()
	//rewardPoolUpdatedTopic := crypto.Keccak256Hash([]byte("RewardPoolUpdated(address,address)")).Hex()
	switch topic0 {
	case rewardClaimedTopic:
		if e := parseRewardClaimedEvent(vLog, chainId); e != nil {
			events.RewardClaimedEvents = append(events.RewardClaimedEvents, e)
		}
	case updateTotalRewardTopic:
		if e := parseTotalRewardUpdatedEvent(vLog, chainId); e != nil {
			events.TotalRewardUpdatedEvents = append(events.TotalRewardUpdatedEvents, e)
		}
	case airdropCreatedTopic:
		if info := parseAirdropCreatedEvent(vLog, chainId); info != nil {
			events.AirdropCreatedEvents = append(events.AirdropCreatedEvents, info)
		}
	case airdropActivatedTopic:
		if id := parseAirdropActivatedEvent(vLog, chainId); id != "" {
			events.AirdropActivatedIds = append(events.AirdropActivatedIds, id)
		}
	default:
		return nil
	}

	return events
}

// SaveAirdropEvents 统一保存空投事件
func SaveAirdropEvents(events *AirdropEvents, chainId int, targetBlockNum uint64, addresses string) error {
	// 保存空投领取事件
	if len(events.RewardClaimedEvents) > 0 {
		log.Logger.Info("解析空投事件成功",
			zap.Int("reward_claimed_count", len(events.RewardClaimedEvents)))
		if err := saveAirdropEvents(events.RewardClaimedEvents, chainId, targetBlockNum, addresses); err != nil {
			log.Logger.Error("保存空投领取事件失败", zap.Error(err))
			return err
		}
	}

	// 应用用户总奖励更新事件到白名单
	if len(events.TotalRewardUpdatedEvents) > 0 {
		log.Logger.Info("解析总奖励更新事件成功",
			zap.Int("total_reward_updated_count", len(events.TotalRewardUpdatedEvents)))
		if err := applyTotalRewardUpdates(events.TotalRewardUpdatedEvents, chainId, targetBlockNum, addresses); err != nil {
			log.Logger.Error("应用总奖励更新事件失败", zap.Error(err))
			return err
		}
	}

	// 保存空投活动创建与激活事件
	if len(events.AirdropCreatedEvents) > 0 || len(events.AirdropActivatedIds) > 0 {
		log.Logger.Info("解析空投活动管理事件成功",
			zap.Int("created_count", len(events.AirdropCreatedEvents)),
			zap.Int("activated_count", len(events.AirdropActivatedIds)))
		if err := saveAirdropAdminEvents(events.AirdropCreatedEvents, events.AirdropActivatedIds, chainId, targetBlockNum, addresses); err != nil {
			log.Logger.Error("保存空投活动管理事件失败", zap.Error(err))
			return err
		}
	}

	return nil
}

// parseRewardClaimedEvent 解析 RewardClaimed(uint256,address,uint256,uint256,uint256,uint256,uint256)
func parseRewardClaimedEvent(vLog types.Log, chainId int) *model.RewardClaimedEvent {
	if len(vLog.Topics) < 3 || len(vLog.Data) < 160 {
		return nil
	}

	// indexed: airdropId, user
	airdropId := new(big.Int).SetBytes(common.TrimLeftZeroes(vLog.Topics[1].Bytes()))
	user := common.BytesToAddress(vLog.Topics[2].Bytes()).Hex()

	data := vLog.Data
	claimAmount := new(big.Int).SetBytes(common.TrimLeftZeroes(data[0:32]))
	totalReward := new(big.Int).SetBytes(common.TrimLeftZeroes(data[32:64]))
	claimedReward := new(big.Int).SetBytes(common.TrimLeftZeroes(data[64:96]))
	pendingReward := new(big.Int).SetBytes(common.TrimLeftZeroes(data[96:128]))
	ts := new(big.Int).SetBytes(common.TrimLeftZeroes(data[128:160]))
	eventTime := time.Unix(ts.Int64(), 0)

	return &model.RewardClaimedEvent{
		ChainId:         int64(chainId),
		ContractAddress: vLog.Address.Hex(),
		AirdropId:       airdropId.String(),
		UserAddress:     user,
		ClaimAmount:     claimAmount.String(),
		TotalReward:     totalReward.String(),
		ClaimedReward:   claimedReward.String(),
		PendingReward:   pendingReward.String(),
		EventTimestamp:  eventTime,
		BlockNumber:     int64(vLog.BlockNumber),
		TxHash:          vLog.TxHash.Hex(),
		LogIndex:        int(vLog.Index),
	}
}

// parseTotalRewardUpdatedEvent 解析 UpdateTotalRewardUpdated(uint256,address,uint256,uint256,uint256,uint256)
func parseTotalRewardUpdatedEvent(vLog types.Log, chainId int) *model.TotalRewardUpdatedEvent {
	if len(vLog.Topics) < 3 || len(vLog.Data) < 128 {
		return nil
	}

	airdropId := new(big.Int).SetBytes(common.TrimLeftZeroes(vLog.Topics[1].Bytes()))
	user := common.BytesToAddress(vLog.Topics[2].Bytes()).Hex()

	data := vLog.Data
	totalReward := new(big.Int).SetBytes(common.TrimLeftZeroes(data[0:32]))
	claimedReward := new(big.Int).SetBytes(common.TrimLeftZeroes(data[32:64]))
	pendingReward := new(big.Int).SetBytes(common.TrimLeftZeroes(data[64:96]))
	ts := new(big.Int).SetBytes(common.TrimLeftZeroes(data[96:128]))
	eventTime := time.Unix(ts.Int64(), 0)

	return &model.TotalRewardUpdatedEvent{
		ChainId:         int64(chainId),
		ContractAddress: vLog.Address.Hex(),
		AirdropId:       airdropId.String(),
		UserAddress:     user,
		TotalReward:     totalReward.String(),
		ClaimedReward:   claimedReward.String(),
		PendingReward:   pendingReward.String(),
		EventTimestamp:  eventTime,
		BlockNumber:     int64(vLog.BlockNumber),
		TxHash:          vLog.TxHash.Hex(),
		LogIndex:        int(vLog.Index),
	}
}

// saveAirdropEvents 批量保存空投事件，并更新区块高度
func saveAirdropEvents(rewardClaimed []*model.RewardClaimedEvent, chainId int, targetBlockNum uint64, addresses string) error {
	return ctx.Ctx.DB.Transaction(func(tx *gorm.DB) error {
		// RewardClaimedEvents 去重插入（按精简版 schema，仅插入必要字段）
		if len(rewardClaimed) > 0 {
			for _, e := range rewardClaimed {
				if e == nil {
					continue
				}
				// 保证地址与哈希小写，符合 CHECK 约束
				contract := strings.ToLower(e.ContractAddress)
				user := strings.ToLower(e.UserAddress)
				txHash := strings.ToLower(e.TxHash)
				if err := tx.Exec(`
                    INSERT INTO reward_claimed_events (
                        chain_id, contract_address, airdrop_id, user_address, claim_amount,
                        event_timestamp, block_number, tx_hash, log_index
                    ) VALUES (?, LOWER(?), ?, LOWER(?), ?, ?, ?, LOWER(?), ?)
                    ON CONFLICT (tx_hash, log_index) DO NOTHING
                `, e.ChainId, contract, e.AirdropId, user, e.ClaimAmount, e.EventTimestamp, e.BlockNumber, txHash, e.LogIndex).Error; err != nil {
					log.Logger.Error("插入 RewardClaimed 事件失败", zap.Error(err))
					return err
				}
			}
		}

		// 更新链区块高度
		return updateBlockNumber(chainId, targetBlockNum, addresses)
	})
}

// applyTotalRewardUpdates 使用 UpdateTotalRewardUpdated 事件更新用户白名单总奖励（UPSERT）
func applyTotalRewardUpdates(totalUpdates []*model.TotalRewardUpdatedEvent, chainId int, targetBlockNum uint64, addresses string) error {
	if len(totalUpdates) == 0 {
		return updateBlockNumber(chainId, targetBlockNum, addresses)
	}
	return ctx.Ctx.DB.Transaction(func(tx *gorm.DB) error {
		for _, e := range totalUpdates {
			if e == nil {
				continue
			}
			wallet := strings.ToLower(e.UserAddress)
			txHash := strings.ToLower(e.TxHash)
			// 以事件中的 total_reward 更新/插入白名单记录
			if err := tx.Exec(`
                INSERT INTO airdrop_whitelist (airdrop_id, wallet_address, total_reward, proof)
                VALUES (?, LOWER(?), ?, NULL)
                ON CONFLICT (airdrop_id, wallet_address) DO UPDATE
                SET total_reward = EXCLUDED.total_reward
            `, e.AirdropId, wallet, e.TotalReward).Error; err != nil {
				log.Logger.Error("更新用户白名单总奖励失败", zap.Error(err), zap.String("tx_hash", txHash))
				return err
			}
		}
		return updateBlockNumber(chainId, targetBlockNum, addresses)
	})
}

// --- 新增：解析与保存Airdrop创建与激活 ---

type AirdropCreatedInfo struct {
	AirdropId       string
	ChainId         int64
	ContractAddress string
	Name            string
	MerkleRoot      string
	TotalReward     string
}

// parseAirdropCreatedEvent 解析 AirdropCreated(uint256 indexed airdropId, string name, bytes32 merkleRoot, uint256 totalReward, uint256 treeVersion)
func parseAirdropCreatedEvent(vLog types.Log, chainId int) *AirdropCreatedInfo {
	if len(vLog.Topics) < 2 {
		return nil
	}
	abiInstance, ok := appabi.GetABIManager().GetABI(appabi.ABIMerkleAirdrop)
	if !ok {
		log.Logger.Warn("MerkleAirdrop ABI 未加载，跳过 AirdropCreated 解析")
		return nil
	}
	ev, exists := abiInstance.Events["AirdropCreated"]
	if !exists {
		log.Logger.Warn("ABI 中未找到 AirdropCreated 事件定义")
		return nil
	}
	// 非索引参数解包
	values, err := ev.Inputs.NonIndexed().Unpack(vLog.Data)
	if err != nil {
		log.Logger.Warn("解包 AirdropCreated 事件数据失败", zap.Error(err), zap.String("tx_hash", vLog.TxHash.Hex()))
		return nil
	}
	if len(values) < 4 {
		return nil
	}
	// 解析索引参数 airdropId
	airdropId := new(big.Int).SetBytes(common.TrimLeftZeroes(vLog.Topics[1].Bytes()))

	// 解析非索引参数
	name, _ := values[0].(string)
	var merkleRootHex string
	if mr, ok := values[1].([32]byte); ok {
		merkleRootHex = "0x" + hex.EncodeToString(mr[:])
	} else if b, ok := values[1].([]byte); ok && len(b) == 32 {
		merkleRootHex = "0x" + hex.EncodeToString(b)
	}
	totalReward, _ := values[2].(*big.Int)

	return &AirdropCreatedInfo{
		AirdropId:       airdropId.String(),
		ChainId:         int64(chainId),
		ContractAddress: common.BytesToAddress(vLog.Address.Bytes()).Hex(),
		Name:            name,
		MerkleRoot:      merkleRootHex,
		TotalReward: func() string {
			if totalReward != nil {
				return totalReward.String()
			} else {
				return "0"
			}
		}(),
	}
}

// parseAirdropActivatedEvent 解析 AirdropActivated(uint256 indexed airdropId)
func parseAirdropActivatedEvent(vLog types.Log, chainId int) string {
	if len(vLog.Topics) < 2 {
		return ""
	}
	airdropId := new(big.Int).SetBytes(common.TrimLeftZeroes(vLog.Topics[1].Bytes()))
	return airdropId.String()
}

// saveAirdropAdminEvents 保存活动创建与激活信息到 airdrop_campaigns
func saveAirdropAdminEvents(created []*AirdropCreatedInfo, activated []string, chainId int, targetBlockNum uint64, addresses string) error {
	return ctx.Ctx.DB.Transaction(func(tx *gorm.DB) error {
		// 处理创建事件：存在则更新，不存在则插入（token_symbol 用占位符）
		for _, e := range created {
			if e == nil {
				continue
			}
			if err := tx.Exec(`
                INSERT INTO airdrop_campaigns (airdrop_id, chain_id, merkle_airdrop_contract, name, merkle_root, total_reward, token_symbol, is_active, created_at, updated_at)
                VALUES (?, ?, LOWER(?), ?, ?, ?, 'CSWAP', FALSE, NOW(), NOW())
                ON CONFLICT (airdrop_id) DO UPDATE
                SET chain_id = EXCLUDED.chain_id,
                    merkle_airdrop_contract = EXCLUDED.merkle_airdrop_contract,
                    name = EXCLUDED.name,
                    merkle_root = EXCLUDED.merkle_root,
                    total_reward = EXCLUDED.total_reward,
                    updated_at = NOW()
            `, e.AirdropId, e.ChainId, e.ContractAddress, e.Name, e.MerkleRoot, e.TotalReward).Error; err != nil {
				log.Logger.Error("保存 AirdropCreated 事件影响活动元数据失败", zap.Error(err))
				return err
			}
		}

		// 处理激活事件：直接更新 is_active
		for _, id := range activated {
			if id == "" {
				continue
			}
			if err := tx.Exec(`
                UPDATE airdrop_campaigns SET is_active = TRUE, updated_at = NOW() WHERE airdrop_id = ?
            `, id).Error; err != nil {
				log.Logger.Error("更新 AirdropActivated 事件失败", zap.Error(err))
				return err
			}
		}

		// 更新链区块高度
		return updateBlockNumber(chainId, targetBlockNum, addresses)
	})
}
