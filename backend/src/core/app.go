package core

import (
	"context"
	"fmt"
	"github.com/mumu/cryptoSwap/src/app/sync"
	"github.com/mumu/cryptoSwap/src/core/chainclient"
	"github.com/mumu/cryptoSwap/src/core/config"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/db"
	"github.com/mumu/cryptoSwap/src/core/gin/router"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
	"net/http"
)

// Start
//
//	@Description:
//	@param configFile
//	@param serverType  为了简单区分不同的服务类型，1 代表 api服务  2 代表监听服务
func Start(configFile string, serverType int) {
	c, cancel := context.WithCancel(context.Background())
	defer cancel()
	// 初始化配置信息
	initConfig(configFile)
	// 初始化日志组件
	initLog()
	// 启用性能监控组件
	initPprof()
	// 初始化数据库/Redis
	initDB()
	// 初始化区块链客户端
	initChainClient()

	if serverType == 1 {
		initApiGin()
	} else if serverType == 2 {
		// 初始化Gin
		initGin()
		//开启线程获取scan log
		initSync(c)
		//计算积分
		initComputeIntegral()
	}
}
func initConfig(configFile string) {
	ctx.Ctx.Config = config.InitConfig(configFile)
}
func initPprof() {
	if !config.Conf.Monitor.PprofEnable {
		return
	}
	log.Logger.Info("init pprof")
	go func() {
		err := http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", config.Conf.Monitor.PprofPort), nil)
		if err != nil {
			log.Logger.Error("init pprof error", zap.Error(err))
			return
		}
	}()
}
func initLog() {
	ctx.Ctx.Log = log.InitLog()
}
func initDB() {
	ctx.Ctx.DB = db.InitPgsql()
	ctx.Ctx.Redis = db.InitRedis()
}
func initChainClient() {
	chainMap := make(map[int]*chainclient.ChainClient)
	for _, chain := range config.Conf.Chains {
		client, err := chainclient.New(chain.ChainId, chain.Endpoint)
		if err != nil {
			log.Logger.Error("init chain client error", zap.Error(err))
			panic(err)
		}

		chainMap[chain.ChainId] = &client
	}

	ctx.Ctx.ChainMap = chainMap
}
func initGin() {
	r := router.InitRouter()
	ctx.Ctx.Gin = r
	router.Bind(r, &ctx.Ctx)
	err := r.Run(":" + ctx.Ctx.Config.App.Port)
	if err != nil {
		panic(err)
	}
}

func initApiGin() {
	r := router.InitRouter()
	ctx.Ctx.Gin = r
	router.ApiBind(r, &ctx.Ctx)
	err := r.Run(":" + ctx.Ctx.Config.App.APIPort)
	if err != nil {
		panic(err)
	}
}

func initSync(c context.Context) {
	sync.StartSync(c)
}
func initComputeIntegral() {
	sync.InitComputeIntegral()
}
