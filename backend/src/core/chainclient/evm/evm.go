package evm

import (
	"context"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
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

func (c *Evm) GetUserAddress(vLog types.Log) (string, error) {
	// 获取原始交易
	tx, _, err := c.client.TransactionByHash(context.Background(), vLog.TxHash)
	if err != nil {
		log.Logger.Error("获取交易失败",
			zap.String("txHash", vLog.TxHash.Hex()),
			zap.Error(err))
		return "0x0000000000000000000000000000000000000000", err
	}

	// 解析交易发送者
	signer := types.LatestSignerForChainID(tx.ChainId())
	from, err := types.Sender(signer, tx)
	if err != nil {
		log.Logger.Warn("解析发送者地址失败",
			zap.String("txHash", tx.Hash().Hex()),
			zap.Error(err))
		// 返回零地址作为fallback
		return "0x0000000000000000000000000000000000000000", nil
	}

	return from.Hex(), nil
}

// GetFilterLogsWithTopics 获取带有特定主题的日志
func (c *Evm) GetFilterLogsWithTopics(fromBlock *big.Int, toBlock *big.Int, contractAddresses []string, topics [][]common.Hash) ([]types.Log, error) {
	addresses := make([]common.Address, len(contractAddresses))
	for i, addr := range contractAddresses {
		addresses[i] = common.HexToAddress(addr)
	}

	q := ethereum.FilterQuery{
		FromBlock: fromBlock,
		ToBlock:   toBlock,
		Topics:    topics,
		Addresses: addresses,
	}
	logs, err := c.client.FilterLogs(context.Background(), q)
	if err != nil {
		log.Logger.Error("GetFilterLogsWithTopics failed!", zap.Error(err))
		return nil, err
	}
	return logs, nil
}

// GetBlockByNumber 根据区块号获取区块信息
func (c *Evm) GetBlockByNumber(blockNumber *big.Int) (*types.Block, error) {
	block, err := c.client.BlockByNumber(context.Background(), blockNumber)
	if err != nil {
		log.Logger.Error("GetBlockByNumber failed!", zap.Error(err))
		return nil, err
	}
	return block, nil
}
