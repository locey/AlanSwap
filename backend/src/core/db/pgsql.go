package db

import (
	"fmt"
	"github.com/mumu/cryptoSwap/src/core/config"
	"github.com/mumu/cryptoSwap/src/core/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"os"
)

func InitPgsql() *gorm.DB {
	log.Logger.Info("Init Pgsql")
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		config.Conf.Pgsql.Host,
		config.Conf.Pgsql.Username,
		config.Conf.Pgsql.Password,
		config.Conf.Pgsql.Database,
		config.Conf.Pgsql.Port,
	)

	gormConfig := &gorm.Config{}
	if os.Getenv("GORM_DEBUG") == "true" {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	}
	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		panic(err)
	}
	DB = db
	return db
}
