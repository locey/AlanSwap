package service

import (
    "context"
    "crypto/ecdsa"
    "fmt"
    "math/big"

    "github.com/ethereum/go-ethereum/accounts/abi/bind"
    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/mumu/cryptoSwap/src/abi"
    "github.com/mumu/cryptoSwap/src/core/ctx"
    "github.com/mumu/cryptoSwap/src/core/log"
    "go.uber.org/zap"
)

// AirdropAdminService 负责管理员相关的链上操作
// 注意：私钥与合约地址应从配置或安全存储加载，这里为示例硬编码
type AirdropAdminService struct {
    adminPrivateKey      string
    merkleAirdropAddress string
    chainId              int64
}

func NewAirdropAdminService() *AirdropAdminService {
    return &AirdropAdminService{
        adminPrivateKey:      "e22afa1331382e752eb5afce597290f5d14c307b613f649ae0b5c47cd84ad974", // 示例：请改为安全配置
        merkleAirdropAddress: "0x0000000000000000000000000000000000000000",                         // 示例：替换为实际地址
        chainId:              11155111,                                                                  // 示例：sepolia
    }
}

// Configure 允许在运行时设置链ID、合约地址与管理员私钥（留空则保持原值）
func (s *AirdropAdminService) Configure(chainId int64, contractAddr string, adminKey string) {
    if chainId > 0 {
        s.chainId = chainId
    }
    if contractAddr != "" {
        s.merkleAirdropAddress = contractAddr
    }
    if adminKey != "" {
        s.adminPrivateKey = adminKey
    }
}

// UpdateMerkleRoot 发送 updateMerkleRoot(airdropId, newRoot, newVersion) 交易
func (s *AirdropAdminService) UpdateMerkleRoot(airdropId *big.Int, newRoot common.Hash, newVersion uint32) (string, error) {
    client := ctx.GetEvmClient(int(s.chainId))
    if client == nil {
        return "", fmt.Errorf("无法获取链ID=%d 的 EVM 客户端", s.chainId)
    }

    // 加载 ABI
    am := abi.GetABIManager()
    merkleABI, ok := am.GetABI("MerkleAirdrop")
    if !ok {
        return "", fmt.Errorf("MerkleAirdrop ABI 未加载，请确保已调用 abi.InitABIManager()")
    }

    // 私钥与发送者地址
    pk, err := crypto.HexToECDSA(s.adminPrivateKey)
    if err != nil {
        return "", fmt.Errorf("管理员私钥无效: %v", err)
    }
    pub := pk.Public().(*ecdsa.PublicKey)
    sender := crypto.PubkeyToAddress(*pub)

    // nonce & gas
    nonce, err := client.PendingNonceAt(context.Background(), sender)
    if err != nil {
        return "", fmt.Errorf("获取 nonce 失败: %v", err)
    }
    gasPrice, err := client.SuggestGasPrice(context.Background())
    if err != nil {
        return "", fmt.Errorf("获取 gasPrice 失败: %v", err)
    }

    // 构造 transactor
    auth := bind.NewKeyedTransactor(pk)
    auth.Nonce = new(big.Int).SetUint64(nonce)
    auth.Value = big.NewInt(0)
    auth.GasLimit = 300000
    auth.GasPrice = gasPrice

    // 绑定合约
    contractAddr := common.HexToAddress(s.merkleAirdropAddress)
    bound := bind.NewBoundContract(contractAddr, merkleABI, client, client, client)

    // 发送交易
    tx, err := bound.Transact(auth, "updateMerkleRoot", airdropId, newRoot, newVersion)
    if err != nil {
        return "", fmt.Errorf("updateMerkleRoot 交易失败: %v", err)
    }
    log.Logger.Info("updateMerkleRoot 已发送", zap.String("txHash", tx.Hash().Hex()))
    return tx.Hash().Hex(), nil
}

// EncodeUpdateMerkleRootData 仅编码调用数据（在需要构造裸交易时）
func (s *AirdropAdminService) EncodeUpdateMerkleRootData(airdropId *big.Int, newRoot common.Hash, newVersion uint32) ([]byte, error) {
    am := abi.GetABIManager()
    merkleABI, ok := am.GetABI("MerkleAirdrop")
    if !ok {
        return nil, fmt.Errorf("MerkleAirdrop ABI 未加载")
    }
    // 手动打包：方法签名获取 & 参数打包
    method, exist := merkleABI.Methods["updateMerkleRoot"]
    if !exist {
        return nil, fmt.Errorf("ABI 中未找到 updateMerkleRoot 方法")
    }
    // 输入参数顺序需与函数定义一致
    packedArgs, err := method.Inputs.Pack(airdropId, newRoot, newVersion)
    if err != nil {
        return nil, err
    }
    // 4字节选择器 + 参数编码
    selector := method.ID
    data := append(selector, packedArgs...)
    return data, nil
}