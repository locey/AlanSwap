# Chain表服务配置示例

## 问题说明
质押池和流动性池监听服务都需要在chain表中配置，但之前存在以下冲突：
1. 两个服务都使用同一个`last_block_num`字段，导致区块号冲突
2. 无法区分哪个配置是给质押池用的，哪个是给流动性池用的

## 解决方案
在chain表中添加`service_type`字段来区分服务类型：
- `staking`: 质押池服务配置
- `liquidity`: 流动性池服务配置

## 配置示例

### 为同一个链配置两个不同的服务

```sql
-- 为Sepolia测试网配置质押池服务
INSERT INTO chain (chain_id, chain_name, address, service_type, last_block_num) 
VALUES (11155111, 'sepolia-staking', '0x质押池合约地址', 'staking', 0);

-- 为Sepolia测试网配置流动性池服务
INSERT INTO chain (chain_id, chain_name, dex_address, service_type, last_block_num)
VALUES (11155111, 'sepolia-liquidity', '0x流动性池合约地址', 'liquidity', 0);
```

### 字段说明
- `chain_id`: 链ID（两个服务可以相同）
- `chain_name`: 链名称（建议加上服务类型后缀）
- `address`: 质押池合约地址（仅staking服务需要）
- `dex_address`: 流动性池合约地址（仅liquidity服务需要）
- `service_type`: 服务类型（staking/liquidity）
- `last_block_num`: 最后处理的区块号（每个服务独立维护）

## 服务启动
现在两个服务可以同时运行，互不干扰：
- 质押池服务只会查询和更新`service_type = 'staking'`的记录
- 流动性池服务只会查询和更新`service_type = 'liquidity'`的记录
