package ctx

import (
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/mumu/cryptoSwap/src/core/chainclient"
	"github.com/mumu/cryptoSwap/src/core/config"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var Ctx = Context{}

type Context struct {
	Config   *config.Config
	DB       *gorm.DB
	Redis    *redis.Client
	Log      *zap.Logger
	ChainMap map[int]*chainclient.ChainClient
	Gin      *gin.Engine
}

func GetClient(chainId int) chainclient.ChainClient {
	return *Ctx.ChainMap[chainId]
}

func GetEvmClient(chainId int) *ethclient.Client {
	client := GetClient(chainId)
	return client.Client().(*ethclient.Client)
}
