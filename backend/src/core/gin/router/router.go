package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/gin/middleware"
	"time"
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
