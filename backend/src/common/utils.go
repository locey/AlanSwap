package common

import (
	"path/filepath"
	"runtime"
)

// GetCurrentAbPath 获取当前项目绝对路径
func GetCurrentAbPath() string {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return ""
	}

	// 获取当前文件所在目录
	dir := filepath.Dir(filename)

	// 获取上两级目录
	abPath := filepath.Join(dir, "..", "..")

	// Clean 会清理多余的 ../ 和 . 等符号，确保路径合法
	clean := filepath.Clean(abPath)
	return clean
}

func GetConfigAbPath() string {
	return GetCurrentAbPath() + "/config"
}
