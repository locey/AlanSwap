package main

import "github.com/mumu/cryptoSwap/src/core"

const (
	// ConfigFile 配置文件路径
	ConfigFile = "config.toml"
)

func main() {
	core.Start(ConfigFile)
}
