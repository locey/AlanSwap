package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/app/api"
	"github.com/mumu/cryptoSwap/src/core/config"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/gin/middleware"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func InitRouter() *gin.Engine {
	gin.ForceConsoleColor()
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()                             // 新建一个gin引擎实例
	r.Use(middleware.HttpLogMiddleware())      // 使用日志中间件
	r.Use(middleware.LanguageMiddleware())     // 使用语言中间件
	r.Use(middleware.RecoverPanicMiddleware()) // 使用恢复中间件

	r.Use(cors.New(cors.Config{ // 使用cors中间件
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "X-CSRF-Token", "Authorization", "AccessToken", "Token"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers", "X-GW-Error-Code", "X-GW-Error-Message"},
		AllowCredentials: true,
		MaxAge:           1 * time.Hour,
	}))

	return r
}
func Bind(r *gin.Engine, ctx *ctx.Context) {
	// 注册 swagger 路由
	//r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	//
	//v := r.Group("/api/" + config.Conf.App.Version)
	//
	//{
	//	demoApi := api.NewDemoApi()
	//	v.GET("/demo/page", demoApi.Page)
	//	v.POST("/demo/create", demoApi.Create)
	//	v.GET("/demo/:id", demoApi.GetById)
	//	v.PUT("/demo/:id", demoApi.Update)
	//	v.DELETE("/demo/:id", demoApi.Delete)
	//	v.GET("/demo/list", demoApi.List)
	//}
	//
	//{
	//	evmApi := api.NewEvmApi()
	//	v.GET("/evm/get_block_by_num/:block_num", evmApi.GetBlockByNum)
	//}

}

func ApiBind(r *gin.Engine, ctx *ctx.Context) {
	// 注册 swagger 路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v := r.Group("/api/" + config.Conf.App.Version)

	//不需要验证的接口
	authApi := api.NewAuthApi()
	v.GET("/auth/nonce/", authApi.GetNonce)
	v.POST("/auth/verify", authApi.Verify)
	v.POST("/auth/logout", authApi.Logout)

	//需要验证的接口
	author := r.Group("/api/" + config.Conf.App.Version)
	author.Use(middleware.AuthorMiddleware())

	liquidityPoolApi := api.NewLiquidityPoolApi()
	//1.新增：获取流动性池统计数据
	v.GET("/liquidity/stats", liquidityPoolApi.GetLiquidityStats)
	// 2.修改：POST 版本的池子列表（支持 all/my 和统计字段）
	v.POST("/liquidity/pools", liquidityPoolApi.PostLiquidityPools)
	// 3.修改：POST 流动性收益分布
	v.POST("/liquidity/rewardDistribution", liquidityPoolApi.GetRewardDistribution)
	// 4.修改：POST 池子表现（按用户地址返回 poolPair 与 24hVolume）
	v.POST("/liquidity/poolPerformance", liquidityPoolApi.GetPoolPerformance)
	//5.获取流动性池事件列表
	v.GET("/liquidity-pool-events", liquidityPoolApi.GetLiquidityPoolEvents)

	airDropApi := api.NewAirDropApi()
	// 空投相关接口（开放访问，地址可从token或参数解析）
	//我的空投奖励预览
	v.GET("/airdrop/overview", airDropApi.Overview)
	//获取用户可参与空投的列表
	v.GET("/airdrop/available", airDropApi.Available)
	//获取空投排行榜数据
	v.POST("/airdrop/ranking", airDropApi.Ranking)
	//任务列表数据
	v.POST("/userTask/list", airDropApi.UserTaskList)
	//用户领取空投（获取prof）
	v.POST("/airdrop/claimReward", airDropApi.ClaimReward)

	// 质押相关接口（需要验证）
	stakeApi := api.NewStakeApi()
	// 质押代币
	v.POST("/stake", stakeApi.Stake)
	// 提取质押的代币
	v.POST("/stake/withdraw", stakeApi.Withdraw)
	// 获取用户的质押记录
	v.POST("/stake/records", stakeApi.GetStakeRecords)
	// 获取用户的质押概览
	v.POST("/stake/overview", stakeApi.GetStakeOverview)
}
