package evm

import (
	"context"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
	"math/big"
)

type Evm struct {
	client *ethclient.Client
}

func New(nodeUrl string) (*Evm, error) {
	c, err := ethclient.Dial(nodeUrl)
	if err != nil {
		log.Logger.Error("")
	}

	return &Evm{
		client: c,
	}, err
}

func (c *Evm) Client() interface{} {
	return c.client
}
func (c *Evm) GetBlockNumber() (uint64, error) {
	blockNumber, err := c.client.BlockNumber(context.Background())
	if err != nil {
		log.Logger.Error("getBlockNumber failed!", zap.Error(err))
		return blockNumber, err
	}
	return blockNumber, nil
}
func (c *Evm) GetFilterLogs(fromBlock *big.Int, toBlock *big.Int, contractAddress string) ([]types.Log, error) {
	q := ethereum.FilterQuery{
		FromBlock: fromBlock,
		ToBlock:   toBlock,
		Topics:    nil,
		Addresses: []common.Address{common.HexToAddress(contractAddress)},
	}
	logs, err := c.client.FilterLogs(context.Background(), q)
	if err != nil {
		log.Logger.Error("GetFilterLogs failed!", zap.Error(err))
		return nil, err
	}
	return logs, nil
}
