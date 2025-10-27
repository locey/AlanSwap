package abi

import "github.com/ethereum/go-ethereum/accounts/abi"

// ABI名称常量
const (
	ABIUniswapV2Pair    = "UniswapV2Pair"
	ABIERC20            = "ERC20"
	ABIUniswapV2Factory = "UniswapV2Factory"
	ABIMerkleAirdrop    = "MerkleAirdrop"
	STAKEV2             = "StakeV2"
)

// 便捷函数 - 获取UniswapV2Pair ABI
func GetUniswapV2PairABI() abi.ABI {
	return GetABIManager().MustGetABI(ABIUniswapV2Pair)
}

// 便捷函数 - 获取ERC20 ABI
func GetERC20ABI() abi.ABI {
	return GetABIManager().MustGetABI(ABIERC20)
}
func GetStakeV2ABI() abi.ABI {
	return GetABIManager().MustGetABI(STAKEV2)
}

// 便捷函数 - 获取UniswapV2Factory ABI
func GetUniswapV2FactoryABI() abi.ABI {
	return GetABIManager().MustGetABI(ABIUniswapV2Factory)
}

// 便捷函数 - 获取MerkleAirdrop ABI
func GetMerkleAirdropABI() abi.ABI {
	return GetABIManager().MustGetABI(ABIMerkleAirdrop)
}
