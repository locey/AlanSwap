package db

import (
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
	"github.com/mumu/cryptoSwap/src/core/config"
	"github.com/mumu/cryptoSwap/src/core/log"
	"time"
)

var (
	rdb *redis.Client
	ctx = context.Background()
)

func InitRedis() *redis.Client {
	log.Logger.Info("Init Redis")
	rdb = redis.NewClient(&redis.Options{
		Addr:         config.Conf.Redis.Host + ":" + config.Conf.Redis.Port,
		Password:     config.Conf.Redis.Password,
		DB:           config.Conf.Redis.Db,
		IdleTimeout:  time.Duration(config.Conf.Redis.IdleTimeout) * time.Second,
		MinIdleConns: config.Conf.Redis.MaxIdle,
		PoolSize:     config.Conf.Redis.PoolSize, // 连接池大小
	})

	// 验证Redis连接
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Logger.Error(fmt.Sprintf("Failed to connect to Redis: %v", err))
	} else {
		log.Logger.Info("Redis connect success")
	}
	return rdb

}
