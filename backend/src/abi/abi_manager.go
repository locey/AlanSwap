package abi

import (
	"io/ioutil"
	"os"
	"strings"
	"sync"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
)

// ABI管理器单例
type ABIManager struct {
	abis map[string]abi.ABI
	mu   sync.RWMutex
}

var (
	instance *ABIManager
	once     sync.Once
)

// GetABIManager 获取ABI管理器单例
func GetABIManager() *ABIManager {
	once.Do(func() {
		instance = &ABIManager{
			abis: make(map[string]abi.ABI),
		}
	})
	return instance
}

// LoadABI 加载ABI文件
func (am *ABIManager) LoadABI(abiName, filePath string) error {
	am.mu.Lock()
	defer am.mu.Unlock()

	// 如果已经加载过，直接返回
	if _, exists := am.abis[abiName]; exists {
		return nil
	}

	abiData, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Logger.Error("加载ABI文件失败",
			zap.String("abiName", abiName),
			zap.String("filePath", filePath),
			zap.Error(err))
		return err
	}

	parsedABI, err := abi.JSON(strings.NewReader(string(abiData)))
	if err != nil {
		log.Logger.Error("解析ABI失败",
			zap.String("abiName", abiName),
			zap.Error(err))
		return err
	}

	am.abis[abiName] = parsedABI
	log.Logger.Info("ABI加载成功", zap.String("abiName", abiName))
	return nil
}

// GetABI 获取ABI实例
func (am *ABIManager) GetABI(abiName string) (abi.ABI, bool) {
	am.mu.RLock()
	defer am.mu.RUnlock()

	abiInstance, exists := am.abis[abiName]
	return abiInstance, exists
}

// MustGetABI 获取ABI实例，如果不存在则panic
func (am *ABIManager) MustGetABI(abiName string) abi.ABI {
	am.mu.RLock()
	defer am.mu.RUnlock()

	abiInstance, exists := am.abis[abiName]
	if !exists {
		panic("ABI not found: " + abiName)
	}
	return abiInstance
}

// isRunningInContainer 检测是否在容器中运行
func isRunningInContainer() bool {
	// 检查是否存在.dockerenv文件
	if _, err := os.Stat("/.dockerenv"); err == nil {
		return true
	}

	// 检查cgroup信息中是否包含docker
	if data, err := ioutil.ReadFile("/proc/1/cgroup"); err == nil {
		if strings.Contains(string(data), "docker") {
			return true
		}
	}

	return false
}

// getABIPath 根据运行环境获取ABI文件路径
func getABIPath(basePath string) string {
	if isRunningInContainer() {
		// 在容器中运行，使用/app/config路径
		return "/app/config/" + basePath
	}
	// 在本地运行，使用相对路径
	return "config/" + basePath
}

// PreloadCommonABIs 预加载常用ABI
func (am *ABIManager) PreloadCommonABIs() error {
	// 定义基础路径（不包含前缀）
	commonABIs := map[string]string{
		"UniswapV2Pair":    "uniswap_v2_pair.abi.json",
		"ERC20":            "erc20.abi.json",
		"UniswapV2Factory": "uniswap_v2_factory.abi.json",
		"MerkleAirdrop":    "merkle_airdrop.abi.json",
		"StakeV2":          "StakeV2.abi.json",
	}

	for name, basePath := range commonABIs {
		// 根据环境获取完整路径
		path := getABIPath(basePath)
		if err := am.LoadABI(name, path); err != nil {
			log.Logger.Warn("预加载ABI失败",
				zap.String("name", name),
				zap.String("path", path))
			// 继续加载其他ABI，不中断
		}
	}

	return nil
}

// InitABIManager 初始化ABI管理器
func InitABIManager() {
	manager := GetABIManager()

	// 预加载常用ABI
	if err := manager.PreloadCommonABIs(); err != nil {
		log.Logger.Warn("预加载常用ABI时出现错误", zap.Error(err))
	}

	log.Logger.Info("ABI管理器初始化完成")
}
