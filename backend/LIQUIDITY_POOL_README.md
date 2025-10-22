# 流动性池事件监听功能

本项目已成功集成流动性池事件监听功能，可以实时获取并存储DEX合约的流动性池事件数据。

## 功能特性

### 1. 支持的事件类型
- **Swap**: 代币交换事件
- **Mint (AddLiquidity)**: 添加流动性事件  
- **Burn (RemoveLiquidity)**: 移除流动性事件

### 2. 数据存储
- **流动性池事件表** (`liquidity_pool_events`): 存储所有事件详情
- **流动性池信息表** (`liquidity_pools`): 存储池子基本信息

### 3. API接口
- `GET /api/v1/liquidity-pools`: 获取流动性池列表
- `GET /api/v1/liquidity-pool-events`: 获取流动性池事件列表
- `GET /api/v1/liquidity-pool-stats`: 获取流动性池统计信息

## 配置说明

### 1. 配置文件修改
在 `config/config.toml` 中添加了合约配置：

```toml
[contract_cfg]
dex_address = "0x72e46e15ef83c896de44B1874B4AF7dDAB5b4F74" # DEX合约地址
```

### 2. 数据库表结构
执行 `src/app/migration/liquidity_pool_migration.sql` 来创建必要的数据库表。

## 使用方法

### 1. 启动服务
服务启动后会自动开始监听流动性池事件，无需额外配置。

### 2. API调用示例

#### 获取流动性池列表
```bash
curl "http://localhost:8100/api/v1/liquidity-pools?chainId=11155111&page=1&pageSize=20"
```

#### 获取流动性池事件
```bash
curl "http://localhost:8100/api/v1/liquidity-pool-events?chainId=11155111&poolAddress=0x...&eventType=Swap"
```

#### 获取统计信息
```bash
curl "http://localhost:8100/api/v1/liquidity-pool-stats?chainId=11155111"
```

### 3. 参数说明

#### 流动性池列表接口参数
- `chainId`: 链ID (可选)
- `page`: 页码 (默认: 1)
- `pageSize`: 每页大小 (默认: 20, 最大: 100)

#### 流动性池事件接口参数
- `chainId`: 链ID (可选)
- `poolAddress`: 池子地址 (可选)
- `eventType`: 事件类型 (可选: Swap, AddLiquidity, RemoveLiquidity)
- `userAddress`: 用户地址 (可选)
- `page`: 页码 (默认: 1)
- `pageSize`: 每页大小 (默认: 20, 最大: 100)

## 数据结构

### 流动性池事件 (LiquidityPoolEvent)
```json
{
  "id": 1,
  "chainId": 11155111,
  "txHash": "0x...",
  "blockNumber": 12345678,
  "eventType": "Swap",
  "poolAddress": "0x...",
  "token0Address": "0x...",
  "token1Address": "0x...",
  "userAddress": "0x...",
  "amount0In": "1000000000000000000",
  "amount1In": "0",
  "amount0Out": "0",
  "amount1Out": "2000000000000000000",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 流动性池信息 (LiquidityPool)
```json
{
  "id": 1,
  "chainId": 11155111,
  "poolAddress": "0x...",
  "token0Address": "0x...",
  "token1Address": "0x...",
  "token0Symbol": "WETH",
  "token1Symbol": "USDC",
  "token0Decimals": 18,
  "token1Decimals": 6,
  "reserve0": "1000000000000000000000",
  "reserve1": "2000000000000",
  "totalSupply": "1000000000000000000000",
  "price": "2000.000000000000000000",
  "volume24h": "500000000000000000000",
  "txCount": 1500,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 技术实现

### 1. 事件监听
- 使用以太坊的 `eth_getLogs` 方法监听合约事件
- 支持多链同时监听
- 自动处理区块回滚和重连

### 2. 数据解析
- 自动解析事件参数 (Topics 和 Data)
- 支持大数处理 (使用字符串存储)
- 错误处理和日志记录

### 3. 数据存储
- 批量插入提高性能
- 事务处理确保数据一致性
- 自动更新池子统计信息

## 监控和日志

系统会记录以下关键信息：
- 事件监听状态
- 数据解析结果
- 数据库操作结果
- 错误和异常信息

## 注意事项

1. **合约地址配置**: 确保在配置文件中正确设置DEX合约地址
2. **数据库权限**: 确保应用有创建表和索引的权限
3. **网络连接**: 确保RPC节点连接稳定
4. **存储空间**: 流动性池事件数据量可能很大，注意监控存储空间

## 扩展功能

未来可以扩展的功能：
- 实时价格计算
- 交易量统计
- 用户行为分析
- 流动性挖矿数据
- 套利机会检测
