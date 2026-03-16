package api

import (
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/app/service"
	"github.com/mumu/cryptoSwap/src/core/log"
	"github.com/mumu/cryptoSwap/src/core/result"
	"go.uber.org/zap"
)

type UserApi struct {
	svc *service.UserService
}

func NewUserApi() *UserApi {
	return &UserApi{
		svc: service.NewUserService(),
	}
}

// GetProfile godoc
// @Summary      获取用户资料
// @Description  根据钱包地址返回用户的积分、质押总量和活跃质押数量
// @Tags         user
// @Accept       json
// @Produce      json
// @Param        Authorization  header  string  false  "Bearer token"
// @Param        walletAddress  query   string  false  "用户地址"
// @Success      200  {object}  result.Response{data=service.UserProfile}
// @Router       /api/v1/user/profile [get]
func (u *UserApi) GetProfile(c *gin.Context) {
	addr := extractWalletAddress(c)
	if addr == "" {
		result.Error(c, result.InvalidParameter)
		return
	}

	profile, err := u.svc.GetProfile(addr)
	if err != nil {
		log.Logger.Error("获取用户资料失败", zap.String("address", addr), zap.Error(err))
		result.Error(c, result.DBQueryFailed)
		return
	}

	result.OK(c, profile)
}
