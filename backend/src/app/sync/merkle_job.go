package sync

import (
	"context"
	"encoding/json"
	"math/big"
	"sort"
	"strings"
	"time"

	ethcommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/mumu/cryptoSwap/src/app/service"
	"github.com/mumu/cryptoSwap/src/core/config"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"github.com/shopspring/decimal"
	"go.uber.org/zap"
)

// StartMerkleAutoUpdate 定时重建默克尔树并上链更新根
func StartMerkleAutoUpdate(c context.Context, interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-c.Done():
				log.Logger.Info("Merkle 自动更新任务停止")
				return
			case <-ticker.C:
				rebuildAllActiveAirdrops()
			}
		}
	}()
}

func rebuildAllActiveAirdrops() {
	rows, err := ctx.Ctx.DB.Raw(`
        SELECT airdrop_id::bigint, chain_id::bigint, COALESCE(merkle_root,'') AS old_root
        FROM airdrop_campaigns
        WHERE is_active = TRUE
    `).Rows()
	if err != nil {
		log.Logger.Error("查询活动空投失败", zap.Error(err))
		return
	}
	defer rows.Close()

	for rows.Next() {
		var airdropId int64
		var chainId int64
		var oldRoot string
		if err := rows.Scan(&airdropId, &chainId, &oldRoot); err != nil {
			log.Logger.Error("扫描活动空投失败", zap.Error(err))
			continue
		}
		contract, cErr := getAirdropContractAddress(chainId)
		if cErr != nil || contract == "" {
			log.Logger.Warn("未在 chain 表找到空投合约地址，跳过", zap.Int64("airdrop_id", airdropId), zap.Int64("chain_id", chainId))
			continue
		}
		if err := rebuildAirdropMerkle(airdropId, chainId, contract, oldRoot); err != nil {
			log.Logger.Error("重建默克尔树失败", zap.Error(err), zap.Int64("airdrop_id", airdropId))
		}
	}
}

// rebuildAirdropMerkle 聚合奖励、重建树、写DB、上链更新
func rebuildAirdropMerkle(airdropId int64, chainId int64, contract string, oldRootHex string) error {
	// 1) 聚合已完成任务的用户总奖励（以任务绑定的奖励为准）
	type userReward struct {
		Addr   string
		Amount decimal.Decimal // 以代币单位，稍后转为18位 wei
	}
	var userRewards []userReward
	urRows, err := ctx.Ctx.DB.Raw(`
        SELECT uts.wallet_address, COALESCE(SUM(t.reward_amount), 0)::text AS total
        FROM user_task_status uts
        JOIN airdrop_task_bindings b ON b.task_id = uts.task_id AND b.airdrop_id = ?
        JOIN tasks t ON t.task_id = uts.task_id
        WHERE uts.user_status = 2
        GROUP BY uts.wallet_address
    `, airdropId).Rows()
	if err != nil {
		log.Logger.Error("查询用户奖励失败", zap.Error(err))
		return err
	}
	defer urRows.Close()
	for urRows.Next() {
		var addr string
		var totalStr string
		if err := urRows.Scan(&addr, &totalStr); err != nil {
			log.Logger.Error("扫描用户奖励失败", zap.Error(err))
			continue
		}
		d := decimal.RequireFromString(totalStr)
		if d.IsZero() {
			continue
		}
		userRewards = append(userRewards, userReward{Addr: addr, Amount: d})
	}

	if len(userRewards) == 0 {
		log.Logger.Info("无用户奖励需要更新，跳过此空投", zap.Int64("airdrop_id", airdropId))
		return nil
	}

	// 2) 构建叶子：keccak256(abi.encodePacked(address,uint256 totalRewardWei))
	type leafInfo struct {
		Addr      string
		LeafHash  ethcommon.Hash
		AmountWei decimal.Decimal
	}
	var leaves []leafInfo
	for _, ur := range userRewards {
		// 默认18位精度
		amtWei := ur.Amount.Mul(decimal.New(1, 18))
		h := calcLeafHash(ur.Addr, amtWei)
		leaves = append(leaves, leafInfo{Addr: ur.Addr, LeafHash: h, AmountWei: amtWei})
	}
	// 稳定排序（按叶子hash字节升序）
	sort.Slice(leaves, func(i, j int) bool {
		return bytesLess(leaves[i].LeafHash.Bytes(), leaves[j].LeafHash.Bytes())
	})

	// 3) 构建默克尔树并生成每个地址的证明
	leafHashes := make([]ethcommon.Hash, len(leaves))
	for i, lf := range leaves {
		leafHashes[i] = lf.LeafHash
	}
	root, proofs := buildMerkleTreeAndProofs(leafHashes)
	newRootHex := root.Hex()

	// 若根未变化，跳过后续写入与上链
	if oldRootHex != "" && strings.EqualFold(oldRootHex, newRootHex) {
		log.Logger.Debug("默克尔根未变化，跳过上链", zap.Int64("airdrop_id", airdropId), zap.String("root", newRootHex))
		return nil
	}

	// 4) 写入 whitelist（UPSERT total_reward & proof）与 campaign 的 merkle_root
	tx := ctx.Ctx.DB.Begin()
	if err := tx.Error; err != nil {
		return err
	}

	for i, lf := range leaves {
		proof := proofs[i]
		// 将 proof 序列化为 JSON hex 数组
		proofHex := make([]string, len(proof))
		for k := range proof {
			proofHex[k] = proof[k].Hex()
		}
		proofJSON, _ := json.Marshal(proofHex)

		if err := tx.Exec(`
            INSERT INTO airdrop_whitelist (airdrop_id, wallet_address, total_reward, proof)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (airdrop_id, wallet_address)
            DO UPDATE SET total_reward = EXCLUDED.total_reward,
                          proof = EXCLUDED.proof,
                          updated_at = NOW()
        `, airdropId, strings.ToLower(leaves[i].Addr), lf.AmountWei.String(), string(proofJSON)).Error; err != nil {
			log.Logger.Error("更新 whitelist 失败", zap.Error(err), zap.String("addr", leaves[i].Addr))
			tx.Rollback()
			return err
		}
	}

	if err := tx.Exec(`UPDATE airdrop_campaigns SET merkle_root = ?, updated_at = NOW() WHERE airdrop_id = ?`, newRootHex, airdropId).Error; err != nil {
		log.Logger.Error("更新活动 merkle_root 失败", zap.Error(err))
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 5) 上链更新根（版本用当前时间戳，确保递增）
	admin := service.NewAirdropAdminService()
	// 使用配置文件中的管理员私钥
	adminKey := config.Conf.Airdrop.AdminPrivateKey
	if strings.TrimSpace(adminKey) == "" {
		log.Logger.Warn("未配置 airdrop.admin_private_key；跳过链上更新", zap.Int64("airdrop_id", airdropId))
		return nil
	}
	admin.Configure(chainId, contract, adminKey)
	txHash, err := admin.UpdateMerkleRoot(bigInt(airdropId), root, uint32(time.Now().Unix()))
	if err != nil {
		log.Logger.Error("链上更新 merkleRoot 失败", zap.Error(err))
		return err
	}
	log.Logger.Info("链上更新 merkleRoot 成功", zap.String("tx_hash", txHash), zap.String("new_root", newRootHex))
	return nil
}

