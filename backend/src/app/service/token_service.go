package service

import (
	"context"
	"fmt"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/mumu/cryptoSwap/src/abi"
	"github.com/mumu/cryptoSwap/src/core/ctx"
)

type TokenService struct {
	cache map[string]struct {
		symbol   string
		decimals int
	}
}

func NewTokenService() *TokenService {
	return &TokenService{
		cache: make(map[string]struct {
			symbol   string
			decimals int
		}),
	}
}

// 获取代币元数据（带缓存）
func (s *TokenService) GetTokenDetails(tokenAddress string, chainID int64) (string, int, error) {
	if cached, exists := s.cache[tokenAddress]; exists {
		return cached.symbol, cached.decimals, nil
	}

	// 实际RPC调用逻辑
	symbol, decimals, err := s.getTokenDetailsFromChain(tokenAddress, chainID)
	if err != nil {
		return "", 0, err
	}

	// 更新缓存
	s.cache[tokenAddress] = struct {
		symbol   string
		decimals int
	}{symbol: symbol, decimals: decimals}

	return symbol, decimals, nil
}

// 添加ABI调用实现
func (s *TokenService) getTokenDetailsFromChain(tokenAddress string, chainID int64) (string, int, error) {
	client := ctx.GetEvmClient(int(chainID)) // 使用默认链ID
	contractAddress := common.HexToAddress(tokenAddress)

	// 使用ABI管理器获取ERC20 ABI
	abiManager := abi.GetABIManager()
	erc20ABI, exists := abiManager.GetABI("ERC20")
	if !exists {
		return "", 0, fmt.Errorf("ERC20 ABI not found")
	}

	// 调用symbol方法
	symbolData, _ := erc20ABI.Pack("symbol")
	symbolRes, _ := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contractAddress,
		Data: symbolData,
	}, nil)

	// 调用decimals方法
	decimalsData, _ := erc20ABI.Pack("decimals")
	decimalsRes, _ := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contractAddress,
		Data: decimalsData,
	}, nil)

	// 解析结果
	var symbol string
	erc20ABI.UnpackIntoInterface(&symbol, "symbol", symbolRes)

	var decimals uint8
	erc20ABI.UnpackIntoInterface(&decimals, "decimals", decimalsRes)

	return symbol, int(decimals), nil
}
