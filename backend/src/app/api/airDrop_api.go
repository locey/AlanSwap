package api

import (
	"math/big"
	"net/http"
	"strconv"
	"strings"

	ethcommon "github.com/ethereum/go-ethereum/common"
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/app/service"
	commonUtil "github.com/mumu/cryptoSwap/src/common"
	"github.com/mumu/cryptoSwap/src/core/result"
)

type AirDropApi struct {
	svc *service.AirDropService
}

func NewAirDropApi() *AirDropApi {
	return &AirDropApi{
		svc: service.NewAirDropService(),
	}
}

// extractWalletAddress 支持可选鉴权或query参数
func extractWalletAddress(c *gin.Context) string {
	// 优先从 Authorization: Bearer <token>
	auth := c.GetHeader("Authorization")
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		token := strings.TrimSpace(auth[len("Bearer "):])
		if token != "" {
			if claims, err := commonUtil.ValidateJWT(token); err == nil {
				addr := strings.ToLower(claims.Address)
				if ethcommon.IsHexAddress(addr) {
					return addr
				}
			}
		}
	}
	// 回退到 query 参数
	addr := strings.ToLower(c.Query("walletAddress"))
	if ethcommon.IsHexAddress(addr) {
		return addr
	}
	return ""
}

// Overview godoc
// @Summary      获取空投概览
// @Description  获取用户的空投概览信息
// @Tags airdrop
// @Accept       json
// @Produce      json
// @Param        Authorization  header  string  false  "Bearer token"
// @Param        walletAddress  query   string  false  "用户地址"
// @Success      200 {object} result.Response{data=map[string]interface{}}
// @Router       /api/v1/airdrop/overview [get]
func (a AirDropApi) Overview(c *gin.Context) {
	addr := extractWalletAddress(c)
	if addr == "" {
		result.Error(c, result.InvalidParameter)
		return
	}
	dto, err := a.svc.Overview(addr)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}
	result.OK(c, map[string]interface{}{
		"totalRewards":             dto.TotalRewards,
		"totalRewardsWeeklyChange": dto.TotalRewardsWeeklyChange,
		"claimedRewards":           dto.ClaimedRewards,
		"claimedRewardsValue":      dto.ClaimedRewardsValue,
		"pendingRewards":           dto.PendingRewards,
		"pendingRewardsValue":      dto.PendingRewardsValue,
	})
}

// Available godoc
// @Summary      获取可用的空投列表
// @Description  分页获取用户可用的空投列表
// @Tags airdrop
// @Accept       json
// @Produce      json
// @Param        Authorization  header  string  false  "Bearer token"
// @Param        walletAddress  query   string  false  "用户地址"
// @Param        page           query   int     false  "页码" default(1)
// @Param        size           query   int     false  "每页大小" default(20)
// @Success      200 {object} result.Response{data=map[string]interface{}}
// @Router       /api/v1/airdrop/available [get]
func (a AirDropApi) Available(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	if page <= 0 {
		page = 1
	}
	if size <= 0 || size > 100 {
		size = 20
	}

	addr := extractWalletAddress(c)
	// 未登录允许为空，后续查询时使用空地址

	total, list, err := a.svc.Available(addr, page, size)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}

	// 组装返回格式
	respList := make([]map[string]interface{}, 0, len(list))
	for _, it := range list {
		respItem := map[string]interface{}{
			"airdropId":         it.AirdropId,
			"name":              it.Name,
			"description":       it.Description,
			"airDropIcon":       it.AirDropIcon,
			"tokenSymbol":       it.TokenSymbol,
			"totalReward":       it.TotalReward,
			"userTotalReward":   it.UserTotalReward,
			"userClaimedReward": it.UserClaimedReward,
			"userPendingReward": it.UserPendingReward,
			"startTime":         it.StartTime.Format("2006-01-02 15:04:05"),
			"endTime":           it.EndTime.Format("2006-01-02 15:04:05"),
			"userCount":         it.UserCount,
			"status":            it.Status,
			"statusDesc":        it.StatusDesc,
		}
		// 任务列表
		taskArr := make([]map[string]interface{}, 0, len(it.TaskList))
		for _, t := range it.TaskList {
			taskArr = append(taskArr, map[string]interface{}{
				"taskId":   t.TaskId,
				"taskName": t.TaskName,
				"status":   t.Status,
			})
		}
		respItem["taskList"] = taskArr
		respList = append(respList, respItem)
	}

	result.OK(c, map[string]interface{}{
		"total": total,
		"list":  respList,
	})
}

// POST /api/v1/airdrop/ranking
func (a AirDropApi) Ranking(c *gin.Context) {
	airdropId := strings.TrimSpace(c.DefaultQuery("airdropId", ""))
	if airdropId != "" {
		if _, err := strconv.ParseUint(airdropId, 10, 64); err != nil {
			result.Error(c, result.InvalidParameter)
			return
		}
	}

	sortBy := strings.TrimSpace(c.DefaultQuery("sortBy", "amount"))
	if sortBy != "amount" && sortBy != "time" {
		sortBy = "amount"
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	if page <= 0 {
		page = 1
	}
	if size <= 0 || size > 100 {
		size = 20
	}

	showAddress := true
	if v := c.DefaultQuery("showAddress", "true"); strings.ToLower(v) == "false" {
		showAddress = false
	}

	currentUser := extractWalletAddress(c) // 可选，用于 currentUserRank

	dto, err := a.svc.Ranking(airdropId, sortBy, page, size, showAddress, currentUser)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}
	// 直接返回服务层数据结构映射
	result.OK(c, map[string]interface{}{
		"totalUsers":      dto.TotalUsers,
		"currentUserRank": dto.CurrentUserRank,
		"list":            dto.List,
		"tokenSymbol":     dto.TokenSymbol,
		"updateTime":      dto.UpdateTime,
	})
}

