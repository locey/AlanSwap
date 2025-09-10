package api

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/app/service"
	commonUtil "github.com/mumu/cryptoSwap/src/common"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/result"
	"time"
)

var (
	cont = context.Background()
)

type AuthApi struct {
	svc *service.AuthService
}

func NewAuthApi() *AuthApi {
	return &AuthApi{
		svc: service.NewAuthService(),
	}
}

// GetNonce
//
//	@Description: 获取随机nonce
//	@receiver auth
//	@param c
func (auth *AuthApi) GetNonce(c *gin.Context) {
	address := c.Query("address")
	if address != "" {
		nonce, err := GenerateNonceForUser(address, 5)
		if err != nil {
			fmt.Printf("生成nonce错误: %v\n", err)
			return
		}

		//定义局部结构体
		type Response struct {
			Nonce string `json:"nonce"`
			Ttl   int64  `json:"ttl"`
		}
		response := Response{
			Nonce: nonce,
			Ttl:   5 * 60, // 5分钟
		}
		result.OK(c, response)
	}
}

// Verify
//
//	@Description: 验证用户签名
//	@receiver auth
//	@param c
func (auth *AuthApi) Verify(c *gin.Context) {
	//nonce := c.Query("nonce")
	//signature := c.Query("signature")
	//address := c.Query("address")
	var req model.LoginVerify
	if err := c.ShouldBind(&req); err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	//从redis中获取nonce
	key := "user_nonce_" + req.WalletAddress
	nonce, err := ctx.Ctx.Redis.Get(cont, key).Result()
	if err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	if nonce == "" || nonce != req.Nonce {
		result.Error(c, result.InvalidParameter)
		return
	}
	isValid, err := verifySignature(req.WalletAddress, req.Signature, req.Nonce)
	if err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	if !isValid {
		result.Error(c, result.InvalidParameter)
		return
	}
	//清除缓存中的nonce
	ctx.Ctx.Redis.Del(cont, key)
	//	签发jwt令牌
	accessToken, refreshToken, expiresIn, err := commonUtil.GenerateJWT(req.WalletAddress)
	if err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	result.OK(c, map[string]interface{}{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"expires_in":    expiresIn,
	})

}

// 验证以太坊签名
func verifySignature(address, signature, nonce string) (bool, error) {
	// 将地址转换为common.Address格式
	addr := common.HexToAddress(address)

	// 重建签名的消息（必须与客户端签名的格式完全一致）
	message := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(nonce), nonce)

	// 计算消息的Keccak256哈希
	messageHash := crypto.Keccak256Hash([]byte(message))

	// 解码签名
	sig, err := hexutil.Decode(signature)
	if err != nil {
		return false, err
	}

	// 恢复公钥
	if sig[64] != 27 && sig[64] != 28 {
		return false, fmt.Errorf("invalid recovery id")
	}
	sig[64] -= 27 // 转换为以太坊标准的恢复ID

	pubKey, err := crypto.SigToPub(messageHash.Bytes(), sig)
	if err != nil {
		return false, err
	}

	// 从公钥推导出地址
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)

	// 比较地址是否匹配
	return addr == recoveredAddr, nil
}

func (auth *AuthApi) Logout(c *gin.Context) {

}

// GenerateNonceForUser 为用户生成特定nonce，可以关联用户信息
func GenerateNonceForUser(userAddress string, cacheTime int) (string, error) {
	// 生成随机字节
	randomBytes := make([]byte, 24)
	_, err := rand.Read(randomBytes)
	if err != nil {
		return "", fmt.Errorf("生成随机数失败: %v", err)
	}

	// 获取当前时间戳
	timestamp := time.Now().UnixNano()
	timestampBytes := []byte(fmt.Sprintf("%d", timestamp))

	// 将用户信息转换为字节
	userBytes := []byte(userAddress)

	// 组合所有元素
	combined := append(randomBytes, timestampBytes...)
	combined = append(combined, userBytes...)

	// 编码为base64字符串
	nonce := base64.URLEncoding.EncodeToString(combined)

	// 并设置适当的过期时间(例如5分钟)
	key := "user_nonce_" + userAddress
	ctx.Ctx.Redis.Set(cont, key, nonce, time.Duration(cacheTime)*time.Minute)
	return nonce, nil
}