// 计算叶子哈希：keccak256(abi.encodePacked(address,uint256))
func calcLeafHash(addr string, amtWei decimal.Decimal) ethcommon.Hash {
	a := ethcommon.HexToAddress(addr)
	// uint256 32字节大端
	amtBytes := leftPad32(amtWei)
	packed := append(a.Bytes(), amtBytes...)
	return ethcommon.BytesToHash(crypto.Keccak256(packed))
}

// buildMerkleTreeAndProofs 使用 pair 排序（sortPairs），生成根与每个叶子的证明
func buildMerkleTreeAndProofs(leaves []ethcommon.Hash) (ethcommon.Hash, [][]ethcommon.Hash) {
	n := len(leaves)
	if n == 0 {
		return ethcommon.Hash{}, make([][]ethcommon.Hash, 0)
	}
	// 层级
	levels := make([][]ethcommon.Hash, 0)
	curr := make([]ethcommon.Hash, n)
	copy(curr, leaves)
	levels = append(levels, curr)

	for len(curr) > 1 {
		next := make([]ethcommon.Hash, 0)
		for i := 0; i < len(curr); i += 2 {
			if i+1 == len(curr) {
				// 奇数：复制最后一个节点
				next = append(next, curr[i])
			} else {
				left := curr[i].Bytes()
				right := curr[i+1].Bytes()
				// sortPairs：字节升序拼接
				if bytesLess(right, left) {
					left, right = right, left
				}
				h := crypto.Keccak256(append(left, right...))
				next = append(next, ethcommon.BytesToHash(h))
			}
		}
		levels = append(levels, next)
		curr = next
	}

	root := levels[len(levels)-1][0]
	// 生成证明
	proofs := make([][]ethcommon.Hash, n)
	for idx := 0; idx < n; idx++ {
		p := make([]ethcommon.Hash, 0)
		pos := idx
		for lvl := 0; lvl < len(levels)-1; lvl++ {
			layer := levels[lvl]
			if pos%2 == 0 { // 左节点：兄弟在 pos+1
				if pos+1 < len(layer) {
					p = append(p, layer[pos+1])
				} else {
					// 无兄弟，复制自己
					p = append(p, layer[pos])
				}
			} else { // 右节点：兄弟在 pos-1
				p = append(p, layer[pos-1])
			}
			pos = pos / 2
		}
		proofs[idx] = p
	}
	return root, proofs
}

// 工具函数
func bytesLess(a, b []byte) bool {
	// 逐字节比较
	for i := 0; i < len(a) && i < len(b); i++ {
		if a[i] < b[i] {
			return true
		}
		if a[i] > b[i] {
			return false
		}
	}
	return len(a) < len(b)
}

// 新增：根据 chain_id 从 chain 表读取空投合约地址
func getAirdropContractAddress(chainId int64) (string, error) {
	var addr string
	// 优先按 service_type='airdrop' 查找
	if err := ctx.Ctx.DB.Raw("SELECT address FROM chain WHERE chain_id = ? AND chain_name = 'sepolia-airdrop' LIMIT 1", chainId).Scan(&addr).Error; err == nil && addr != "" {
		return addr, nil
	}
	// 回退：不区分 service_type，仅取该链的 address
	_ = ctx.Ctx.DB.Raw("SELECT address FROM chain WHERE chain_id = ? LIMIT 1", chainId).Scan(&addr)
	return addr, nil
}
func leftPad32(d decimal.Decimal) []byte {
	// 将 decimal 转为整数字符串再解析为大整型（默认整数，18位精度已在调用处处理）
	s := d.String()
	// 去掉小数点（如存在），这里只预期整数
	if i := strings.IndexByte(s, '.'); i >= 0 {
		s = s[:i]
	}
	bi, ok := new(big.Int).SetString(s, 10)
	if !ok {
		bi = big.NewInt(0)
	}
	out := make([]byte, 32)
	b := bi.Bytes()
	copy(out[32-len(b):], b)
	return out
}

func bigInt(v int64) *big.Int { return big.NewInt(v) }
