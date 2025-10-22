package api

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/app/service"
	commonUtil "github.com/mumu/cryptoSwap/src/common"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/result"
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

// GetNonce godoc
// @Summary 获取随机数
// @Description 为用户生成用于签名的随机数
// @Tags auth
// @Accept json
// @Produce json
// @Param address query string true "用户地址"
// @Success 200 {object} result.Response{data=map[string]string}
// @Router /api/v1/auth/nonce [get]
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

// Verify godoc
// @Summary 验证用户签名
// @Description 验证用户签名并签发JWT令牌
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.LoginVerify true "登录验证参数"
// @Success 200 {object} result.Response{data=map[string]interface{}}
// @Router /api/v1/auth/verify [post]
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

	// 登录成功后：为该用户自动领取（绑定）所有任务，初始化为进行中(1)
	addr := strings.ToLower(req.WalletAddress)
	_ = ctx.Ctx.DB.Exec(`
INSERT INTO user_task_status (wallet_address, task_id, user_status)
SELECT ?, t.task_id, 1
FROM tasks t
ON CONFLICT (wallet_address, task_id) DO NOTHING
`, addr).Error

	result.OK(c, map[string]interface{}{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"expires_in":    expiresIn,
	})

}

// 验证签名方法
func verifySignature(address, signature, nonce string) (bool, error) {
	// 1. 验证地址格式
	if !common.IsHexAddress(address) {
		return false, fmt.Errorf("无效的以太坊地址: %s", address)
	}
	expectedAddr := common.HexToAddress(address)

	// 2. 解码签名（去除可能的0x前缀）
	sigBytes, err := hexutil.Decode(signature)
	if err != nil {
		return false, fmt.Errorf("签名解码失败: %v", err)
	}

	// 3. 验证签名长度（应该是65字节）
	if len(sigBytes) != 65 {
		return false, fmt.Errorf("无效签名长度: %d, 应为65字节", len(sigBytes))
	}

	// 4. 以太坊签名中，最后的字节是恢复标识符（recovery identifier）
	// 需要将其从27/28转换为0/1以适应Ecrecover
	if sigBytes[64] != 0 && sigBytes[64] != 1 {
		if sigBytes[64] == 27 || sigBytes[64] == 28 {
			sigBytes[64] -= 27
		} else {
			return false, fmt.Errorf("无效的恢复标识符: %d", sigBytes[64])
		}
	}

	// 5. 计算消息的哈希（以太坊使用特定的前缀）
	// 格式: "\x19Ethereum Signed Message:\n" + len(message) + message
	msg := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(nonce), nonce)
	msgHash := crypto.Keccak256Hash([]byte(msg))
	fmt.Printf("msg: %x\n", msg)
	fmt.Printf("msgHash: %s\n", msgHash.Hex())
	fmt.Printf("signature: %x\n", sigBytes)
	// 6. 使用Ecrecover恢复公钥
	recoveredPubKey, err := crypto.SigToPub(msgHash.Bytes(), sigBytes)
	if err != nil {
		return false, fmt.Errorf("恢复公钥失败: %v", err)
	}

	// 7. 将公钥转换为地址
	recoveredAddr := crypto.PubkeyToAddress(*recoveredPubKey)

	//recoveredAddr := crypto.PubkeyToAddress(*pubKey)
	fmt.Printf("从公钥推导出地址: %s\n", recoveredAddr.Hex())
	// 8. 比较恢复的地址与预期地址（不区分大小写）
	return strings.EqualFold(recoveredAddr.Hex(), expectedAddr.Hex()), nil
}

// Logout godoc
// @Summary 用户登出
// @Description 用户登出，清除认证信息
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} result.Response
// @Router /api/v1/auth/logout [post]
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
