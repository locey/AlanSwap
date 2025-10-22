package core

import (
	"context"
	"fmt"
	"net/http"

	"github.com/mumu/cryptoSwap/src/abi"
	"github.com/mumu/cryptoSwap/src/app/sync"
	"github.com/mumu/cryptoSwap/src/core/chainclient"
	"github.com/mumu/cryptoSwap/src/core/config"
	"github.com/mumu/cryptoSwap/src/core/ctx"
	"github.com/mumu/cryptoSwap/src/core/db"
	"github.com/mumu/cryptoSwap/src/core/gin/router"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
)

// Start
// @Summary 启动应用服务
// @Description 根据配置文件和服务器类型启动相应的服务
// @Tags system
// @Accept json
// @Produce json
// @Param configFile query string true "配置文件路径"
// @Param serverType query int true "服务器类型 (1: API服务, 2: 监听服务)"
// @Router /start [post]
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
	// 初始化ABI管理器
	abi.InitABIManager()
	if serverType == 1 {
		initApiGin()
	} else if serverType == 2 {
		//开启线程获取scan log
		initSync(c)
		//计算积分
		initComputeIntegral()
		// 初始化Gin
		initGin()

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
		log.Logger.Info("正在初始化链客户端", zap.Int("chain_id", chain.ChainId), zap.String("endpoint", chain.Endpoint))
		client, err := chainclient.New(chain.ChainId, chain.Endpoint)
		if err != nil {
			log.Logger.Error("init chain client error", zap.Error(err))
			panic(err)
		}

		chainMap[chain.ChainId] = &client
		log.Logger.Info("链客户端初始化成功", zap.Int("chain_id", chain.ChainId))
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
