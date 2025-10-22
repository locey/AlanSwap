package api

import (
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/app/api/dto"
	"github.com/mumu/cryptoSwap/src/app/service"
	commonUtil "github.com/mumu/cryptoSwap/src/common"
	"github.com/mumu/cryptoSwap/src/core/result"
)

type StakeApi struct {
	svc *service.StakeService
}

func NewStakeApi() *StakeApi {
	return &StakeApi{
		svc: service.NewStakeService(),
	}
}

// StakeRequest 质押请求参数
type StakeRequest struct {
	UserAddress string  `json:"userAddress" binding:"required"`
	ChainId     int64   `json:"chainId" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Token       string  `json:"token" binding:"required"`
	PoolId      string  `json:"poolId" binding:"required"`
}

// WithdrawRequest 提取请求参数
type WithdrawRequest struct {
	UserAddress string `json:"userAddress" binding:"required"`
	ChainId     int64  `json:"chainId" binding:"required"`
	StakeId     string `json:"stakeId" binding:"required"`
	PoolId      string `json:"poolId" binding:"required"`
}

// GetStakeRecordsRequest 获取质押记录请求参数
type GetStakeRecordsRequest struct {
	UserAddress string `form:"userAddress" binding:"required"`
	ChainId     int64  `form:"chainId" binding:"required"`
	Page        int    `form:"page,default=1"`
	PageSize    int    `form:"pageSize,default=20"`
}

// GetStakeOverviewRequest 获取质押概览请求参数
type GetStakeOverviewRequest struct {
	UserAddress string `json:"userAddress" binding:"required"`
	ChainId     int64  `json:"chainId" binding:"required"`
}

// Stake 质押接口
// @Summary 质押代币
// @Description 用户质押代币到流动性池
// @Tags stake
// @Accept json
// @Produce json
// @Param request body StakeRequest true "质押请求参数"
// @Success 200 {object} result.Response{data=model.StakeRecord}
// @Router /api/v1/stake [post]
func (s *StakeApi) Stake(c *gin.Context) {
	var req StakeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}

	// 验证地址格式
	if !commonUtil.ValidateHexAddress(req.UserAddress) {
		result.Error(c, result.InvalidParameter)
		return
	}
	// 将poolId字符串转换为int64
	poolId, err := commonUtil.ParseInt64(req.PoolId)
	if err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	stakeRecord, err := s.svc.ProcessStake(req.UserAddress, req.ChainId, req.Amount, req.Token, poolId)
	if err != nil {
		result.Error(c, result.StakeError)
		return
	}

	result.OK(c, stakeRecord)
}

// Withdraw godoc
// @Summary 提取质押的代币
// @Description 用户提取已质押的代币
// @Tags stake
// @Accept json
// @Produce json
// @Param request body WithdrawRequest true "提取请求参数"
// @Success 200 {object} result.Response{data=model.StakeRecord}
// @Router /api/v1/stake/withdraw [post]
func (s *StakeApi) Withdraw(c *gin.Context) {
	var req WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}

	if !commonUtil.ValidateHexAddress(req.UserAddress) {
		result.Error(c, result.InvalidParameter)
		return
	}
	// 将poolId字符串转换为int64
	poolId, err := commonUtil.ParseInt64(req.PoolId)
	if err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	// 将poolId字符串转换为int64
	stakeId, err := commonUtil.ParseInt64(req.StakeId)
	if err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	stakeRecord, err := s.svc.ProcessWithdraw(req.UserAddress, req.ChainId, stakeId, poolId)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	result.OK(c, stakeRecord)
}

// GetStakeRecords godoc
// @Summary 获取用户的质押记录
// @Description 分页获取用户的质押记录
// @Tags stake
// @Accept json
// @Produce json
// @Param userAddress query string true "用户地址"
// @Param chainId query int64 true "链ID"
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页大小" default(20)
// @Success 200 {object} result.Response{data=[]model.StakeRecord}
// @Router /api/v1/stake/records [get]
func (s *StakeApi) GetStakeRecords(c *gin.Context) {
	var req GetStakeRecordsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}

	// 验证地址格式
	if !commonUtil.ValidateHexAddress(req.UserAddress) {
		result.Error(c, result.InvalidParameter)
		return
	}

	// 构建分页参数
	pagination := dto.Pagination{
		Page:     req.Page,
		PageSize: req.PageSize,
		Offset:   (req.Page - 1) * req.PageSize,
	}

	records, total, err := s.svc.GetStakeRecords(req.UserAddress, req.ChainId, pagination)
	if err != nil {
		result.SysError(c, "获取记录失败: "+err.Error())
		return
	}

	// 创建分页响应
	response := map[string]interface{}{
		"records": records,
		"total":   total,
		"page":    req.Page,
		"size":    req.PageSize,
	}
	result.OK(c, response)
}

// GetStakeOverview 获取质押概览
// @Summary 获取用户的质押概览
// @Description 获取用户的总质押量、收益等信息
// @Tags stake
// @Accept json
// @Produce json
// @Param userAddress query string true "用户地址"
// @Param chainId query int64 true "链ID"
// @Success 200 {object} result.Response{data=model.StakeOverview}
// @Router /api/v1/stake/overview [get]
func (s *StakeApi) GetStakeOverview(c *gin.Context) {
	var req GetStakeOverviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}

	if !commonUtil.ValidateHexAddress(req.UserAddress) {
		result.Error(c, result.InvalidParameter)
		return
	}

	overview, err := s.svc.GetStakeOverview(req.UserAddress, req.ChainId)
	if err != nil {
		result.SysError(c, "获取概览失败: "+err.Error())
		return
	}

	result.OK(c, overview)
}
