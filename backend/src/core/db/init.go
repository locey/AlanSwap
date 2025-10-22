package db

import (
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

// Mysql MySQL数据源备用
var Mysql *gorm.DB
var Pgsql *gorm.DB

var Redis *redis.Client

// DB 主数据源使用pgsql
var DB = Pgsql
