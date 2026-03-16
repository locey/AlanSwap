package service

import (
	"fmt"
	"strings"

	"github.com/mumu/cryptoSwap/src/app/model"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
)

// UserProfile 用户资料
type UserProfile struct {
	Address      string  `json:"address"`
	TotalStaked  float64 `json:"totalStaked"`
	Points       float64 `json:"points"`
	ActiveStakes int64   `json:"activeStakes"`
}

type UserService struct{}

func NewUserService() *UserService {
	return &UserService{}
}

// GetProfile 获取用户资料
func (s *UserService) GetProfile(address string) (*UserProfile, error) {
	addr := strings.ToLower(address)

	// 查询用户记录（可能跨多条链，累计积分）
	var users []model.Users
	if err := ctx.Ctx.DB.Where("address = ?", addr).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("查询用户信息失败: %v", err)
	}

	// 汇总各链数据
	var totalStaked float64
	var totalPoints float64
	for _, u := range users {
		totalStaked += float64(u.TotalAmount) / 1e18
		jf, exact := u.Jf.Float64()
		if !exact {
			log.Logger.Warn("积分精度丢失", zap.String("address", addr), zap.String("jf", u.Jf.String()))
		}
		totalPoints += jf
	}

	// 统计活跃质押数量：质押数减去已提取数
	var stakedCount int64
	if err := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
		Where("address = ? AND event_type = ?", addr, "Staked").
		Count(&stakedCount).Error; err != nil {
		return nil, fmt.Errorf("统计质押记录失败: %v", err)
	}

	var withdrawnCount int64
	if err := ctx.Ctx.DB.Model(&model.UserOperationRecord{}).
		Where("address = ? AND event_type = ?", addr, "withdraw").
		Count(&withdrawnCount).Error; err != nil {
		return nil, fmt.Errorf("统计提取记录失败: %v", err)
	}

	activeStakes := stakedCount - withdrawnCount
	if activeStakes < 0 {
		activeStakes = 0
	}

	return &UserProfile{
		Address:      address,
		TotalStaked:  totalStaked,
		Points:       totalPoints,
		ActiveStakes: activeStakes,
	}, nil
}
