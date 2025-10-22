package chainclient

import (
	"errors"
	"github.com/mumu/cryptoSwap/src/common/chain"
	"github.com/mumu/cryptoSwap/src/core/chainclient/evm"
)

type ChainClient interface {
	Client() interface{}
}

func New(chainId int, endpoint string) (ChainClient, error) {
	switch chainId {
	case chain.EthChainID, chain.OptimismChainID, chain.SepoliaChainID:
		return evm.New(endpoint)
	default:
		return nil, errors.New("unsupported chain id")
	}
}
