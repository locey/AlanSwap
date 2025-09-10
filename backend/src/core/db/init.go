package db

import "gorm.io/gorm"

// Mysql MySQL数据源备用
var Mysql *gorm.DB
var Pgsql *gorm.DB

//var Redis *redis.Pool

// DB 主数据源使用pgsql
var DB = Pgsql