type UserTaskListRequest struct {
	Page          int    `json:"page"`
	Size          int    `json:"size"`
	WalletAddress string `json:"walletAddress"`
}

// POST /api/v1/userTask/list
func (a AirDropApi) UserTaskList(c *gin.Context) {
	var req UserTaskListRequest
	// 优先从JSON body获取参数
	if c.Request.Header.Get("Content-Type") == "application/json" {
		if err := c.ShouldBindJSON(&req); err != nil {
			// JSON解析失败，使用默认值
			req.Page = 1
			req.Size = 20
		}
	} else {
		// 从query参数获取（向后兼容）
		req.Page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
		req.Size, _ = strconv.Atoi(c.DefaultQuery("size", "20"))
		req.WalletAddress = extractWalletAddress(c)
	}

	// 参数验证
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Size <= 0 || req.Size > 100 {
		req.Size = 20
	}

	addr := req.WalletAddress
	if addr == "" {
		addr = extractWalletAddress(c) // 未登录允许为空
	}

	tasks, err := a.svc.UserTasks(addr, req.Page, req.Size)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}
	// 这里按规范返回必要字段；taskReward暂时返回"0"
	list := make([]map[string]interface{}, 0, len(tasks))
	for _, t := range tasks {
		list = append(list, map[string]interface{}{
			"taskId":      t.TaskId,
			"taskName":    t.TaskName,
			"description": "",  // 需要在tasks表维护，当前无
			"taskReward":  "0", // schema暂无该字段，先返回0
			"userStatus":  t.Status,
			"deadline":    0,      // 需要在tasks表维护，当前无
			"iconUrl":     "",     // 需要在tasks表维护，当前无
			"actionUrl":   "",     // 需要在tasks表维护，当前无
			"verifyType":  "auto", // 缺省auto
		})
	}
	result.OK(c, map[string]interface{}{
		"list": list,
	})
}

type ClaimRewardRequest struct {
	AirDropId     string `json:"airDropId"`
	WalletAddress string `json:"walletAddress"`
}

// POST /api/v1/airdrop/claimReward
func (a AirDropApi) ClaimReward(c *gin.Context) {
	var req ClaimRewardRequest
	var airdropId, addr string

	// 优先从JSON body获取参数
	if c.Request.Header.Get("Content-Type") == "application/json" {
		if err := c.ShouldBindJSON(&req); err == nil {
			airdropId = strings.TrimSpace(req.AirDropId)
			addr = strings.ToLower(strings.TrimSpace(req.WalletAddress))
		}
	}

	// 如果JSON解析失败或为空，使用原有逻辑
	if airdropId == "" {
		airdropId = strings.TrimSpace(c.DefaultQuery("airDropId", c.PostForm("airDropId")))
	}
	if addr == "" {
		addr = extractWalletAddress(c)
		if addr == "" {
			// 未登录用户必须传walletAddress
			addr = strings.ToLower(strings.TrimSpace(c.DefaultQuery("walletAddress", c.PostForm("walletAddress"))))
			if !ethcommon.IsHexAddress(addr) {
				c.JSON(http.StatusOK, gin.H{"code": result.InvalidParameter, "msg": "Invalid walletAddress", "data": nil})
				return
			}
		}
	}
	if airdropId == "" {
		result.Error(c, result.InvalidParameter)
		return
	}
	if _, err := strconv.ParseUint(airdropId, 10, 64); err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	proof, err := a.svc.ClaimProof(airdropId, addr)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}
	result.OK(c, map[string]interface{}{
		"airDropId": airdropId,
		"prof":      proof,
	})
}

// AdminUpdateMerkleRootRequest 请求体
type AdminUpdateMerkleRootRequest struct {
	AirdropId  string `json:"airdropId"`
	NewRoot    string `json:"newRoot"` // 0x 前缀的 bytes32
	NewVersion uint32 `json:"newVersion"`
}

// POST /api/v1/airdrop/admin/updateMerkleRoot
func (a AirDropApi) AdminUpdateMerkleRoot(c *gin.Context) {
	var req AdminUpdateMerkleRootRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		result.Error(c, result.InvalidParameter)
		return
	}
	if req.AirdropId == "" || len(req.NewRoot) != 66 || !strings.HasPrefix(strings.ToLower(req.NewRoot), "0x") {
		result.Error(c, result.InvalidParameter)
		return
	}
	// 解析参数
	aid := new(big.Int)
	aid.SetString(req.AirdropId, 10)
	var root ethcommon.Hash
	root = ethcommon.HexToHash(req.NewRoot)

	svc := service.NewAirdropAdminService()
	txHash, err := svc.UpdateMerkleRoot(aid, root, req.NewVersion)
	if err != nil {
		result.Error(c, result.DBQueryFailed)
		return
	}
	result.OK(c, map[string]interface{}{
		"txHash": txHash,
	})
}
